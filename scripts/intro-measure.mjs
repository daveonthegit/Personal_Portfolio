// Local Chrome/CDP measurement, no browser packages or external service required.
// Start a dedicated Chrome with --remote-debugging-port=18438 and a local profile.
// Usage: node scripts/intro-measure.mjs before desktop [http://localhost:18437]
import { writeFile, mkdir, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function connect(port = 18438) {
  const target = await (await fetch(`http://localhost:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
    } else for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  return {
    send,
    on(method, fn) { listeners.set(method, [...(listeners.get(method) ?? []), fn]); },
    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    },
    async screenshot(path) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path, Buffer.from(data, 'base64'));
      if ((await stat(path)).size < 1000) throw new Error(`Empty screenshot: ${path}`);
    },
    async close() { await send('Page.close'); ws.close(); },
  };
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));

const instrumentation = `(() => {
  const m = window.__introMetrics = { phases: [], frames: {}, longTasks: [], errors: [] };
  let phase = 'loading', previous = performance.now();
  const detect = () => document.querySelector('.xw-zoomin') ? 'city' : document.querySelector('#xiaoos-skip-btn') ? 'boot' : document.body?.classList.contains('xw-boot-done') ? 'ready' : 'loading';
  function frame(now) {
    const next = detect();
    if(next !== phase) { phase = next; m.phases.push({ phase, at: now }); }
    (m.frames[phase] ??= []).push(now - previous); previous = now;
    if(now < 26000) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  new PerformanceObserver(list => { for(const e of list.getEntries()) m.longTasks.push({ at:e.startTime, duration:e.duration, phase:detect() }); }).observe({ type:'longtask', buffered:true });
  addEventListener('error', e => m.errors.push(e.message));
  addEventListener('unhandledrejection', e => m.errors.push(String(e.reason)));
})()`;

async function measure() {
  const [label = 'before', profile = 'desktop', base = 'http://localhost:18437'] = process.argv.slice(2);
  const mobile = profile === 'mobile';
  const dir = `docs/evidence/intro-ux`;
  await mkdir(dir, { recursive: true });
  const c = await connect();
  await c.send('Page.enable'); await c.send('Network.enable'); await c.send('Runtime.enable');
  await c.send('Network.setCacheDisabled', { cacheDisabled: true });
  await c.send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 3 : 1, mobile });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await c.send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
  await c.send('Network.emulateNetworkConditions', { offline:false, latency:mobile ? 150 : 0, downloadThroughput:mobile ? 200000 : -1, uploadThroughput:mobile ? 93750 : -1 });
  const requests = [], exceptions = [], consoleProblems = [];
  c.on('Network.responseReceived', e => requests.push({ url:e.response.url, status:e.response.status, mime:e.response.mimeType }));
  c.on('Runtime.exceptionThrown', e => exceptions.push(e.exceptionDetails));
  c.on('Runtime.consoleAPICalled', e => { if (['warning','error'].includes(e.type)) consoleProblems.push(e.args.map(a=>a.value ?? a.description).join(' ')); });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: instrumentation });
  await c.send('Page.navigate', { url:base + '/' });
  await sleep(2200);
  await c.screenshot(`${dir}/${label}-${profile}-boot.png`);
  await sleep(24000);
  await c.screenshot(`${dir}/${label}-${profile}.png`);
  const result = await c.eval(`(() => {
    const m = window.__introMetrics;
    const summary = a => { const s = a.slice().sort((a,b)=>a-b); return { count:a.length, p95:s[Math.floor(s.length*.95)], max:Math.max(...s), over50ms:a.filter(x=>x>50).length }; };
    return { ...m, frames:Object.fromEntries(Object.entries(m.frames).map(([k,v])=>[k,summary(v)])), url:location.href,
      viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
      paints:performance.getEntriesByType('paint').map(e=>({name:e.name,at:e.startTime})),
      marks:performance.getEntriesByType('mark').map(e=>({name:e.name,at:e.startTime,detail:e.detail})),
      resources:performance.getEntriesByType('resource').map(e=>({url:e.name,transfer:e.transferSize,decoded:e.decodedBodySize,duration:e.duration})),
      overflow:document.documentElement.scrollWidth > innerWidth,
      skipHidden:document.querySelector('#startup-animation')?.getAttribute('aria-hidden') };
  })()`);
  const output = { label, profile, settings:{cpu:mobile?4:1,latencyMs:mobile?150:0,downloadBytesPerSecond:mobile?200000:'unthrottled',cache:'disabled',browser:'Chrome headless, local macOS'}, ...result, requests, exceptions, consoleProblems };
  await writeFile(`${dir}/${label}-${profile}.json`, JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({ label, profile, phases:result.phases, frames:result.frames, longTasks:result.longTasks, errors:result.errors, exceptions, overflow:result.overflow }, null, 2));
  await c.close();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await measure();
