import { StartupAnimation } from '../components/StartupAnimation';
import { mountZoomInCover, playZoomIn } from '../os/zoomIn';

/** One bounded, cancellable front-door arrival. Deep links never require it. */
export function initBootOverlay(): void {
  const body = document.body;
  const apex = (location.pathname.replace(/\/+$/, '') || '/') === '/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bypass = document.getElementById('xw-intro-bypass');
  const originalHash = location.hash;
  const abort = new AbortController();
  let startup: StartupAnimation | null = null;
  let ended = false;
  let watchdog: number | undefined;
  let cityModule: typeof import('../os/city3d') | null = null;
  // Dither moments are an enhancement: they attach when their chunk lands, never gate a beat.
  let introFx: typeof import('./introDither') | null = null;
  let handshake: import('./introDither').Handshake | null = null;
  let decode: import('./introDither').Decode | null = null;
  let bootStage = -1;

  const finish = (skipped = false, reason = skipped ? 'bypass' : 'complete') => {
    if (ended) return;
    ended = true;
    const returnFocus = skipped || document.activeElement === bypass;
    window.clearTimeout(watchdog);
    handshake?.stop();
    handshake = null;
    decode?.cancel();
    decode = null;
    if (skipped) {
      abort.abort();
      startup?.skip();
      cityModule?.settleDesktop();
    }
    document.getElementById('startup-animation')?.remove();
    bypass?.remove();
    document.removeEventListener('keydown', onKey);
    body.classList.remove('xw-booting', 'xw-boot-pending', 'xw-introing');
    body.classList.add('xw-boot-done');
    if (apex) {
      const url = new URL(location.href);
      url.pathname = '/home';
      url.searchParams.delete('noboot');
      history.replaceState(null, '', url.pathname + url.search + originalHash);
    }
    performance.mark('xw:intro-ready', { detail: reason });
    // The Companion App subscribes before the asynchronous arrival completes.
    window.dispatchEvent(new CustomEvent('xw:intro-ready', { detail: { apex } }));
    if (returnFocus) {
      const target = document.querySelector<HTMLElement>('.xw-window[data-app="dossier"] .xw-window-body')
        ?? document.getElementById('main-content');
      target?.focus({ preventScroll: true });
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    // Do not let this same Escape close the newly revealed Dossier.
    e.preventDefault();
    e.stopImmediatePropagation();
    finish(true);
  };

  if (body.dataset.page !== 'home' || !apex || new URLSearchParams(location.search).get('noboot') === '1' || originalHash) {
    finish();
    return;
  }

  const bootCover = document.getElementById('startup-animation');
  if (bootCover && getComputedStyle(bootCover).visibility === 'hidden') {
    // CSS already uncovered the document during a slow entry-script download.
    finish(true, 'late-start');
    return;
  }

  performance.mark('xw:intro-start');
  body.classList.add('xw-booting', 'xw-introing');
  bypass?.focus({ preventScroll: true });
  document.addEventListener('keydown', onKey, { signal: abort.signal });
  bypass?.addEventListener('click', e => { e.preventDefault(); finish(true); }, { signal: abort.signal });
  // A stalled import, hidden-tab timeline, or failed GPU must never hold the file.
  watchdog = window.setTimeout(() => finish(true, 'deadline'), 8000);
  // Requested ahead of the city chunk so the small dither layer is evaluated first.
  const fxP = reduced ? Promise.resolve(null) : import('./introDither').catch(() => null);
  const cityP = reduced ? Promise.resolve(null) : import('../os/city3d')
    .then(async m => {
      cityModule = m;
      // Shell and coordinator share the chunk. Mount occurs in the shell's import continuation.
      await new Promise<void>(resolve => window.setTimeout(resolve, 0));
      await m.prepareIntro();
      if (ended) m.settleDesktop();
      return m;
    }).catch(() => null);

  const onStage = (stage: number) => {
    bootStage = stage;
    if (stage >= 6) {
      // The geometric reveal covers the screen: the carrier has done its job, and
      // the decode layer waits beneath so the boot's fade never exposes the city early.
      handshake?.stop();
      handshake = null;
      if (!ended && !decode) decode = introFx?.mountDecode() ?? null;
    } else handshake?.step(stage);
  };
  void fxP.then(m => {
    introFx = m;
    const host = document.getElementById('startup-animation');
    if (!m || ended || bootStage >= 6 || !host?.isConnected || !startup?.isRunning) return;
    handshake = m.mountHandshake(host, Math.max(0, bootStage));
  });

  try {
    startup = new StartupAnimation({
      onStage,
      onFinish: skipped => {
        handshake?.stop();
        handshake = null;
        if (ended) return;
        if (skipped) { finish(true); return; }
        // Do not replace a boot graphic with an empty screen while waiting for 3D.
        const cover = mountZoomInCover();
        void Promise.race([
          cityP,
          new Promise<null>(resolve => window.setTimeout(() => resolve(null), 350)),
        ]).then(m => {
          if (ended) { cover.remove(); decode?.cancel(); return; }
          if (m?.cityMounted()) {
            cover.classList.add('xw-zoomin--clear');
            if (m.playIntro(cover, () => finish(), abort.signal)) {
              // Same task as the clear: the city decodes from the held black.
              decode?.start(cover, abort.signal);
              performance.mark('xw:intro-city', { detail: 'webgl' });
              return;
            }
          }
          // A late scene is only a backdrop; it must not start another intro.
          void cityP.then(late => late?.settleDesktop());
          performance.mark('xw:intro-city', { detail: reduced ? 'quiet' : 'svg' });
          playZoomIn(cover, () => finish(), abort.signal);
          decode?.start(cover, abort.signal);
        }).catch(() => { cover.remove(); decode?.cancel(); finish(true, 'failure'); });
      },
    });
  } catch {
    finish(true, 'failure');
  }
}
