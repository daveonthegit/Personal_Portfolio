package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"sort"
	"strings"
	"time"

	"github.com/daveonthegit/Personal_Portfolio/config"
	"github.com/joho/godotenv"

	"github.com/gorilla/mux"
	"gopkg.in/mail.v2"
)

type Server struct {
	templates                 *template.Template
	projects                  []Project
	emailConfig               EmailConfig
	assetVersion              string
	siteURL                   string
	contactAllowedOrigins     []string
	contactLimiter            *contactIPLimiter
	disableRuntimeResumeBuild bool
}

type EmailConfig struct {
	SMTPHost  string
	SMTPPort  int
	Username  string
	Password  string
	FromEmail string
	ToEmail   string
}

type ContactForm struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
	Website string `json:"website"` // honeypot — must be empty
}

type PageData struct {
	Title        string
	Description  string
	Projects     []Project
	ProjectTypes []string
	Personal     config.PersonalInfo
	Year         int
	TemplateName string
	AssetVersion string
	SiteURL      string
}

// resolveAssetVersion picks a cache-bust token without manual steps when possible:
// 1) ASSET_VERSION  2) GIT_COMMIT  3) SHA-256 digest of ./static files (picks up image/CSS/JS changes without rebuild)
// 4) VCS revision from go build  5) "dev"
func resolveAssetVersion() string {
	if v := strings.TrimSpace(getEnv("ASSET_VERSION", "")); v != "" {
		return v
	}
	if v := strings.TrimSpace(getEnv("GIT_COMMIT", "")); v != "" {
		return v
	}
	if fp := fingerprintStaticDir("static"); fp != "" {
		return fp
	}
	if rev := vcsRevisionFromBuild(); rev != "" {
		return rev
	}
	return "dev"
}

func vcsRevisionFromBuild() string {
	bi, ok := debug.ReadBuildInfo()
	if !ok {
		return ""
	}
	for _, s := range bi.Settings {
		if s.Key == "vcs.revision" && s.Value != "" {
			return s.Value
		}
	}
	return ""
}

// fingerprintStaticDir hashes all regular files under root (sorted paths) so any static asset change updates ?v=.
func fingerprintStaticDir(root string) string {
	st, err := os.Stat(root)
	if err != nil || !st.IsDir() {
		return ""
	}
	var relPaths []string
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return nil
		}
		relPaths = append(relPaths, filepath.ToSlash(rel))
		return nil
	})
	if len(relPaths) == 0 {
		return ""
	}
	sort.Strings(relPaths)

	h := sha256.New()
	for _, rel := range relPaths {
		p := filepath.Join(root, rel)
		b, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		h.Write([]byte(rel))
		h.Write([]byte{0})
		h.Write(b)
		h.Write([]byte{0})
	}
	sum := h.Sum(nil)
	return hex.EncodeToString(sum[:10])
}

func NewServer() *Server {
	// Load projects data and fix missing image paths
	projects := EnsureProjectImages(LoadProjects())

	assetVer := resolveAssetVersion()

	// Parse all templates (asset() appends cache-bust query to static URLs)
	templates, err := template.New("").Funcs(template.FuncMap{
		"asset": func(path string) string {
			if strings.TrimSpace(path) == "" {
				return ""
			}
			sep := "?"
			if strings.Contains(path, "?") {
				sep = "&"
			}
			return path + sep + "v=" + url.QueryEscape(assetVer)
		},
	}).ParseGlob("templates/*.html")
	if err != nil {
		log.Fatal("Error parsing templates:", err)
	}
	siteURL := strings.TrimSuffix(getEnv("SITE_URL", "https://www.davidxiao.dev"), "/")

	// Initialize email configuration from environment variables
	emailConfig := EmailConfig{
		SMTPHost:  getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:  getEnvInt("SMTP_PORT", 587),
		Username:  getEnv("SMTP_USERNAME", ""),
		Password:  getEnv("SMTP_PASSWORD", ""),
		FromEmail: getEnv("FROM_EMAIL", ""),
		ToEmail:   getEnv("TO_EMAIL", ""),
	}

	if emailConfig.Username == "" || emailConfig.Password == "" || emailConfig.ToEmail == "" {
		log.Printf("⚠️  Email configuration incomplete - please check your .env file")
		log.Printf("Required: SMTP_USERNAME, SMTP_PASSWORD, TO_EMAIL")
	}

	allowedOrigins := parseListEnv("ALLOWED_ORIGINS")
	disableResume := strings.EqualFold(getEnv("DISABLE_RUNTIME_RESUME_BUILD", ""), "true")

	return &Server{
		templates:                 templates,
		projects:                  projects,
		emailConfig:               emailConfig,
		assetVersion:              assetVer,
		siteURL:                   siteURL,
		contactAllowedOrigins:     allowedOrigins,
		contactLimiter:            newContactIPLimiter(15*time.Minute, 10),
		disableRuntimeResumeBuild: disableResume,
	}
}

func (s *Server) terminalHandler(w http.ResponseWriter, r *http.Request) {
	personal := config.GetPersonalInfo()
	data := PageData{
		Title:        "xiaoOS Terminal - " + personal.Name,
		Description:  "Welcome to xiaoOS - Portfolio system initialization and access point.",
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: "terminal",
		AssetVersion: s.assetVersion,
		SiteURL:      s.siteURL,
	}

	if err := s.templates.ExecuteTemplate(w, "terminal.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) homeHandler(w http.ResponseWriter, r *http.Request) {
	data := s.pageDataFor("home")

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) aboutHandler(w http.ResponseWriter, r *http.Request) {
	data := s.pageDataFor("about")

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) projectsHandler(w http.ResponseWriter, r *http.Request) {
	data := s.pageDataFor("projects")

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) contactHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		data := s.pageDataFor("contact")

		if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			log.Printf("Template execution error: %v", err)
		}
		return
	}

	if r.Method == "POST" {
		s.handleContactForm(w, r)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (s *Server) resumeHandler(w http.ResponseWriter, r *http.Request) {
	data := s.pageDataFor("resume")

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) resumePDFHandler(w http.ResponseWriter, r *http.Request) {
	texPath := "./static/assets/resume.tex"
	pdfPath := "./static/assets/resume.pdf"

	if s.disableRuntimeResumeBuild {
		if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
			http.Error(w, "Resume PDF is not available (built at deploy time).", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", "inline; filename=\"David_Xiao_Resume.pdf\"")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		http.ServeFile(w, r, pdfPath)
		return
	}

	// Check if LaTeX file exists
	if _, err := os.Stat(texPath); os.IsNotExist(err) {
		http.Error(w, "Resume LaTeX file not found", http.StatusNotFound)
		return
	}

	// Check if PDF exists and is newer than LaTeX file
	texInfo, err := os.Stat(texPath)
	if err != nil {
		http.Error(w, "Error reading LaTeX file", http.StatusInternalServerError)
		return
	}

	pdfInfo, err := os.Stat(pdfPath)
	needsRebuild := os.IsNotExist(err) || pdfInfo.ModTime().Before(texInfo.ModTime())

	if needsRebuild {
		// Build PDF from LaTeX
		if err := s.buildPDFFromLaTeX(texPath, pdfPath); err != nil {
			// Try using the existing build script as fallback
			if err := s.buildPDFUsingScript(); err != nil {
				// If all else fails, create a simple HTML fallback
				if err := s.createHTMLFallback(texPath, pdfPath); err != nil {
					http.Error(w, "Failed to build PDF from LaTeX: "+err.Error(), http.StatusInternalServerError)
					return
				}
			}
		}
	}

	// Set headers for PDF display (inline)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=\"David_Xiao_Resume.pdf\"")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	http.ServeFile(w, r, pdfPath)
}

func (s *Server) resumeDownloadHandler(w http.ResponseWriter, r *http.Request) {
	texPath := "./static/assets/resume.tex"
	pdfPath := "./static/assets/resume.pdf"

	if s.disableRuntimeResumeBuild {
		if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
			http.Error(w, "Resume PDF is not available (built at deploy time).", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", "attachment; filename=\"David_Xiao_Resume.pdf\"")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		http.ServeFile(w, r, pdfPath)
		return
	}

	// Check if LaTeX file exists
	if _, err := os.Stat(texPath); os.IsNotExist(err) {
		http.Error(w, "Resume LaTeX file not found", http.StatusNotFound)
		return
	}

	// Check if PDF exists and is newer than LaTeX file
	texInfo, err := os.Stat(texPath)
	if err != nil {
		http.Error(w, "Error reading LaTeX file", http.StatusInternalServerError)
		return
	}

	pdfInfo, err := os.Stat(pdfPath)
	needsRebuild := os.IsNotExist(err) || pdfInfo.ModTime().Before(texInfo.ModTime())

	if needsRebuild {
		// Build PDF from LaTeX
		if err := s.buildPDFFromLaTeX(texPath, pdfPath); err != nil {
			// Try using the existing build script as fallback
			if err := s.buildPDFUsingScript(); err != nil {
				// If all else fails, create a simple HTML fallback
				if err := s.createHTMLFallback(texPath, pdfPath); err != nil {
					http.Error(w, "Failed to build PDF from LaTeX: "+err.Error(), http.StatusInternalServerError)
					return
				}
			}
		}
	}

	// Set headers for PDF download (attachment)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"David_Xiao_Resume.pdf\"")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	http.ServeFile(w, r, pdfPath)
}

func (s *Server) buildPDFFromLaTeX(texPath, pdfPath string) error {
	assetsDir, err := filepath.Abs(filepath.Dir(texPath))
	if err != nil {
		return fmt.Errorf("resolve assets directory: %w", err)
	}

	engines := []struct {
		name string
		args []string
	}{
		{"latexmk", []string{"latexmk", "-pdf", "-interaction=nonstopmode", "resume.tex"}},
		{"lualatex", []string{"lualatex", "-interaction=nonstopmode", "resume.tex"}},
		{"xelatex", []string{"xelatex", "-interaction=nonstopmode", "resume.tex"}},
		{"pdflatex", []string{"pdflatex", "-interaction=nonstopmode", "resume.tex"}},
	}

	var lastErr error
	for _, engine := range engines {
		bin := engine.args[0]
		if _, err := exec.LookPath(bin); err != nil {
			continue
		}

		run := func() ([]byte, error) {
			cmd := exec.Command(engine.args[0], engine.args[1:]...)
			cmd.Dir = assetsDir
			return cmd.CombinedOutput()
		}

		output, err := run()
		if err == nil {
			s.cleanupAuxFilesInDir(assetsDir)
			if _, err := os.Stat(filepath.Join(assetsDir, "resume.pdf")); err == nil {
				return nil
			}
		}
		lastErr = fmt.Errorf("%s failed: %v\nOutput: %s", engine.name, err, string(output))

		if engine.name == "lualatex" || engine.name == "xelatex" || engine.name == "pdflatex" {
			_, err = run()
			if err == nil {
				s.cleanupAuxFilesInDir(assetsDir)
				if _, err := os.Stat(filepath.Join(assetsDir, "resume.pdf")); err == nil {
					return nil
				}
			}
		}
	}

	return fmt.Errorf("all LaTeX engines failed. Last error: %v", lastErr)
}

func (s *Server) cleanupAuxFilesInDir(dir string) {
	names := []string{"resume.aux", "resume.log", "resume.out", "resume.fdb_latexmk", "resume.fls", "resume.synctex.gz", "resume.toc", "resume.nav", "resume.snm"}
	for _, name := range names {
		_ = os.Remove(filepath.Join(dir, name))
	}
}

func (s *Server) buildPDFUsingScript() error {
	wd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("get working directory: %w", err)
	}
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command(filepath.Join(wd, "scripts", "build-resume.bat"))
	} else {
		cmd = exec.Command("bash", filepath.Join(wd, "scripts", "build-resume.sh"))
	}
	cmd.Dir = wd
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("build script failed: %v\nOutput: %s", err, string(output))
	}
	return nil
}

func (s *Server) createHTMLFallback(texPath, pdfPath string) error {
	// Create a simple HTML version as fallback
	htmlPath := strings.Replace(pdfPath, ".pdf", ".html", 1)

	// Read the LaTeX file
	texContent, err := os.ReadFile(texPath)
	if err != nil {
		return err
	}

	// Convert to HTML
	htmlContent := s.convertLaTeXToHTML(string(texContent))

	// Write HTML file
	if err := os.WriteFile(htmlPath, []byte(htmlContent), 0644); err != nil {
		return err
	}

	// Update the PDF handler to serve HTML instead
	return nil
}

func (s *Server) resumeHTMLHandler(w http.ResponseWriter, r *http.Request) {
	texPath := "./static/assets/resume.tex"
	htmlPath := "./static/assets/resume.html"

	if s.disableRuntimeResumeBuild {
		if _, err := os.Stat(htmlPath); os.IsNotExist(err) {
			http.Error(w, "Resume HTML is not available (built at deploy time).", http.StatusServiceUnavailable)
			return
		}
		http.ServeFile(w, r, htmlPath)
		return
	}

	// Check if LaTeX file exists
	if _, err := os.Stat(texPath); os.IsNotExist(err) {
		http.Error(w, "Resume LaTeX file not found", http.StatusNotFound)
		return
	}

	// Check if HTML exists and is newer than LaTeX file
	texInfo, err := os.Stat(texPath)
	if err != nil {
		http.Error(w, "Error reading LaTeX file", http.StatusInternalServerError)
		return
	}

	htmlInfo, err := os.Stat(htmlPath)
	needsRebuild := os.IsNotExist(err) || htmlInfo.ModTime().Before(texInfo.ModTime())

	if needsRebuild {
		// Try to convert LaTeX to HTML using pandoc
		cmd := exec.Command("pandoc", texPath, "-o", htmlPath, "--mathjax", "--standalone", "--css", "resume.css")
		cmd.Dir = "./static/assets"

		if err := cmd.Run(); err != nil {
			// If pandoc fails, try htlatex
			cmd = exec.Command("htlatex", "resume.tex", "xhtml,2", "charset=utf-8", "")
			cmd.Dir = "./static/assets"

			if err := cmd.Run(); err != nil {
				// If both fail, create a simple HTML version from the LaTeX content
				if err := s.createSimpleHTMLFromLaTeX(texPath, htmlPath); err != nil {
					http.Error(w, "Failed to create HTML from LaTeX", http.StatusInternalServerError)
					return
				}
			}
		}
	}

	// Serve the HTML file
	http.ServeFile(w, r, htmlPath)
}

func (s *Server) createSimpleHTMLFromLaTeX(texPath, htmlPath string) error {
	// Read the LaTeX file
	texContent, err := os.ReadFile(texPath)
	if err != nil {
		return err
	}

	// Simple LaTeX to HTML conversion
	htmlContent := s.convertLaTeXToHTML(string(texContent))

	// Write the HTML file
	return os.WriteFile(htmlPath, []byte(htmlContent), 0644)
}

func (s *Server) convertLaTeXToHTML(texContent string) string {
	// Basic LaTeX to HTML conversion
	html := `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>David Xiao - Resume</title>
    <link rel="stylesheet" href="resume.css">
</head>
<body>
`

	// Extract content between \begin{document} and \end{document}
	start := "\\begin{document}"
	end := "\\end{document}"
	startIdx := strings.Index(texContent, start)
	endIdx := strings.Index(texContent, end)

	if startIdx == -1 || endIdx == -1 {
		return html + "<p>Error: Could not find document content</p></body></html>"
	}

	content := texContent[startIdx+len(start) : endIdx]

	// Convert LaTeX commands to HTML
	content = strings.ReplaceAll(content, "\\textbf{", "<strong>")
	content = strings.ReplaceAll(content, "\\textit{", "<em>")
	content = strings.ReplaceAll(content, "\\href{", "<a href=\"")
	content = strings.ReplaceAll(content, "\\underline{", "<u>")
	content = strings.ReplaceAll(content, "\\scshape", "")
	content = strings.ReplaceAll(content, "\\Huge", "")
	content = strings.ReplaceAll(content, "\\large", "")
	content = strings.ReplaceAll(content, "\\small", "")
	content = strings.ReplaceAll(content, "\\tiny", "")

	// Handle closing braces
	content = strings.ReplaceAll(content, "}", "</strong>")
	content = strings.ReplaceAll(content, "}", "</em>")
	content = strings.ReplaceAll(content, "}", "\">")
	content = strings.ReplaceAll(content, "}", "</u>")

	// Convert sections
	content = strings.ReplaceAll(content, "\\section{", "<h2>")
	content = strings.ReplaceAll(content, "\\subsection{", "<h3>")

	// Convert itemize environments
	content = strings.ReplaceAll(content, "\\begin{itemize}", "<ul>")
	content = strings.ReplaceAll(content, "\\end{itemize}", "</ul>")
	content = strings.ReplaceAll(content, "\\item", "<li>")

	// Convert resumeItem commands
	content = strings.ReplaceAll(content, "\\resumeItem{", "<li>")
	content = strings.ReplaceAll(content, "\\resumeSubheading{", "<div class=\"resumeSubheading\">")
	content = strings.ReplaceAll(content, "\\resumeProjectHeading{", "<div class=\"resumeProjectHeading\">")

	// Handle special characters
	content = strings.ReplaceAll(content, "\\&", "&")
	content = strings.ReplaceAll(content, "\\$", "$")
	content = strings.ReplaceAll(content, "\\%", "%")
	content = strings.ReplaceAll(content, "\\#", "#")
	content = strings.ReplaceAll(content, "\\_", "_")
	content = strings.ReplaceAll(content, "\\{", "{")
	content = strings.ReplaceAll(content, "\\}", "}")

	// Clean up extra spaces and line breaks
	content = strings.ReplaceAll(content, "\n\n", "\n")
	content = strings.TrimSpace(content)

	html += content
	html += `
</body>
</html>`

	return html
}

func (s *Server) handleContactForm(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	writeJSON := func(code int, status, msg string) {
		w.WriteHeader(code)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": status, "message": msg})
	}

	if !s.contactLimiter.allow(clientIP(r)) {
		writeJSON(http.StatusTooManyRequests, "error", "Too many requests. Please try again later.")
		return
	}

	if !contactOriginAllowed(r, s.contactAllowedOrigins) {
		writeJSON(http.StatusForbidden, "error", "Request not allowed.")
		return
	}

	body := http.MaxBytesReader(w, r.Body, maxContactBodyBytes)
	defer body.Close()

	var form ContactForm
	if err := json.NewDecoder(body).Decode(&form); err != nil {
		writeJSON(http.StatusBadRequest, "error", "Invalid form data.")
		return
	}

	if strings.TrimSpace(form.Website) != "" {
		writeJSON(http.StatusBadRequest, "error", "Invalid request.")
		return
	}

	form.Name = strings.TrimSpace(form.Name)
	form.Email = strings.TrimSpace(form.Email)
	form.Subject = strings.TrimSpace(form.Subject)
	form.Message = strings.TrimSpace(form.Message)

	if form.Name == "" || form.Email == "" || form.Message == "" {
		writeJSON(http.StatusBadRequest, "error", "Name, email, and message are required fields.")
		return
	}

	// Send email
	if err := s.sendEmail(form); err != nil {
		log.Printf("Failed to send contact email: %v", err)
		writeJSON(http.StatusInternalServerError, "error", "Failed to send message. Please try again or contact me directly.")
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Thank you for your message! I'll get back to you soon.",
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// spaPageTemplates maps URL segment (home, about, …) to the corresponding content template name.
var spaPageTemplates = map[string]string{
	"home":     "home-content",
	"about":    "about-content",
	"projects": "projects-content",
	"contact":  "contact-content",
	"resume":   "resume-content",
}

func (s *Server) pageDataFor(templateName string) PageData {
	personal := config.GetPersonalInfo()
	data := PageData{
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: templateName,
		AssetVersion: s.assetVersion,
		SiteURL:      s.siteURL,
	}
	switch templateName {
	case "home":
		data.Title = personal.Name + " - " + personal.Title
		data.Description = "Welcome to my portfolio showcasing my work in web development, software engineering, and creative projects."
		data.Projects = s.projects[:min(3, len(s.projects))]
	case "about":
		data.Title = "About Me - " + personal.Name
		data.Description = "Who I am, skills, experience, and how to reach me — written for recruiters and hiring managers."
		data.Projects = s.projects
	case "projects":
		data.Title = "Projects - " + personal.Name
		data.Description = "Explore my portfolio of web applications, software projects, and creative work."
		data.Projects = s.projects
		data.ProjectTypes = GetAvailableTypesSorted()
	case "contact":
		data.Title = "Contact Me - " + personal.Name
		data.Description = "Get in touch with me for collaboration opportunities or project inquiries."
	case "resume":
		data.Title = "Resume - " + personal.Name
		data.Description = "View my professional experience, education, and skills."
	default:
		data.Title = personal.Name
		data.Description = ""
	}
	return data
}

func (s *Server) partialHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	page := vars["page"]
	tmplName, ok := spaPageTemplates[page]
	if !ok {
		http.NotFound(w, r)
		return
	}
	data := s.pageDataFor(page)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Page-Title", data.Title)
	w.Header().Set("X-Page-Description", data.Description)
	w.Header().Set("Cache-Control", "no-store")

	if err := s.templates.ExecuteTemplate(w, tmplName, data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Partial template error: %v", err)
	}
}

// Helper functions for environment variables
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := fmt.Sscanf(value, "%d", &defaultValue); err == nil && intValue == 1 {
			return defaultValue
		}
	}
	return defaultValue
}

func parseListEnv(key string) []string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	var out []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// Email sending function
func (s *Server) sendEmail(form ContactForm) error {
	// Check if email configuration is properly set
	if s.emailConfig.Username == "" || s.emailConfig.Password == "" || s.emailConfig.ToEmail == "" {
		return fmt.Errorf("email configuration incomplete")
	}

	// Create new message
	m := mail.NewMessage()
	m.SetHeader("From", s.emailConfig.FromEmail)
	m.SetHeader("To", s.emailConfig.ToEmail)
	subj := form.Subject
	if subj == "" {
		subj = "(no subject)"
	}
	m.SetHeader("Subject", fmt.Sprintf("Portfolio Contact: %s", subj))

	// Create email body
	body := fmt.Sprintf(`
New contact form submission from your portfolio:

Name: %s
Email: %s
Subject: %s

Message:
%s

---
This message was sent from your portfolio contact form.
`, form.Name, form.Email, form.Subject, form.Message)

	m.SetBody("text/plain", body)

	// Create dialer
	d := mail.NewDialer(s.emailConfig.SMTPHost, s.emailConfig.SMTPPort, s.emailConfig.Username, s.emailConfig.Password)

	// Send email
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

// API Handlers for project filtering
func (s *Server) projectsAPIHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.projects)
}

func (s *Server) projectsByTypeAPIHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectType := vars["type"]

	filteredProjects := GetProjectsByType(projectType)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filteredProjects)
}

func (s *Server) projectsByStatusAPIHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	status := vars["status"]

	filteredProjects := GetProjectsByStatus(status)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filteredProjects)
}

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	server := NewServer()

	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/", server.terminalHandler).Methods("GET")
	r.HandleFunc("/home", server.homeHandler).Methods("GET")
	r.HandleFunc("/about", server.aboutHandler).Methods("GET")
	r.HandleFunc("/projects", server.projectsHandler).Methods("GET")
	r.HandleFunc("/contact", server.contactHandler).Methods("GET", "POST")
	r.HandleFunc("/resume", server.resumeHandler).Methods("GET")
	r.HandleFunc("/resume/pdf", server.resumePDFHandler).Methods("GET")
	r.HandleFunc("/resume/download", server.resumeDownloadHandler).Methods("GET")
	r.HandleFunc("/resume/html", server.resumeHTMLHandler).Methods("GET")

	r.HandleFunc("/partials/{page}", server.partialHandler).Methods("GET")

	// API routes for project filtering
	r.HandleFunc("/api/projects", server.projectsAPIHandler).Methods("GET")
	r.HandleFunc("/api/projects/type/{type}", server.projectsByTypeAPIHandler).Methods("GET")
	r.HandleFunc("/api/projects/status/{status}", server.projectsByStatusAPIHandler).Methods("GET")

	// Hosted projects routes
	r.PathPrefix("/hosted/").Handler(http.StripPrefix("/hosted/", http.FileServer(http.Dir("./hosted-projects/"))))

	// Static files
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Visit http://localhost:%s to view your portfolio", port)

	enableHSTS := strings.EqualFold(os.Getenv("ENABLE_HSTS"), "true")
	redirectCfg := redirectConfig{
		CanonicalHost: strings.TrimSpace(strings.ToLower(os.Getenv("CANONICAL_HOST"))),
		ApexHost:      strings.TrimSpace(strings.ToLower(os.Getenv("APEX_HOST"))),
	}
	handler := securityHeadersMiddleware(enableHSTS, httpsRedirectMiddleware(redirectCfg, r))

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
