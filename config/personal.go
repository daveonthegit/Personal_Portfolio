package config

import "time"

// PersonalInfo contains all the personal information for the portfolio
type PersonalInfo struct {
	Name       string
	Title      string
	Email      string
	Phone      string
	Location   string
	LinkedIn   string
	GitHub     string
	Website    string
	Bio        string
	Skills     []Skill
	Experience []Experience
	Education  []Education
	Interests  []string
}

type Skill struct {
	Category string
	Items    []string
}

type Experience struct {
	Company      string
	Position     string
	StartDate    time.Time
	EndDate      *time.Time // nil for current position
	Location     string
	Description  []string
	Technologies []string
}

type Education struct {
	Institution string
	Degree      string
	Field       string
	StartDate   time.Time
	EndDate     time.Time
	GPA         string
	Location    string
}

// GetPersonalInfo returns the personal information
func GetPersonalInfo() PersonalInfo {
	return PersonalInfo{
		Name:     "David Xiao",
		Title:    "CS Student",
		Email:    "dxiao3043@gmail.com",
		Phone:    "917-946-7086",
		Location: "New York, NY",
		LinkedIn: "https://linkedin.com/in/david-on-linked",
		GitHub:   "https://github.com/daveonthegit",
		Website:  "",
		Bio:      `Computer Science student and software engineer with hands-on experience in full-stack development, system architecture modernization, and security-focused programming. Currently pursuing my BA in Computer Science at CUNY Hunter College and passionate about building scalable, secure applications. Working on ForgeArena - a gamified fitness platform blending avatar evolution with social gym competition. Learning TypeScript and Golang while contributing to security research projects.`,

		Skills: []Skill{
			{
				Category: "Programming Languages",
				Items:    []string{"Java", "Python", "C/C++", "JavaScript", "TypeScript", "Go", "PHP", "SQL", "MIPS Assembly", "BASH"},
			},
			{
				Category: "Web Technologies & Frameworks",
				Items:    []string{"React", "Node.js", "Express.js", "HTML/CSS", "jQuery", "RESTful APIs", "PERN Stack"},
			},
			{
				Category: "Databases & Cloud",
				Items:    []string{"PostgreSQL", "MySQL", "GCP"},
			},
			{
				Category: "Tools & Methodologies",
				Items:    []string{"Git", "VS Code", "UNIX", "Agile Scrum", "Automated Testing"},
			},
		},

		Experience: []Experience{
			{
				Company:   "Unadat",
				Position:  "Software Engineer Intern",
				StartDate: time.Date(2025, 6, 1, 0, 0, 0, 0, time.UTC),
				EndDate:   &[]time.Time{time.Date(2025, 8, 31, 0, 0, 0, 0, time.UTC)}[0],
				Location:  "New York, NY",
				Description: []string{
					"Re-architected legacy JS/PHP into modular components, cutting feature development time by 25% and enabling B2C/B2B scalability",
					"Added 6+ new features to legacy chores system, increasing usability and adoption across B2C/B2B users",
					"Converted core components into reusable modals, improving UI consistency and cutting frontend development effort by 20%",
					"Refactored 10+ API endpoints with REST + automated tests, reducing response times by 15% and supporting faster rollouts",
				},
				Technologies: []string{"JavaScript", "PHP", "MySQL", "RESTful APIs"},
			},
			{
				Company:   "Blank Street Coffee",
				Position:  "Barista",
				StartDate: time.Date(2024, 5, 1, 0, 0, 0, 0, time.UTC),
				EndDate:   nil, // Current position
				Location:  "New York, NY",
				Description: []string{
					"Handled $4K+ in daily POS transactions with accuracy while maintaining quality in a fast-paced environment",
					"Trained new staff and streamlined workflows, improving team efficiency during peak hours by 15%",
				},
				Technologies: []string{},
			},
		},

		Education: []Education{
			{
				Institution: "CUNY Hunter College",
				Degree:      "Bachelor of Arts",
				Field:       "Computer Science",
				StartDate:   time.Date(2022, 8, 1, 0, 0, 0, 0, time.UTC),
				EndDate:     time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC), // Expected graduation
				GPA:         "",
				Location:    "New York, NY",
			},
		},

		Interests: []string{
			"Security Research & Cryptography",
			"Gamified Fitness Applications",
			"Competitive Programming",
			"Minesweeper (Top 200 Player)",
			"Full-Stack Development",
			"Open Source Contributing",
		},
	}
}
