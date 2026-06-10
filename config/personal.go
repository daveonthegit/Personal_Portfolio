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
	Type         string
	Media        string
	MediaAlt     string
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
	Media       string
	MediaAlt    string
	StartDate   time.Time
	EndDate     time.Time
	GPA         string
	Location    string
}

// GetPersonalInfo returns the personal information
func GetPersonalInfo() PersonalInfo {
	return PersonalInfo{
		Name:     "David Xiao",
		Title:    "Web Developer, Secco Squared",
		Email:    "dxiao3043@gmail.com",
		Phone:    "917-946-7086",
		Location: "New York, NY",
		LinkedIn: "https://linkedin.com/in/david-on-linked",
		GitHub:   "https://github.com/daveonthegit",
		Website:  "https://davidx.tech",
		Tagline:  "Web Developer at Secco Squared focused on full-stack web applications, lead-generation flows, and data-driven optimization. I ship A/B-tested Next.js pages, client integrations, and in-house tooling.",
		NowLine:  "Building production web at Secco Squared — A/B testing pages, optimizing lead-generation funnels, and shipping Next.js client integrations.",
		Bio: `I'm a Web Developer at Secco Squared focused on full-stack web applications, lead-generation flows, and reliable delivery. Fluent across TypeScript, React, Next.js, Node.js, Python, Go, and C, I like hard, load-bearing work: A/B testing and optimizing pages, tightening REST APIs, and making systems cheaper to change.

At Secco Squared I run A/B tests on production pages, optimize lead-generation flows with data-driven decisions, build client integrations and in-house tooling, and rebuilt a video site's lead funnel — cutting costs by $1,300+ monthly. On the side I build Kyarafit (offline-first TypeScript monorepo for web + mobile), OutfAI (a recommendation engine with explainable rationales), and RandCompile (a GCC plugin hardening Linux kernel binaries).`,

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
				Company:   "Secco Squared",
				Position:  "Web Developer",
				Type:      "Full-time",
				Media:     "/static/images/portfolio-square-animation.gif",
				MediaAlt:  "Animated Secco Squared logo",
				StartDate: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
				EndDate:   nil,
				Location:  "New York, NY",
				Description: []string{
					"Rebuilt a video site's lead funnel, reducing costs by $1,300+ monthly while improving conversion",
					"Run A/B tests on production pages and optimize lead-generation flows through data-driven decisions",
					"Build Next.js features and client integrations across production web projects",
					"Develop in-house tooling to streamline team workflows",
				},
				Technologies: []string{"Next.js", "React", "TypeScript", "A/B testing", "Lead generation", "Client integrations"},
			},
			{
				Company:   "Unadat",
				Position:  "Software Engineer Intern",
				Type:      "Internship",
				Media:     "/static/images/unadat-logo.jfif",
				MediaAlt:  "Unadat logo",
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
				Media:       "/static/images/cuny-hunter-college.jpg",
				MediaAlt:    "CUNY Hunter College logo",
				StartDate:   time.Date(2022, 8, 1, 0, 0, 0, 0, time.UTC),
				EndDate:     time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC), // Graduated
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
