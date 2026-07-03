package main

import (
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	maxContactBodyBytes = 64 << 10 // 64 KiB
)

// contactIPLimiter enforces a sliding window of POST /contact per IP (in-memory; resets on restart).
// Expired keys are swept out periodically so the map cannot grow without bound.
type contactIPLimiter struct {
	mu        sync.Mutex
	window    time.Duration
	max       int
	requests  map[string][]time.Time
	lastSweep time.Time
}

func newContactIPLimiter(window time.Duration, max int) *contactIPLimiter {
	return &contactIPLimiter{
		window:   window,
		max:      max,
		requests: make(map[string][]time.Time),
	}
}

func (l *contactIPLimiter) allow(ip string) bool {
	return l.allowAt(ip, time.Now())
}

// allowAt is the time-injectable core of allow, used directly by tests.
func (l *contactIPLimiter) allowAt(ip string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	cutoff := now.Add(-l.window)

	// Periodic full sweep bounds memory: drop keys whose timestamps have all
	// expired so a flood of distinct IPs can't grow the map forever.
	if now.Sub(l.lastSweep) >= l.window {
		for k, ts := range l.requests {
			if kept := filterAfter(ts, cutoff); len(kept) == 0 {
				delete(l.requests, k)
			} else {
				l.requests[k] = kept
			}
		}
		l.lastSweep = now
	}

	kept := filterAfter(l.requests[ip], cutoff)
	if len(kept) >= l.max {
		l.requests[ip] = kept
		return false
	}
	l.requests[ip] = append(kept, now)
	return true
}

// filterAfter returns the timestamps strictly newer than cutoff.
func filterAfter(times []time.Time, cutoff time.Time) []time.Time {
	var kept []time.Time
	for _, t := range times {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	return kept
}

// clientIP derives the rate-limit key. RemoteAddr is used by default because
// X-Forwarded-For is client-controlled and trivially spoofable. Only when the
// server is knowingly deployed behind a trusted proxy (trustProxy=true, e.g.
// TRUST_PROXY=true on Heroku) is the leftmost X-Forwarded-For hop trusted.
func clientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			if len(parts) > 0 {
				if ip := strings.TrimSpace(parts[0]); ip != "" {
					return ip
				}
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// normalizeOrigin reduces a raw Origin/Referer/allowlist entry to a lowercase
// "scheme://host[:port]" form for exact comparison. A bare host (no scheme)
// normalizes to just the host. Returns "" if no host can be parsed.
func normalizeOrigin(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if !strings.Contains(raw, "://") {
		raw = "//" + raw // let url.Parse treat a bare host as the authority
	}
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return ""
	}
	host := strings.ToLower(u.Host)
	if u.Scheme == "" {
		return host
	}
	return strings.ToLower(u.Scheme) + "://" + host
}

// hostOfOrigin returns the host[:port] portion of a normalized origin.
func hostOfOrigin(origin string) string {
	if i := strings.Index(origin, "://"); i >= 0 {
		return origin[i+3:]
	}
	return origin
}

// contactOriginAllowed guards POST /contact. It uses exact scheme+host matching
// (not prefix) so a look-alike suffix host like https://davidx.tech.evil.com is
// rejected. When ALLOWED_ORIGINS is unset it fails safe: same-origin requests
// (Origin host == request Host) are allowed, cross-origin ones are denied,
// instead of the previous allow-all behavior.
// JSON POST /contact is mitigated with this plus honeypot (not a full CSRF token).
func contactOriginAllowed(r *http.Request, allowed []string) bool {
	raw := strings.TrimSpace(r.Header.Get("Origin"))
	if raw == "" {
		raw = strings.TrimSpace(r.Header.Get("Referer"))
	}
	if raw == "" {
		// No Origin/Referer: not an identifiable cross-origin browser request
		// (same-origin form posts and non-browser clients may omit it). Allow.
		return true
	}

	reqOrigin := normalizeOrigin(raw)
	if reqOrigin == "" {
		return false
	}

	// Explicit allowlist: exact scheme+host match only.
	for _, a := range allowed {
		if ao := normalizeOrigin(a); ao != "" && strings.EqualFold(ao, reqOrigin) {
			return true
		}
	}

	// Fail-safe same-origin check (covers the unset-allowlist case): the request's
	// own Origin host must equal the Host it was sent to.
	if h := hostOfOrigin(reqOrigin); h != "" && strings.EqualFold(h, strings.ToLower(strings.TrimSpace(r.Host))) {
		return true
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
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://api.github.com; frame-src 'self' https://www.youtube.com https://www.google.com; base-uri 'self'; form-action 'self'")
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
