package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// Fix 1: email header injection — a Subject carrying CRLF must not smuggle
// extra headers (e.g. Bcc) into the outbound message.
func TestBuildContactMessageSanitizesSubject(t *testing.T) {
	s := &Server{emailConfig: EmailConfig{
		FromEmail: "from@example.com",
		ToEmail:   "to@example.com",
	}}

	form := ContactForm{
		Name:    "Attacker",
		Email:   "attacker@example.com",
		Subject: "hello\r\nBcc: evil@x.com",
		Message: "body",
	}

	m := s.buildContactMessage(form)

	subs := m.GetHeader("Subject")
	if len(subs) != 1 {
		t.Fatalf("expected exactly one Subject header, got %d: %v", len(subs), subs)
	}
	subj := subs[0]
	if strings.ContainsAny(subj, "\r\n") {
		t.Errorf("Subject header still contains CR/LF: %q", subj)
	}

	// The injected text collapses to harmless subject content; what matters is
	// that a CRLF-injected value never materializes as a real Bcc header.
	if bcc := m.GetHeader("Bcc"); len(bcc) != 0 {
		t.Errorf("unexpected Bcc header injected: %v", bcc)
	}
}

func TestSanitizeHeaderValue(t *testing.T) {
	cases := map[string]string{
		"clean subject":       "clean subject",
		"line1\r\nline2":      "line1  line2",
		"trailing\n":          "trailing",
		"nul\x00byte":         "nulbyte",
		"\r\nBcc: evil@x.com": "Bcc: evil@x.com",
	}
	for in, want := range cases {
		if got := sanitizeHeaderValue(in); got != want {
			t.Errorf("sanitizeHeaderValue(%q) = %q, want %q", in, got, want)
		}
	}
}

// Fix 2: rate-limit key must derive from RemoteAddr, not spoofable XFF, unless
// the server is explicitly told it sits behind a trusted proxy.
func TestClientIPIgnoresXFFByDefault(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/contact", nil)
	r.RemoteAddr = "203.0.113.5:44321"
	r.Header.Set("X-Forwarded-For", "1.2.3.4")

	if got := clientIP(r, false); got != "203.0.113.5" {
		t.Errorf("clientIP(trustProxy=false) = %q, want %q (must not trust XFF)", got, "203.0.113.5")
	}
	if got := clientIP(r, true); got != "1.2.3.4" {
		t.Errorf("clientIP(trustProxy=true) = %q, want %q", got, "1.2.3.4")
	}
}

// Fix 2: the limiter map must not grow forever — expired keys get swept.
func TestContactLimiterEvictsExpiredEntries(t *testing.T) {
	l := newContactIPLimiter(10*time.Millisecond, 2)
	t0 := time.Now()

	if !l.allowAt("1.1.1.1", t0) {
		t.Fatal("first request should be allowed")
	}
	if len(l.requests) != 1 {
		t.Fatalf("expected 1 tracked key, got %d", len(l.requests))
	}

	// A later request past the window triggers the sweep, evicting 1.1.1.1.
	later := t0.Add(20 * time.Millisecond)
	if !l.allowAt("2.2.2.2", later) {
		t.Fatal("request from new IP should be allowed")
	}
	if _, ok := l.requests["1.1.1.1"]; ok {
		t.Errorf("expected 1.1.1.1 to be evicted after window, still present")
	}
	if len(l.requests) != 1 {
		t.Errorf("expected only the live key to remain, got %d: %v", len(l.requests), l.requests)
	}
}

func TestContactLimiterEnforcesMax(t *testing.T) {
	l := newContactIPLimiter(time.Hour, 2)
	now := time.Now()
	if !l.allowAt("9.9.9.9", now) || !l.allowAt("9.9.9.9", now) {
		t.Fatal("first two requests within limit should be allowed")
	}
	if l.allowAt("9.9.9.9", now) {
		t.Error("third request over the limit should be denied")
	}
}

// Fix 3: origin allowlist must be exact-match, rejecting look-alike suffixes.
func TestContactOriginAllowedRejectsEvilSuffix(t *testing.T) {
	allowed := []string{"https://davidx.tech"}

	evil := httptest.NewRequest(http.MethodPost, "/contact", nil)
	evil.Header.Set("Origin", "https://davidx.tech.evil.com")
	if contactOriginAllowed(evil, allowed) {
		t.Error("evil suffix origin https://davidx.tech.evil.com must be rejected")
	}

	good := httptest.NewRequest(http.MethodPost, "/contact", nil)
	good.Header.Set("Origin", "https://davidx.tech")
	if !contactOriginAllowed(good, allowed) {
		t.Error("exact allowed origin https://davidx.tech must be permitted")
	}
}

// Fix 3: with the allowlist unset, cross-origin is denied but same-origin allowed.
func TestContactOriginUnsetAllowlistFailsSafe(t *testing.T) {
	// Cross-origin request with an explicit foreign Origin -> deny.
	cross := httptest.NewRequest(http.MethodPost, "/contact", nil)
	cross.Host = "davidx.tech"
	cross.Header.Set("Origin", "https://evil.com")
	if contactOriginAllowed(cross, nil) {
		t.Error("cross-origin request must be denied when allowlist is unset")
	}

	// Same-origin request (Origin host == Host) -> allow.
	same := httptest.NewRequest(http.MethodPost, "/contact", nil)
	same.Host = "davidx.tech"
	same.Header.Set("Origin", "https://davidx.tech")
	if !contactOriginAllowed(same, nil) {
		t.Error("same-origin request must be allowed when allowlist is unset")
	}

	// No Origin/Referer at all -> allow (non-browser / same-origin form post).
	none := httptest.NewRequest(http.MethodPost, "/contact", nil)
	none.Host = "davidx.tech"
	if !contactOriginAllowed(none, nil) {
		t.Error("request with no Origin/Referer should be allowed")
	}
}
