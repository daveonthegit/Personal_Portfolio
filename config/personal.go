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
		Title:    "Full Stack Developer, Secco Squared",
		Email:    "dxiao3043@gmail.com",
		Phone:    "917-946-7086",
		Location: "New York, NY",
		LinkedIn: "https://linkedin.com/in/david-on-linked",
		GitHub:   "https://github.com/daveonthegit",
		Website:  "https://davidx.link",
		Tagline:  "Full Stack Developer at Secco Squared building internal tools, AI agents, and production web apps in TypeScript, React, PostgreSQL, and Python.",
		NowLine:  "Building at Secco Squared — partner-offer tooling in Next.js, a Slack AI agent on OpenAI tool calling, and Next.js REST APIs on Supabase.",
		Bio: `I'm a Full Stack Developer at Secco Squared, working across TypeScript, React, PostgreSQL, and Python. I like hard, load-bearing work: tools that replace manual entry, APIs that don't lose data when a partner goes down, and pipelines that make systems cheaper to change.

At Secco Squared I built OfferBridge, a Next.js/TypeScript tool that pulls offers from partner REST APIs, an AI agent in Slack on OpenAI tool calling, and a scheduled job that pauses capped offers before they overspend partner budgets; I also rebuilt a video sales funnel, saving $1,300+ per month. On the side I build Agentflow (a Python CLI that gates AI-written code changes behind schemas and human sign-off), Kyarafit (offline-first web and mobile apps that sync SQLite to Convex), and ForgeArena (a React fitness app gated on CI).`,

		Skills: []Skill{
			{
				Category: "Languages",
				Items:    []string{"TypeScript", "JavaScript", "Python", "SQL", "HTML/CSS", "PHP", "Bash"},
			},
			{
				Category: "Frameworks",
				Items:    []string{"React", "Next.js", "React Native", "Node.js", "Express", "Fastify", "Tailwind CSS", "REST APIs"},
			},
			{
				Category: "Data & DevOps",
				Items:    []string{"PostgreSQL", "MySQL", "Supabase", "Convex", "SQLite", "Firestore", "Git", "GitHub Actions CI/CD", "Docker", "Vercel"},
			},
			{
				Category: "Testing & AI",
				Items:    []string{"Vitest", "Jest", "Playwright", "TDD", "Agile Scrum", "OpenAI API", "MCP", "Claude Code", "Codex", "Cursor"},
			},
		},

		Experience: []Experience{
			{
				Company:   "Secco Squared",
				Position:  "Full Stack Developer",
				Type:      "Full-time",
				Media:     "/static/images/portfolio-square-animation.gif",
				MediaAlt:  "Animated Secco Squared logo",
				StartDate: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
				EndDate:   nil,
				Location:  "New York, NY",
				Description: []string{
					"Cut 20 minutes of manual entry per offer and surfaced 28,560 missed offers by building OfferBridge, a Next.js/TypeScript tool that pulls offers from partner REST APIs and logs imports in PostgreSQL",
					"Let staff get live offer and sync answers in Slack by building an AI agent on OpenAI tool calling that runs multi-step lookups, checks each user's permissions, and asks before making changes",
					"Stopped live offers from overspending partner budgets, a revenue leak raised by the business team, with a scheduled Vercel cron job that pauses capped offers via the Everflow API and alerts Slack",
					"Kept sales leads from being lost when partner systems went down by building a Next.js REST API on Supabase (PostgreSQL) that saves each lead first, then delivers it with automatic retries",
					"Saved $1,300+ per month by rebuilding a video sales funnel as responsive HTML/CSS pages in Next.js and React, with video streaming and ad-conversion tracking",
					"Shipped 175+ merged pull requests across 11 company codebases by setting up GitHub Actions CI/CD pipelines, writing tests first (TDD), and using AI agents (Claude Code, Cursor) to write and review code",
				},
				Technologies: []string{"TypeScript", "React", "PostgreSQL", "Python"},
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
					"Shipped service extractions across several production releases by decomposing a PHP/JavaScript monolith alongside senior engineers and testing changes before code review",
					"Sped up slow REST endpoints by batching repeated MySQL queries and validating inputs in the PHP backend",
					"Made UI fixes land once instead of in every copy by consolidating duplicate forms and modals into shared React components, delivered in Agile Scrum sprints",
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
