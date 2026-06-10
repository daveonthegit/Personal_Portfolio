package main

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

const (
	maxContactBodyBytes = 64 << 10 // 64 KiB
)

// contactIPLimiter enforces a sliding window of POST /contact per IP (in-memory; resets on restart).
type contactIPLimiter struct {
	mu       sync.Mutex
	window   time.Duration
	max      int
	requests map[string][]time.Time
}

func newContactIPLimiter(window time.Duration, max int) *contactIPLimiter {
	return &contactIPLimiter{
		window:   window,
		max:      max,
		requests: make(map[string][]time.Time),
	}
}

func (l *contactIPLimiter) allow(ip string) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()

	cutoff := now.Add(-l.window)
	times := l.requests[ip]
	var kept []time.Time
	for _, t := range times {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= l.max {
		l.requests[ip] = kept
		return false
	}
	kept = append(kept, now)
	l.requests[ip] = kept
	return true
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// contactOriginAllowed returns true if ALLOWED_ORIGINS is unset/empty, or Origin/Referer matches an allowed prefix.
// JSON POST /contact is mitigated with this plus honeypot (not a full CSRF token).
func contactOriginAllowed(r *http.Request, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}
	raw := strings.TrimSpace(r.Header.Get("Origin"))
	if raw == "" {
		raw = strings.TrimSpace(r.Header.Get("Referer"))
	}
	if raw == "" {
		return false
	}
	for _, a := range allowed {
		a = strings.TrimSpace(a)
		if a == "" {
			continue
		}
		if strings.HasPrefix(raw, a) {
			return true
		}
	}
	return false
}

func securityHeadersMiddleware(enableHSTS bool, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		// Pragmatic CSP: allows existing inline script in base.html and CDN fonts/scripts used by the app
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; frame-src 'self' https://www.youtube.com https://www.google.com; base-uri 'self'; form-action 'self'")
		if enableHSTS {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		next.ServeHTTP(w, r)
	})
}

type redirectConfig struct {
	CanonicalHost string // e.g. davidx.tech
	ApexHost      string // optional alternate host to fold into CanonicalHost
}

func httpsRedirectMiddleware(cfg redirectConfig, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isLocalDevHost(r.Host) {
			next.ServeHTTP(w, r)
			return
		}

		if cfg.CanonicalHost == "" {
			next.ServeHTTP(w, r)
			return
		}

		host := strings.ToLower(strings.TrimSpace(r.Host))
		canonical := strings.ToLower(strings.TrimSpace(cfg.CanonicalHost))
		apex := strings.ToLower(strings.TrimSpace(cfg.ApexHost))

		isKnown := host == canonical || (apex != "" && host == apex)
		if !isKnown {
			next.ServeHTTP(w, r)
			return
		}

		if r.Header.Get("X-Forwarded-Proto") != "https" && r.TLS == nil {
			u := "https://" + canonical + r.RequestURI
			http.Redirect(w, r, u, http.StatusMovedPermanently)
			return
		}

		if host != canonical {
			u := "https://" + canonical + r.RequestURI
			http.Redirect(w, r, u, http.StatusMovedPermanently)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isLocalDevHost(host string) bool {
	return host == "localhost:8080" || host == "127.0.0.1:8080" || host == "localhost" || host == "127.0.0.1"
}
