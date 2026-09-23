package main

import (
	"bytes"
	"compress/zlib"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

const (
	resumeHTMLPath = "./static/assets/resume.html"
	resumeTexPath  = "./static/assets/resume.tex"
	resumeATSPath  = "./static/assets/resume-ats.txt"
	resumePDFPath  = "./static/assets/resume.pdf"
	publicCVPath   = "./static/data/cv.json"
)

// touchTexAheadOfHTML makes resume.tex look newer than resume.html, which is
// exactly the condition the old handler used to trigger a runtime rebuild. The
// original mtimes are restored when the test ends so the worktree is untouched.
func touchTexAheadOfHTML(t *testing.T) {
	t.Helper()

	texInfo, err := os.Stat(resumeTexPath)
	if err != nil {
		t.Fatalf("stat %s: %v", resumeTexPath, err)
	}
	htmlInfo, err := os.Stat(resumeHTMLPath)
	if err != nil {
		t.Fatalf("stat %s: %v", resumeHTMLPath, err)
	}

	future := htmlInfo.ModTime().Add(time.Hour)
	if err := os.Chtimes(resumeTexPath, future, future); err != nil {
		t.Fatalf("chtimes %s: %v", resumeTexPath, err)
	}
	t.Cleanup(func() {
		_ = os.Chtimes(resumeTexPath, texInfo.ModTime(), texInfo.ModTime())
	})
}

// A stale resume.html must never be regenerated at runtime. resume.html is
// generated from the career-ops export by scripts/build-resume-web.mjs, not from
// resume.tex; the removed in-process converter used to overwrite the committed
// page with malformed markup whenever the .tex was touched.
func TestResumeHTMLNotRegeneratedWhenTexIsNewer(t *testing.T) {
	before, err := os.ReadFile(resumeHTMLPath)
	if err != nil {
		t.Fatalf("read %s: %v", resumeHTMLPath, err)
	}

	touchTexAheadOfHTML(t)

	// disableRuntimeResumeBuild stays false: this is the host configuration that
	// used to clobber the file (DISABLE_RUNTIME_RESUME_BUILD is unset in prod).
	s := &Server{}
	rec := httptest.NewRecorder()
	s.resumeHTMLHandler(rec, httptest.NewRequest(http.MethodGet, "/resume/html", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /resume/html = %d, want 200", rec.Code)
	}

	after, err := os.ReadFile(resumeHTMLPath)
	if err != nil {
		t.Fatalf("re-read %s: %v", resumeHTMLPath, err)
	}
	if string(before) != string(after) {
		t.Fatal("resume.html was rewritten on disk; runtime regeneration must not touch the committed file")
	}
	if body := rec.Body.String(); body != string(before) {
		t.Errorf("served body differs from the committed resume.html (%d vs %d bytes)", len(body), len(before))
	}
}

// The served resume page must be well-formed: balanced tags, no LaTeX residue,
// and no truncated anchors of the `<a href="...</strong>{...}` shape the old
// converter produced.
func TestResumeHTMLIsWellFormed(t *testing.T) {
	s := &Server{}
	rec := httptest.NewRecorder()
	s.resumeHTMLHandler(rec, httptest.NewRequest(http.MethodGet, "/resume/html", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /resume/html = %d, want 200", rec.Code)
	}
	body := rec.Body.String()

	if !strings.Contains(body, "davidx.link") {
		t.Error("served resume HTML does not mention davidx.link")
	}
	if !strings.Contains(body, "Agentflow") {
		t.Error("served resume HTML does not mention Agentflow (stale resume content?)")
	}

	for _, stale := range []string{"RandCompile", "davidx.tech"} {
		if strings.Contains(body, stale) {
			t.Errorf("served resume HTML still contains stale content %q", stale)
		}
	}

	// LaTeX residue from the removed converter.
	for _, residue := range []string{`\resume`, `\begin{`, `\end{`, `\textbf`, `$|$`} {
		if strings.Contains(body, residue) {
			t.Errorf("served resume HTML contains raw LaTeX %q", residue)
		}
	}

	// Balanced markup. The mangled output closed anchors and list items with
	// </strong>, so the counts drifted badly apart.
	for _, tag := range []string{"a", "strong", "li", "ul", "section", "article", "h2", "h3"} {
		open := strings.Count(body, "<"+tag+" ") + strings.Count(body, "<"+tag+">")
		closed := strings.Count(body, "</"+tag+">")
		if open != closed {
			t.Errorf("unbalanced <%s>: %d opened, %d closed", tag, open, closed)
		}
	}

	// Every anchor's href must terminate before any markup leaks into it.
	for _, frag := range strings.Split(body, `<a href="`)[1:] {
		href, _, ok := strings.Cut(frag, `"`)
		if !ok {
			t.Fatal("unterminated href attribute in served resume HTML")
		}
		if strings.ContainsAny(href, "<>{}\\") {
			t.Errorf("malformed href %q", href)
		}
	}
}

// The generated surfaces must all agree with the committed career-ops export.
func TestResumeSurfacesMatchCVExport(t *testing.T) {
	raw, err := os.ReadFile(publicCVPath)
	if err != nil {
		t.Fatalf("read %s: %v", publicCVPath, err)
	}

	var cv struct {
		Name    string `json:"name"`
		Contact map[string]struct {
			Value  string `json:"value"`
			Public bool   `json:"public"`
		} `json:"contact"`
		Experience []struct {
			Company string   `json:"company"`
			Bullets []string `json:"bullets"`
		} `json:"experience"`
		Projects []struct {
			Name string `json:"name"`
		} `json:"projects"`
	}
	if err := json.Unmarshal(raw, &cv); err != nil {
		t.Fatalf("parse %s: %v", publicCVPath, err)
	}

	if cv.Name == "" || len(cv.Experience) == 0 || len(cv.Projects) == 0 {
		t.Fatal("public cv.json is missing the fields the resume timeline consumes")
	}

	// static/data/cv.json is served at /static/data/cv.json, so it must not
	// carry contacts the export marked non-public.
	for key, c := range cv.Contact {
		if !c.Public {
			t.Errorf("non-public contact %q is exposed in the served cv.json", key)
		}
	}

	html, err := os.ReadFile(resumeHTMLPath)
	if err != nil {
		t.Fatalf("read %s: %v", resumeHTMLPath, err)
	}
	ats, err := os.ReadFile(resumeATSPath)
	if err != nil {
		t.Fatalf("read %s: %v", resumeATSPath, err)
	}

	for _, p := range cv.Projects {
		if !strings.Contains(string(html), p.Name) {
			t.Errorf("resume.html is missing project %q", p.Name)
		}
		if !strings.Contains(string(ats), p.Name) {
			t.Errorf("resume-ats.txt is missing project %q", p.Name)
		}
	}
	for _, e := range cv.Experience {
		if !strings.Contains(string(html), e.Company) {
			t.Errorf("resume.html is missing employer %q", e.Company)
		}
		if !strings.Contains(string(ats), e.Company) {
			t.Errorf("resume-ats.txt is missing employer %q", e.Company)
		}
	}
}

// The committed PDF is the approved artifact and must be served verbatim, even
// when resume.tex is newer than it.
func TestResumePDFServedVerbatimWhenTexIsNewer(t *testing.T) {
	before, err := os.ReadFile(resumePDFPath)
	if err != nil {
		t.Fatalf("read %s: %v", resumePDFPath, err)
	}

	pdfInfo, err := os.Stat(resumePDFPath)
	if err != nil {
		t.Fatalf("stat %s: %v", resumePDFPath, err)
	}
	texInfo, err := os.Stat(resumeTexPath)
	if err != nil {
		t.Fatalf("stat %s: %v", resumeTexPath, err)
	}
	future := pdfInfo.ModTime().Add(time.Hour)
	if err := os.Chtimes(resumeTexPath, future, future); err != nil {
		t.Fatalf("chtimes %s: %v", resumeTexPath, err)
	}
	t.Cleanup(func() {
		_ = os.Chtimes(resumeTexPath, texInfo.ModTime(), texInfo.ModTime())
	})

	for _, tc := range []struct {
		name    string
		handler func(http.ResponseWriter, *http.Request)
		path    string
	}{
		{"pdf", (&Server{}).resumePDFHandler, "/resume/pdf"},
		{"download", (&Server{}).resumeDownloadHandler, "/resume/download"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			tc.handler(rec, httptest.NewRequest(http.MethodGet, tc.path, nil))

			if rec.Code != http.StatusOK {
				t.Fatalf("GET %s = %d, want 200", tc.path, rec.Code)
			}
			if got := rec.Header().Get("Content-Type"); got != "application/pdf" {
				t.Errorf("Content-Type = %q, want application/pdf", got)
			}
			if !strings.HasPrefix(rec.Body.String(), "%PDF-") {
				t.Error("response body is not a PDF")
			}

			after, err := os.ReadFile(resumePDFPath)
			if err != nil {
				t.Fatalf("re-read %s: %v", resumePDFPath, err)
			}
			if string(before) != string(after) {
				t.Fatal("resume.pdf was rebuilt on disk; the approved PDF must be served verbatim")
			}
		})
	}
}

// The single-page guarantee the resume page advertises ("Pages: 1").
func TestResumePDFIsOnePage(t *testing.T) {
	pdf, err := os.ReadFile(resumePDFPath)
	if err != nil {
		t.Fatalf("read %s: %v", resumePDFPath, err)
	}
	if n := countPDFPages(t, pdf); n != 1 {
		t.Errorf("resume.pdf has %d pages, want 1", n)
	}
}

// countPDFPages counts /Type /Page objects. The PDF stores its object
// definitions in compressed object streams, so those are inflated first.
func countPDFPages(t *testing.T, pdf []byte) int {
	t.Helper()

	var inflated []byte
	for i := 0; ; {
		idx := bytes.Index(pdf[i:], []byte("stream"))
		if idx < 0 {
			break
		}
		start := i + idx + len("stream")
		// Skip the EOL that must follow the `stream` keyword.
		if start < len(pdf) && pdf[start] == '\r' {
			start++
		}
		if start < len(pdf) && pdf[start] == '\n' {
			start++
		}
		i = start

		end := bytes.Index(pdf[start:], []byte("endstream"))
		if end < 0 {
			break
		}
		zr, err := zlib.NewReader(bytes.NewReader(pdf[start : start+end]))
		if err != nil {
			continue // not a Flate stream (fonts, raw data)
		}
		out, err := io.ReadAll(zr)
		_ = zr.Close()
		if err == nil {
			inflated = append(inflated, out...)
		}
	}

	haystack := append(append([]byte{}, pdf...), inflated...)

	pages := 0
	for i := 0; ; {
		idx := bytes.Index(haystack[i:], []byte("/Type"))
		if idx < 0 {
			break
		}
		j := i + idx + len("/Type")
		i = j
		for j < len(haystack) && (haystack[j] == ' ' || haystack[j] == '\n' || haystack[j] == '\r' || haystack[j] == '\t') {
			j++
		}
		if !bytes.HasPrefix(haystack[j:], []byte("/Page")) {
			continue
		}
		// "/Pages" is the page-tree node, not a page.
		if k := j + len("/Page"); k < len(haystack) && haystack[k] == 's' {
			continue
		}
		pages++
	}
	return pages
}
