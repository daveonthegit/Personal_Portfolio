/**
 * Print the resume PDF (same document as the inline preview), not the surrounding page.
 */
export function initResumePdfPrint(): void {
  const btn = document.getElementById('resume-print-pdf');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const frame = document.querySelector<HTMLIFrameElement>('#resume-pdf-preview');
    if (frame?.contentWindow) {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        return;
      } catch {
        /* PDF plugin / cross-origin — open in a new tab */
      }
    }
    window.open('/resume/pdf', '_blank', 'noopener,noreferrer');
  });
}
