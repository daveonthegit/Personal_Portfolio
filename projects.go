package main

import (
	"time"
)

// Project represents a portfolio project with live demo support
type Project struct {
	ID           string    `json:"id" yaml:"id"`
	Title        string    `json:"title" yaml:"title"`
	Description  string    `json:"description" yaml:"description"`
	Image        string    `json:"image" yaml:"image"`
	Technologies []string  `json:"technologies" yaml:"technologies"`
	Type         string    `json:"type" yaml:"type"` // "web", "mobile", "ai", "security", "academic", "research", "tool"
	GitHubURL    string    `json:"github_url" yaml:"github_url"`
	LiveURL      string    `json:"live_url" yaml:"live_url"`
	DemoType     string    `json:"demo_type" yaml:"demo_type"`     // "live", "video", "screenshot", "hosted", "none"
	DemoURL      string    `json:"demo_url" yaml:"demo_url"`       // URL for video demos or screenshots
	HostedPath   string    `json:"hosted_path" yaml:"hosted_path"` // Path to hosted project files
	Status       string    `json:"status" yaml:"status"`           // "active", "archived", "in-development"
	Date         time.Time `json:"date" yaml:"date"`
}

// LoadProjects returns all portfolio projects with live demo support
func LoadProjects() []Project {
	return []Project{
		{
			ID:           "personal-portfolio",
			Title:        "Personal Portfolio Website",
			Description:  "A modern, responsive personal portfolio built from scratch using Go for the backend and TypeScript for the frontend. Features include LaTeX resume integration with PDF compilation, dynamic project showcase, contact form handling, dark/light theme toggle, and professional responsive design. Demonstrates full-stack development skills with Go web server, HTML templating, modern frontend build tools, and deployment to Heroku.",
			Image:        "/static/images/portfolio-project.png",
			Technologies: []string{"Go", "TypeScript", "HTML/CSS", "Tailwind CSS", "LaTeX", "Docker", "Heroku"},
			Type:         "web",
			GitHubURL:    "https://github.com/daveonthegit/Personal_Portfolio",
			LiveURL:      "http://davidx.tech",
			DemoType:     "live",
			DemoURL:      "http://davidx.tech",
			Status:       "active",
			Date:         time.Date(2025, 9, 11, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "forgearena",
			Title:        "ForgeArena",
			Description:  "A gamified fitness platform blending avatar evolution with social gym competition. Currently in development as part of CSCI-40500 coursework, this project combines fitness tracking with RPG-style character progression and social features. Repository is private within class organization.",
			Image:        "/static/images/forgearena-project.jpg",
			Technologies: []string{"TypeScript", "Go", "React", "PostgreSQL"},
			Type:         "web",
			GitHubURL:    "",
			LiveURL:      "",
			DemoType:     "live",
			DemoURL:      "https://project-project-4.vercel.app/",
			Status:       "in-development",
			Date:         time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "randcompile-extension",
			Title:        "RandCompile: Kernel Hardening Extension Research",
			Description:  "Academic research paper extending existing RandCompile work with our own secured kernel implementation. Developed compile-time kernel hardening techniques with ABI randomization and data structure obfuscation, maintaining less than 5% performance overhead while enhancing security against malicious hypervisor threat models.",
			Image:        "/static/images/randcompile-research.png",
			Technologies: []string{"Python", "C", "GCC", "Shell", "Docker", "Research"},
			Type:         "research",
			GitHubURL:    "https://github.com/daveonthegit/Randcompile-Extension-Paper",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "active",
			Date:         time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "minesweeper-game",
			Title:        "Minesweeper Game",
			Description:  "A modern, fully-featured Minesweeper game built with TypeScript, HTML5, and CSS3. Features multiple difficulty levels, flag mode, timer, and a beautiful glassmorphism UI. Demonstrates advanced TypeScript patterns, DOM manipulation, and game logic implementation.",
			Image:        "/static/images/minesweeper-project.png",
			Technologies: []string{"TypeScript", "HTML5", "CSS3", "DOM Manipulation", "Game Development"},
			Type:         "web",
			GitHubURL:    "",
			LiveURL:      "",
			DemoType:     "hosted",
			DemoURL:      "/hosted/minesweeper/",
			HostedPath:   "minesweeper",
			Status:       "active",
			Date:         time.Date(2025, 9, 13, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "ascii-rpg-game",
			Title:        "Procedural Roguelike RPG",
			Description:  "A hardcore ASCII-based roguelike RPG featuring permadeath, procedural dungeon generation, hunger system, item identification, and cursed items. Built with TypeScript and styled with a terminal-inspired interface. Includes infinite dungeon floors, dynamic bosses, magic spells, abilities, status effects, and save/load functionality. A true roguelike experience where every decision matters.",
			Image:        "/static/images/ascii-rpg.png",
			Technologies: []string{"TypeScript", "HTML5", "CSS3", "Game Development", "ASCII Art", "Roguelike", "Procedural Generation", "LocalStorage"},
			Type:         "web",
			GitHubURL:    "",
			LiveURL:      "",
			DemoType:     "hosted",
			DemoURL:      "/hosted/ascii-rpg/",
			HostedPath:   "ascii-rpg",
			Status:       "active",
			Date:         time.Date(2025, 9, 13, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "rsa-factorization-tls-decryption",
			Title:        "RSA Factorization & TLS Decryption",
			Description:  "Automated RSA key recovery and TLS decryption by scripting modulus analysis and key extraction. Factored 1024-bit RSA keys using GCD-based methods and analyzed decrypted TLS session data with Wireshark for security research.",
			Image:        "/static/images/cryptography-project.jpg",
			Technologies: []string{"C", "Python", "Cado-NFS", "MSieve", "Wireshark"},
			Type:         "security",
			GitHubURL:    "https://github.com/daveonthegit/RSA-Factorization-TLS-Decryption-",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "active",
			Date:         time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "hs-projects",
			Title:        "High School Projects Collection",
			Description:  "A collection of Java projects from my high school computer science coursework, showcasing fundamental programming concepts and problem-solving skills in object-oriented programming.",
			Image:        "/static/images/hs-projects.jpg",
			Technologies: []string{"Java"},
			Type:         "academic",
			GitHubURL:    "https://github.com/daveonthegit/HS-Projects",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "archived",
			Date:         time.Date(2022, 6, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "hunter-cs-work",
			Title:        "Hunter College CS Coursework",
			Description:  "Academic projects and assignments from CSCI 12700 at Hunter College, demonstrating proficiency in computer science fundamentals and coursework requirements.",
			Image:        "/static/images/hunter-cs-project.jpg",
			Technologies: []string{"Various", "Academic Projects"},
			Type:         "academic",
			GitHubURL:    "https://github.com/daveonthegit/HUNTER-CS-WORK",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "archived",
			Date:         time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "leetcode-solutions",
			Title:        "LeetCode Solutions",
			Description:  "My LeetCode submission collection showcasing problem-solving skills and algorithmic thinking. Features solutions to various coding challenges with optimized approaches and clean implementations.",
			Image:        "/static/images/leetcode-project.jpg",
			Technologies: []string{"Python", "Algorithm", "Data Structures"},
			Type:         "tool",
			GitHubURL:    "https://github.com/daveonthegit/leetcode",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "active",
			Date:         time.Date(2025, 4, 18, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "cs43500-food-delivery",
			Title:        "Food Delivery Service",
			Description:  "CS43500 project creating a database for a comprehensive food delivery service system. Features include user management, order processing, restaurant management, and delivery tracking with database integration.",
			Image:        "/static/images/food-delivery-project.jpg",
			Technologies: []string{"PostgreSQL", "Database", "System Design"},
			Type:         "academic",
			GitHubURL:    "https://github.com/daveonthegit/CS43500-project",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "active",
			Date:         time.Date(2025, 5, 22, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "csci-49381-labs",
			Title:        "CSCI 49381 Security Labs",
			Description:  "Collection of cybersecurity lab assignments covering topics like buffer overflow exploitation, Slowloris DoS attacks, cryptography implementations, and penetration testing techniques.",
			Image:        "/static/images/security-labs-project.jpg",
			Technologies: []string{"C", "Python", "HTML", "CSS", "Security", "Cryptography"},
			Type:         "security",
			GitHubURL:    "",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "archived",
			Date:         time.Date(2025, 5, 21, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "csci-260-assembly",
			Title:        "CSCI 260 Assembly Projects",
			Description:  "Assembly language programming projects demonstrating low-level system programming, MIPS architecture understanding, and computer organization concepts.",
			Image:        "/static/images/assembly-project.jpg",
			Technologies: []string{"Assembly", "MIPS", "C++"},
			Type:         "academic",
			GitHubURL:    "https://github.com/daveonthegit/CSCI-260-PROJECT-1",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "active",
			Date:         time.Date(2025, 5, 14, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "cs-260-cpp",
			Title:        "CS 260 C++ Projects",
			Description:  "C++ programming projects showcasing object-oriented programming principles, data structures implementation, and software engineering best practices.",
			Image:        "/static/images/cpp-project.jpg",
			Technologies: []string{"C++", "OOP", "Data Structures"},
			Type:         "academic",
			GitHubURL:    "https://github.com/daveonthegit/CS-260",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "active",
			Date:         time.Date(2025, 4, 21, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "cs335-projects",
			Title:        "CS 335 Software Engineering Projects",
			Description:  "Software engineering coursework projects demonstrating system design, project management, and collaborative development practices in C++.",
			Image:        "/static/images/software-eng-project.jpg",
			Technologies: []string{"C++", "Software Engineering", "System Design"},
			Type:         "academic",
			GitHubURL:    "",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "archived",
			Date:         time.Date(2024, 5, 11, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "jbot-discord",
			Title:        "JBot Discord Bot",
			Description:  "DEFUNCT Custom Discord bot implementation with various utility commands, moderation features, and interactive functionality for server management and entertainment.",
			Image:        "/static/images/discord-bot-project.jpg",
			Technologies: []string{"JavaScript", "Discord.js", "Node.js"},
			Type:         "tool",
			GitHubURL:    "https://github.com/daveonthegit/JBot",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "archived",
			Date:         time.Date(2022, 9, 26, 0, 0, 0, 0, time.UTC),
		},
		{
			ID:           "basic-web-projects",
			Title:        "Basic Web Projects",
			Description:  "Collection of foundational web development projects demonstrating HTML, CSS, and JavaScript skills with responsive design and interactive features.",
			Image:        "/static/images/web-projects.jpg",
			Technologies: []string{"HTML", "CSS", "JavaScript"},
			Type:         "web",
			GitHubURL:    "https://github.com/daveonthegit/Basic-Web-Projects",
			LiveURL:      "",
			DemoType:     "none",
			DemoURL:      "",
			Status:       "archived",
			Date:         time.Date(2023, 12, 9, 0, 0, 0, 0, time.UTC),
		},
	}
}

// GetProjectsByStatus returns projects filtered by status
func GetProjectsByStatus(status string) []Project {
	allProjects := LoadProjects()
	var filtered []Project
	for _, project := range allProjects {
		if project.Status == status {
			filtered = append(filtered, project)
		}
	}
	return filtered
}

// GetProjectsWithLiveDemo returns projects that have live demos
func GetProjectsWithLiveDemo() []Project {
	allProjects := LoadProjects()
	var liveProjects []Project
	for _, project := range allProjects {
		if project.DemoType == "live" && project.LiveURL != "" {
			liveProjects = append(liveProjects, project)
		}
	}
	return liveProjects
}

// GetProjectsByTechnology returns projects filtered by technology
func GetProjectsByTechnology(technology string) []Project {
	allProjects := LoadProjects()
	var filtered []Project
	for _, project := range allProjects {
		for _, tech := range project.Technologies {
			if tech == technology {
				filtered = append(filtered, project)
				break
			}
		}
	}
	return filtered
}

// GetProjectsByType returns projects filtered by type
func GetProjectsByType(projectType string) []Project {
	allProjects := LoadProjects()
	var filtered []Project
	for _, project := range allProjects {
		if project.Type == projectType {
			filtered = append(filtered, project)
		}
	}
	return filtered
}

// GetAvailableTypes returns all unique project types
func GetAvailableTypes() []string {
	allProjects := LoadProjects()
	typeMap := make(map[string]bool)

	for _, project := range allProjects {
		typeMap[project.Type] = true
	}

	var types []string
	for projectType := range typeMap {
		types = append(types, projectType)
	}

	return types
}

// GetProjectsByTypeAndStatus returns projects filtered by both type and status
func GetProjectsByTypeAndStatus(projectType, status string) []Project {
	allProjects := LoadProjects()
	var filtered []Project
	for _, project := range allProjects {
		if project.Type == projectType && project.Status == status {
			filtered = append(filtered, project)
		}
	}
	return filtered
}

// GetHostedProjects returns projects that are hosted on this site
func GetHostedProjects() []Project {
	allProjects := LoadProjects()
	var hosted []Project
	for _, project := range allProjects {
		if project.DemoType == "hosted" && project.HostedPath != "" {
			hosted = append(hosted, project)
		}
	}
	return hosted
}
