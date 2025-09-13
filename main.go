package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
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

type Project struct {
	ID           string    `json:"id" yaml:"id"`
	Title        string    `json:"title" yaml:"title"`
	Description  string    `json:"description" yaml:"description"`
	Image        string    `json:"image" yaml:"image"`
	Technologies []string  `json:"technologies" yaml:"technologies"`
	GitHubURL    string    `json:"github_url" yaml:"github_url"`
	LiveURL      string    `json:"live_url" yaml:"live_url"`
	Date         time.Time `json:"date" yaml:"date"`
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

func loadProjects() []Project {
	// Projects from David's actual GitHub profile
	return []Project{
		{
			ID:           "personal-portfolio",
			Title:        "Personal Portfolio Website",
			Description:  "A modern, responsive personal portfolio built from scratch using Go for the backend and TypeScript for the frontend. Features include LaTeX resume integration with PDF compilation, dynamic project showcase, contact form handling, dark/light theme toggle, and professional responsive design. Demonstrates full-stack development skills with Go web server, HTML templating, modern frontend build tools, and deployment to Heroku.",
			Image:        "/static/images/portfolio-project.jpg",
			Technologies: []string{"Go", "TypeScript", "HTML/CSS", "Tailwind CSS", "LaTeX", "Docker", "Heroku"},
			GitHubURL:    "https://github.com/daveonthegit/Personal_Portfolio",
			LiveURL:      "",
			Date:         time.Date(2025, 9, 11, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "forgearena",
			Title:        "ForgeArena",
			Description:  "A gamified fitness platform blending avatar evolution with social gym competition. Currently in development as part of CSCI-40500 coursework, this project combines fitness tracking with RPG-style character progression and social features. Repository is private within class organization.",
			Image:        "/static/images/forgearena-project.jpg",
			Technologies: []string{"TypeScript", "Go", "React", "PostgreSQL"},
			GitHubURL:    "",
			LiveURL:      "",
			Date:         time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "randcompile-extension",
			Title:        "RandCompile: Kernel Hardening Extension Research",
			Description:  "Academic research paper extending existing RandCompile work with our own secured kernel implementation. Developed compile-time kernel hardening techniques with ABI randomization and data structure obfuscation, maintaining less than 5% performance overhead while enhancing security against malicious hypervisor threat models.",
			Image:        "/static/images/randcompile-research.jpg",
			Technologies: []string{"Python", "C", "GCC", "Shell", "Docker", "Research"},
			GitHubURL:    "https://github.com/daveonthegit/Randcompile-Extension-Paper",
			LiveURL:      "",
			Date:         time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "rsa-factorization-tls-decryption",
			Title:        "RSA Factorization & TLS Decryption",
			Description:  "Automated RSA key recovery and TLS decryption by scripting modulus analysis and key extraction. Factored 1024-bit RSA keys using GCD-based methods and analyzed decrypted TLS session data with Wireshark for security research.",
			Image:        "/static/images/cryptography-project.jpg",
			Technologies: []string{"C", "Python", "Cado-NFS", "MSieve", "Wireshark"},
			GitHubURL:    "https://github.com/daveonthegit/RSA-Factorization-TLS-Decryption-",
			LiveURL:      "",
			Date:         time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "hs-projects",
			Title:        "High School Projects Collection",
			Description:  "A collection of Java projects from my high school computer science coursework, showcasing fundamental programming concepts and problem-solving skills in object-oriented programming.",
			Image:        "/static/images/hs-projects.jpg",
			Technologies: []string{"Java"},
			GitHubURL:    "https://github.com/daveonthegit/HS-Projects",
			LiveURL:      "",
			Date:         time.Date(2022, 6, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "hunter-cs-work",
			Title:        "Hunter College CS Coursework",
			Description:  "Academic projects and assignments from CSCI 12700 at Hunter College, demonstrating proficiency in computer science fundamentals and coursework requirements.",
			Image:        "/static/images/hunter-cs-project.jpg",
			Technologies: []string{"Various", "Academic Projects"},
			GitHubURL:    "https://github.com/daveonthegit/HUNTER-CS-WORK",
			LiveURL:      "",
			Date:         time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "leetcode-solutions",
			Title:        "LeetCode Solutions",
			Description:  "My LeetCode submission collection showcasing problem-solving skills and algorithmic thinking. Features solutions to various coding challenges with optimized approaches and clean implementations.",
			Image:        "/static/images/leetcode-project.jpg",
			Technologies: []string{"Python", "Algorithm", "Data Structures"},
			GitHubURL:    "https://github.com/daveonthegit/leetcode",
			LiveURL:      "",
			Date:         time.Date(2025, 4, 18, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "cs43500-food-delivery",
			Title:        "Food Delivery Service",
			Description:  "CS43500 project creating a database for a comprehensive food delivery service system. Features include user management, order processing, restaurant management, and delivery tracking with database integration.",
			Image:        "/static/images/food-delivery-project.jpg",
			Technologies: []string{"PostgreSQL", "Database", "System Design"},
			GitHubURL:    "https://github.com/daveonthegit/CS43500-project",
			LiveURL:      "",
			Date:         time.Date(2025, 5, 22, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "csci-49381-labs",
			Title:        "CSCI 49381 Security Labs",
			Description:  "Collection of cybersecurity lab assignments covering topics like buffer overflow exploitation, Slowloris DoS attacks, cryptography implementations, and penetration testing techniques.",
			Image:        "/static/images/security-labs-project.jpg",
			Technologies: []string{"C", "Python", "HTML", "CSS", "Security", "Cryptography"},
			GitHubURL:    "",
			LiveURL:      "",
			Date:         time.Date(2025, 5, 21, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "csci-260-assembly",
			Title:        "CSCI 260 Assembly Projects",
			Description:  "Assembly language programming projects demonstrating low-level system programming, MIPS architecture understanding, and computer organization concepts.",
			Image:        "/static/images/assembly-project.jpg",
			Technologies: []string{"Assembly", "MIPS", "C++"},
			GitHubURL:    "https://github.com/daveonthegit/CSCI-260-PROJECT-1",
			LiveURL:      "",
			Date:         time.Date(2025, 5, 14, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "cs-260-cpp",
			Title:        "CS 260 C++ Projects",
			Description:  "C++ programming projects showcasing object-oriented programming principles, data structures implementation, and software engineering best practices.",
			Image:        "/static/images/cpp-project.jpg",
			Technologies: []string{"C++", "OOP", "Data Structures"},
			GitHubURL:    "https://github.com/daveonthegit/CS-260",
			LiveURL:      "",
			Date:         time.Date(2025, 4, 21, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "cs335-projects",
			Title:        "CS 335 Software Engineering Projects",
			Description:  "Software engineering coursework projects demonstrating system design, project management, and collaborative development practices in C++.",
			Image:        "/static/images/software-eng-project.jpg",
			Technologies: []string{"C++", "Software Engineering", "System Design"},
			GitHubURL:    "",
			LiveURL:      "",
			Date:         time.Date(2024, 5, 11, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "jbot-discord",
			Title:        "JBot Discord Bot",
			Description:  "DEFUNCT Custom Discord bot implementation with various utility commands, moderation features, and interactive functionality for server management and entertainment.",
			Image:        "/static/images/discord-bot-project.jpg",
			Technologies: []string{"JavaScript", "Discord.js", "Node.js"},
			GitHubURL:    "https://github.com/daveonthegit/JBot",
			LiveURL:      "",
			Date:         time.Date(2022, 9, 26, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "basic-web-projects",
			Title:        "Basic Web Projects",
			Description:  "Collection of foundational web development projects demonstrating HTML, CSS, and JavaScript skills with responsive design and interactive features.",
			Image:        "/static/images/web-projects.jpg",
			Technologies: []string{"HTML", "CSS", "JavaScript"},
			GitHubURL:    "https://github.com/daveonthegit/Basic-Web-Projects",
			LiveURL:      "",
			Date:         time.Date(2023, 12, 9, 0, 0, 0, 0, time.UTC),
		},
	}
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
