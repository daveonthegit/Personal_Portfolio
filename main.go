package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/daveonthegit/Personal_Portfolio/config"
	"github.com/joho/godotenv"

	"github.com/gorilla/mux"
	"gopkg.in/mail.v2"
)

type Server struct {
	templates   *template.Template
	projects    []Project
	emailConfig EmailConfig
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
}

type PageData struct {
	Title        string
	Description  string
	Projects     []Project
	Personal     config.PersonalInfo
	Year         int
	TemplateName string
	Timestamp    int64
}

func NewServer() *Server {
	// Parse all templates
	templates, err := template.ParseGlob("templates/*.html")
	if err != nil {
		log.Fatal("Error parsing templates:", err)
	}

	// Load projects data
	projects := LoadProjects()

	// Initialize email configuration from environment variables
	emailConfig := EmailConfig{
		SMTPHost:  getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:  getEnvInt("SMTP_PORT", 587),
		Username:  getEnv("SMTP_USERNAME", ""),
		Password:  getEnv("SMTP_PASSWORD", ""),
		FromEmail: getEnv("FROM_EMAIL", ""),
		ToEmail:   getEnv("TO_EMAIL", ""),
	}

	// Debug: Log email configuration status
	log.Printf("Email config loaded - SMTP: %s:%d, Username: %s, From: %s, To: %s",
		emailConfig.SMTPHost, emailConfig.SMTPPort,
		emailConfig.Username, emailConfig.FromEmail, emailConfig.ToEmail)

	if emailConfig.Username == "" || emailConfig.Password == "" || emailConfig.ToEmail == "" {
		log.Printf("⚠️  Email configuration incomplete - please check your .env file")
		log.Printf("Required: SMTP_USERNAME, SMTP_PASSWORD, TO_EMAIL")
	}

	return &Server{
		templates:   templates,
		projects:    projects,
		emailConfig: emailConfig,
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
		Timestamp:    time.Now().Unix(),
	}

	if err := s.templates.ExecuteTemplate(w, "terminal.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) homeHandler(w http.ResponseWriter, r *http.Request) {
	personal := config.GetPersonalInfo()
	data := PageData{
		Title:        personal.Name + " - " + personal.Title,
		Description:  "Welcome to my portfolio showcasing my work in web development, software engineering, and creative projects.",
		Projects:     s.projects[:min(3, len(s.projects))], // Show only first 3 projects on home
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: "home",
		Timestamp:    time.Now().Unix(),
	}

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) aboutHandler(w http.ResponseWriter, r *http.Request) {
	personal := config.GetPersonalInfo()
	data := PageData{
		Title:        "About Me - " + personal.Name,
		Description:  "Learn more about my background, skills, and experience in software development.",
		Projects:     s.projects,
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: "about",
		Timestamp:    time.Now().Unix(),
	}

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) projectsHandler(w http.ResponseWriter, r *http.Request) {
	personal := config.GetPersonalInfo()
	data := PageData{
		Title:        "Projects - " + personal.Name,
		Description:  "Explore my portfolio of web applications, software projects, and creative work.",
		Projects:     s.projects,
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: "projects",
		Timestamp:    time.Now().Unix(),
	}

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) contactHandler(w http.ResponseWriter, r *http.Request) {
	personal := config.GetPersonalInfo()

	if r.Method == "GET" {
		data := PageData{
			Title:        "Contact Me - " + personal.Name,
			Description:  "Get in touch with me for collaboration opportunities or project inquiries.",
			Personal:     personal,
			Year:         time.Now().Year(),
			TemplateName: "contact",
			Timestamp:    time.Now().Unix(),
		}

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
	personal := config.GetPersonalInfo()
	data := PageData{
		Title:        "Resume - " + personal.Name,
		Description:  "View my professional experience, education, and skills.",
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: "resume",
		Timestamp:    time.Now().Unix(),
	}

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) resumePDFHandler(w http.ResponseWriter, r *http.Request) {
	texPath := "./static/assets/resume.tex"
	pdfPath := "./static/assets/resume.pdf"

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
	// Change to the assets directory
	originalDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current directory: %v", err)
	}

	if err := os.Chdir("./static/assets"); err != nil {
		return fmt.Errorf("failed to change to assets directory: %v", err)
	}
	defer os.Chdir(originalDir)

	// Try different LaTeX engines in order of preference
	engines := []struct {
		name string
		cmd  []string
	}{
		{"latexmk", []string{"latexmk", "-pdf", "-interaction=nonstopmode", "resume.tex"}},
		{"lualatex", []string{"lualatex", "-interaction=nonstopmode", "resume.tex"}},
		{"xelatex", []string{"xelatex", "-interaction=nonstopmode", "resume.tex"}},
		{"pdflatex", []string{"pdflatex", "-interaction=nonstopmode", "resume.tex"}},
	}

	var lastErr error
	for _, engine := range engines {
		if _, err := exec.LookPath(engine.name); err != nil {
			continue // Skip if engine not found
		}

		// Try the engine
		cmd := exec.Command(engine.cmd[0], engine.cmd[1:]...)
		output, err := cmd.CombinedOutput()

		if err == nil {
			// Success! Clean up and return
			s.cleanupAuxFiles()
			if _, err := os.Stat("resume.pdf"); err == nil {
				return nil
			}
		}

		lastErr = fmt.Errorf("%s failed: %v\nOutput: %s", engine.name, err, string(output))

		// For engines that need multiple passes, try again
		if engine.name == "lualatex" || engine.name == "xelatex" || engine.name == "pdflatex" {
			cmd = exec.Command(engine.cmd[0], engine.cmd[1:]...)
			_, err = cmd.CombinedOutput()
			if err == nil {
				s.cleanupAuxFiles()
				if _, err := os.Stat("resume.pdf"); err == nil {
					return nil
				}
			}
		}
	}

	return fmt.Errorf("all LaTeX engines failed. Last error: %v", lastErr)
}

func (s *Server) cleanupAuxFiles() {
	auxFiles := []string{"resume.aux", "resume.log", "resume.out", "resume.fdb_latexmk", "resume.fls", "resume.synctex.gz", "resume.toc", "resume.nav", "resume.snm"}
	for _, file := range auxFiles {
		os.Remove(file)
	}
}

func (s *Server) buildPDFUsingScript() error {
	// Try using the existing build script
	cmd := exec.Command("scripts/build-resume.bat")
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
	var form ContactForm

	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if form.Name == "" || form.Email == "" || form.Message == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "error",
			"message": "Name, email, and message are required fields.",
		})
		return
	}

	// Log the contact form submission
	log.Printf("Contact form submission from %s (%s): %s", form.Name, form.Email, form.Subject)

	// Send email
	if err := s.sendEmail(form); err != nil {
		log.Printf("Failed to send email: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "error",
			"message": "Failed to send message. Please try again or contact me directly.",
		})
		return
	}

	// Success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
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
	m.SetHeader("Subject", fmt.Sprintf("Portfolio Contact: %s", form.Subject))

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

// HTTPS redirect middleware
func httpsRedirectMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if we're in production (not localhost)
		if r.Host != "localhost:8080" && r.Host != "127.0.0.1:8080" {
			// Check if the request is HTTP (not HTTPS)
			if r.Header.Get("X-Forwarded-Proto") != "https" && r.TLS == nil {
				// Redirect to HTTPS www version
				httpsURL := "https://www." + r.Host + r.RequestURI
				http.Redirect(w, r, httpsURL, http.StatusMovedPermanently)
				return
			}

			// Check if the request is to apex domain (without www)
			if !strings.HasPrefix(r.Host, "www.") {
				// Redirect to www version
				wwwURL := "https://www." + r.Host + r.RequestURI
				http.Redirect(w, r, wwwURL, http.StatusMovedPermanently)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
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

	// Debug route for animation troubleshooting
	r.HandleFunc("/debug", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "debug-animation.html")
	})

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

	// Wrap the router with HTTPS redirect middleware
	handler := httpsRedirectMiddleware(r)

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
