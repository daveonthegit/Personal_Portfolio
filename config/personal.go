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
	Tagline    string // Short one-line positioning statement for the hero.
	NowLine    string // Single-sentence "currently" status for the status-line.
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
		Title:    "Software engineer, CS student",
		Email:    "dxiao3043@gmail.com",
		Phone:    "917-946-7086",
		Location: "New York, NY",
		LinkedIn: "https://linkedin.com/in/david-on-linked",
		GitHub:   "https://github.com/daveonthegit",
		Website:  "https://davidx.tech",
		Tagline:  "Software engineer graduating May 2026 — production internship experience plus shipped projects across full-stack web, cross-platform mobile, and low-level systems.",
		NowLine:  "Finishing my CS degree at Hunter College, shipping Kyarafit and OutfAI, and looking for a 2026 new-grad software role.",
		Bio: `I'm a Computer Science senior at CUNY Hunter College and a software engineer focused on API performance, security, and reliable delivery. Fluent across TypeScript, React, Node.js, Python, Go, and C — I like hard, load-bearing work: rewriting legacy code into components, tightening REST APIs, and making systems cheaper to change.

At Unadat I decomposed a legacy PHP/JavaScript monolith into modular microservices, shipped a reusable React component library adopted by three product teams, and hardened backend endpoints against SQL injection and XSS. On the side I build Kyarafit (offline-first TypeScript monorepo for web + mobile), OutfAI (a recommendation engine with explainable rationales), and RandCompile (a GCC plugin hardening Linux kernel binaries).`,

		Skills: []Skill{
			{
				Category: "Languages",
				Items:    []string{"TypeScript", "JavaScript", "Python", "Go", "C", "C++", "SQL", "PHP", "Bash"},
			},
			{
				Category: "Frameworks",
				Items:    []string{"React", "React Native", "Next.js", "Node.js", "Express.js", "FastAPI", "Expo"},
			},
			{
				Category: "Databases",
				Items:    []string{"PostgreSQL", "MySQL", "SQLite", "Convex", "Firestore"},
			},
			{
				Category: "Testing & DevOps",
				Items:    []string{"Vitest", "Jest", "Playwright", "Docker", "GitHub Actions", "Jenkins", "GCP", "Vercel", "Heroku", "Linux"},
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
					"Decomposed a legacy PHP/JavaScript monolith into modular microservices, cutting feature delivery time by 25% across 6 production releases",
					"Optimized 10+ REST endpoints with input validation and query batching, reducing average response time by 15%",
					"Shipped a reusable React component library adopted by 3 product teams, eliminating duplicate modal and form implementations",
					"Hardened backend endpoints against SQL injection and XSS by introducing parameterized queries and centralized input sanitization",
				},
				Technologies: []string{"JavaScript", "PHP", "React", "MySQL", "RESTful APIs"},
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
