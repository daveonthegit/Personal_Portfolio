package main

import (
	"os"
	"strings"
	"testing"
)

func TestProjectImagePathsExist(t *testing.T) {
	for _, p := range EnsureProjectImages(LoadProjects()) {
		fsPath := strings.TrimPrefix(p.Image, "/")
		if _, err := os.Stat(fsPath); err != nil {
			t.Errorf("project %q: image missing on disk: %s (%v)", p.ID, fsPath, err)
		}
	}
}

func TestEnsureProjectImagesUsesPlaceholderForMissing(t *testing.T) {
	raw := LoadProjects()
	fake := make([]Project, len(raw))
	copy(fake, raw)
	if len(fake) == 0 {
		t.Skip("no projects")
	}
	fake[0].Image = "/static/images/does-not-exist-xyz.png"
	fixed := EnsureProjectImages(fake)
	if fixed[0].Image != projectImagePlaceholder {
		t.Errorf("expected placeholder, got %q", fixed[0].Image)
	}
}
