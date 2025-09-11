package main

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"personal-portfolio/config"
)

type Server struct {
	templates *template.Template
	projects  []Project
}

type Project struct {
	ID          string    `json:"id" yaml:"id"`
	Title       string    `json:"title" yaml:"title"`
	Description string    `json:"description" yaml:"description"`
	Image       string    `json:"image" yaml:"image"`
	Technologies []string `json:"technologies" yaml:"technologies"`
	GitHubURL   string    `json:"github_url" yaml:"github_url"`
	LiveURL     string    `json:"live_url" yaml:"live_url"`
	Date        time.Time `json:"date" yaml:"date"`
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
}

func NewServer() *Server {
	// Parse all templates
	templates, err := template.ParseGlob("templates/*.html")
	if err != nil {
		log.Fatal("Error parsing templates:", err)
	}

	// Load projects data
	projects := loadProjects()

	return &Server{
		templates: templates,
		projects:  projects,
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
		Personal:     personal,
		Year:         time.Now().Year(),
		TemplateName: "about",
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
	}

	if err := s.templates.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Printf("Template execution error: %v", err)
	}
}

func (s *Server) resumePDFHandler(w http.ResponseWriter, r *http.Request) {
	pdfPath := "./static/assets/resume.pdf"
	
	// Check if PDF exists
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		http.Error(w, "Resume PDF not found. Please build the resume first.", http.StatusNotFound)
		return
	}

	// Set headers for PDF download
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=\"David_Xiao_Resume.pdf\"")
	
	http.ServeFile(w, r, pdfPath)
}


func (s *Server) handleContactForm(w http.ResponseWriter, r *http.Request) {
	var form ContactForm
	
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	// Here you would typically send an email or save to database
	// For now, we'll just log the contact form submission
	log.Printf("Contact form submission: %+v", form)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Thank you for your message! I'll get back to you soon.",
	})
}

func loadProjects() []Project {
	// Projects from David's actual GitHub profile
	return []Project{
		{
			ID:          "forgearena",
			Title:       "ForgeArena",
			Description: "A gamified fitness platform blending avatar evolution with social gym competition. Currently in development as part of CSCI-40500 coursework, this project combines fitness tracking with RPG-style character progression and social features. Repository is private within class organization.",
			Image:       "/static/images/forgearena-project.jpg",
			Technologies: []string{"TypeScript", "Go", "React", "PostgreSQL"},
			GitHubURL:   "",
			LiveURL:     "",
			Date:        time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:          "randcompile-extension",
			Title:       "RandCompile: Kernel Hardening Extension Research",
			Description: "Academic research paper extending existing RandCompile work with our own secured kernel implementation. Developed compile-time kernel hardening techniques with ABI randomization and data structure obfuscation, maintaining less than 5% performance overhead while enhancing security against malicious hypervisor threat models.",
			Image:       "/static/images/randcompile-research.jpg",
			Technologies: []string{"Python", "C", "GCC", "Shell", "Docker", "Research"},
			GitHubURL:   "https://github.com/daveonthegit/Randcompile-Extension-Paper",
			LiveURL:     "",
			Date:        time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:          "rsa-factorization-tls-decryption",
			Title:       "RSA Factorization & TLS Decryption",
			Description: "Automated RSA key recovery and TLS decryption by scripting modulus analysis and key extraction. Factored 1024-bit RSA keys using GCD-based methods and analyzed decrypted TLS session data with Wireshark for security research.",
			Image:       "/static/images/cryptography-project.jpg",
			Technologies: []string{"C", "Python", "Cado-NFS", "MSieve", "Wireshark"},
			GitHubURL:   "https://github.com/daveonthegit/RSA-Factorization-TLS-Decryption-",
			LiveURL:     "",
			Date:        time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:          "hs-projects",
			Title:       "High School Projects Collection",
			Description: "A collection of Java projects from my high school computer science coursework, showcasing fundamental programming concepts and problem-solving skills in object-oriented programming.",
			Image:       "/static/images/hs-projects.jpg",
			Technologies: []string{"Java"},
			GitHubURL:   "https://github.com/daveonthegit/HS-Projects",
			LiveURL:     "",
			Date:        time.Date(2022, 6, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:          "hunter-cs-work",
			Title:       "Hunter College CS Coursework",
			Description: "Academic projects and assignments from CSCI 12700 at Hunter College, demonstrating proficiency in computer science fundamentals and coursework requirements.",
			Image:       "/static/images/hunter-cs-project.jpg",
			Technologies: []string{"Various", "Academic Projects"},
			GitHubURL:   "https://github.com/daveonthegit/HUNTER-CS-WORK",
			LiveURL:     "",
			Date:        time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
		},
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {
	server := NewServer()

	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/", server.homeHandler).Methods("GET")
	r.HandleFunc("/about", server.aboutHandler).Methods("GET")
	r.HandleFunc("/projects", server.projectsHandler).Methods("GET")
	r.HandleFunc("/contact", server.contactHandler).Methods("GET", "POST")
	r.HandleFunc("/resume", server.resumeHandler).Methods("GET")
	r.HandleFunc("/resume/pdf", server.resumePDFHandler).Methods("GET")

	// Static files
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Visit http://localhost:%s to view your portfolio", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
