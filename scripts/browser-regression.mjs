// Behavioral checks against a real Go server and dedicated local Chrome/CDP.
// Start Chrome with --remote-debugging-port=18438 and a disposable local profile.
// No contact messages are sent; no browser/test packages are required.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect, sleep } from './intro-measure.mjs';
const base = process.env.PORTFOLIO_URL ?? 'http://localhost:18437';
const evidence = 'docs/evidence/intro-ux';
await mkdir(evidence, { recursive: true });
const c = await connect(Number(process.env.CHROME_PORT ?? 18438));
const failures = [], results = [], exceptions = [], responses = [], consoleProblems = [];
let requests = [], held = [];
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Network.enable');
await c.send('Network.setCacheDisabled',{cacheDisabled:true});
c.on('Runtime.exceptionThrown', e => exceptions.push(e.exceptionDetails));
c.on('Runtime.consoleAPICalled', e => { if (['warning','error'].includes(e.type)) consoleProblems.push(e.args.map(a=>a.value ?? a.description).join(' ')); });
c.on('Network.requestWillBeSent', e => requests.push(e.request.url));
c.on('Network.responseReceived', e => responses.push({url:e.response.url,status:e.response.status}));
c.on('Fetch.requestPaused', e => held.push(e.requestId));
const check = async (name, test) => {
  if (process.env.CHECK_FILTER && !name.includes(process.env.CHECK_FILTER)) return;
  try { await test(); results.push({name,pass:true}); console.log('PASS', name); }
  catch(e) { failures.push(name); results.push({name,pass:false,error:e.message}); console.error('FAIL', name, e.stack); }
};
async function waitFor(expression, ms = 5000) {
  const end = Date.now() + ms;
  do { if (await c.eval(expression)) return; await sleep(50); } while (Date.now() < end);
  throw new Error(`Timed out: ${expression}`);
}
const navigate = async path => {
  requests = [];
  const started = Date.now();
  const navigation = await c.send('Page.navigate',{url:base+path});
  assert.equal(navigation.errorText,undefined,'navigation failed; verify the local server is ready');
  await waitFor(`${navigation.loaderId ? `performance.timeOrigin >= ${started - 5} && ` : ''}document.readyState === 'complete'`,15000);
};
const isReady = `document.body.classList.contains('xw-boot-done') && !document.querySelector('.xw-zoomin')`;
async function press(key, extra = {}) {
  const windowsVirtualKeyCode = {Tab:9,Escape:27,Enter:13}[key];
  await c.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode,...extra});
  await c.send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode,...extra});
}
async function click(selector) {
  const point = await c.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({behavior:'instant',block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
}
async function viewport(width, mobile = false) {
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:mobile?844:900,deviceScaleFactor:mobile?3:1,mobile});
  await c.send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
}
try {
  await viewport(1440);
  await check('front-door choreography completes within 8.5s, without the deadline masking it', async () => {
    await navigate('/');
    await waitFor(isReady, 8500);
    const marks = await c.eval(`performance.getEntriesByType('mark').filter(e=>e.name.startsWith('xw:intro')).map(e=>({name:e.name,at:e.startTime,reason:e.detail}))`);
    assert.equal(marks.at(-1).reason,'complete');
    assert.ok(marks.at(-1).at - marks[0].at < 8000);
    assert.equal(requests.some(url => url.endsWith('/api/projects')),false,'room previews must not load at arrival');
  });
  await check('Replay starts a new boot; Enter bypass preserves query parameters', async () => {
    await navigate('/home');
    await click('.xw-replay');
    await waitFor(`!!document.querySelector('.xiaoos-loader-container')`);
    assert.equal(await c.eval(`document.activeElement.id`),'xw-intro-bypass');
    await press('Enter'); await waitFor(isReady,500);
    await navigate('/?from=qa');
    await waitFor(`!!document.querySelector('.xiaoos-loader-container')`);
    await press('Escape'); await waitFor(isReady,500);
    assert.equal(await c.eval(`location.pathname + location.search`),'/home?from=qa');
  });
  await check('Escape during a pending city import reveals the file; late completion cannot resurrect intro', async () => {
    held = [];
    await c.send('Fetch.enable',{patterns:[{urlPattern:'*city3d-*.js*',requestStage:'Request'}]});
    await c.send('Page.navigate',{url:base+'/'});
    await waitFor(`!!document.querySelector('.xiaoos-loader-container')`);
    assert.equal(await c.eval(`!!document.querySelector('#xw-intro-bypass') && !document.querySelector('#xw-intro-bypass').closest('[aria-hidden="true"]')`),true);
    await press('Escape'); await waitFor(isReady,500);
    assert.equal(await c.eval(`!!document.querySelector('.xw-window[data-app="dossier"]')`),true);
    for (const id of held) await c.send('Fetch.continueRequest',{requestId:id});
    await c.send('Fetch.disable');
    await sleep(3500); assert.equal(await c.eval(isReady),true);
    assert.equal(await c.eval(`document.activeElement.classList.contains('xw-window-body')`),true);
  });
  await check('city-phase bypass cancels nested timelines and retains the Dossier', async () => {
    await navigate('/'); await waitFor(`!!document.querySelector('#xw-zi-type')`,5000);
    await click('#xw-intro-bypass'); await waitFor(isReady,500);
    await sleep(1800);
    assert.equal(await c.eval(`!!document.querySelector('.xw-window[data-app="dossier"]') && !document.querySelector('.xw-zoomin')`),true);
  });
  await check('noboot and section deep links retain their destination', async () => {
    await navigate('/?noboot=1#experience');
    assert.equal(await c.eval('location.hash'),'#experience'); assert.equal(await c.eval(isReady),true);
    await navigate('/#projects'); assert.equal(await c.eval('location.hash'),'#projects');
    assert.equal(await c.eval(`!!document.querySelector('.xiaoos-loader-container')`),false);
  });
  await check('malformed bookmark leaves the Dossier usable', async () => {
    await navigate('/home#%E0%A4%A');
    await waitFor(`!!document.querySelector('.xw-window[data-app="dossier"]')`);
    await sleep(100);
  });
  await check('reduced motion keeps static narrative, without downloading WebGL', async () => {
    await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await navigate('/');
    await waitFor(`!!document.querySelector('.xiaoos-loader-container')`);
    await waitFor(`!!document.querySelector('.xw-zoomin--quiet')`);
    await c.screenshot(`${evidence}/after-reduced-motion.png`);
    await waitFor(isReady,5000);
    assert.equal(await c.eval(`!!document.querySelector('.xw-city-canvas')`),false);
    assert.equal(requests.some(url=>url.includes('city3d-')),false);
    await c.send('Emulation.setEmulatedMedia',{features:[]});
  });
  await check('missing city chunk runs the SVG fallback and exposes content', async () => {
    await c.send('Network.setBlockedURLs',{urls:['*city3d-*.js*']});
    await navigate('/'); await waitFor(`!!document.querySelector('.xw-zoomin:not(.xw-zoomin--clear)')`);
    await c.screenshot(`${evidence}/after-svg-fallback.png`);
    await waitFor(isReady,8500);
    assert.equal(await c.eval(`!!document.querySelector('.xw-window[data-app="dossier"]')`),true);
    await c.send('Network.setBlockedURLs',{urls:[]});
  });
  await check('stalled animation frames hit the bounded fail-open deadline', async () => {
    const {identifier} = await c.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.requestAnimationFrame = () => 1;'});
    await navigate('/'); await waitFor(isReady,9000);
    assert.equal(await c.eval(`performance.getEntriesByName('xw:intro-ready').at(-1).detail`),'deadline');
    await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  });
  await check('failed entry script leaves a native bypass and automatically uncovers content', async () => {
    await c.send('Network.setBlockedURLs',{urls:['*static/js/main.js*']});
    await navigate('/');
    assert.equal(await c.eval(`document.querySelector('#xw-intro-bypass').getAttribute('href')`),'/home');
    await waitFor(`getComputedStyle(document.querySelector('#startup-animation')).visibility === 'hidden'`,9000);
    await click('#xw-intro-bypass'); await waitFor(`location.pathname === '/home'`);
    await navigate('/projects');
    assert.ok(await c.eval(`document.querySelectorAll('[data-project-documents] details').length`) > 10);
    await click('[data-project-documents] summary');
    assert.equal(await c.eval(`document.querySelector('[data-project-documents] details').open`),true);
    await c.send('Network.setBlockedURLs',{urls:[]});
  });
  await check('late entry script cannot replay after CSS has uncovered the document', async () => {
    held = [];
    await c.send('Fetch.enable',{patterns:[{urlPattern:'*static/js/main.js*',requestStage:'Request'}]});
    await c.send('Page.navigate',{url:base+'/'});
    await waitFor(`!!document.querySelector('#startup-animation') && getComputedStyle(document.querySelector('#startup-animation')).visibility === 'hidden'`,9500);
    for (const id of held) await c.send('Fetch.continueRequest',{requestId:id});
    await c.send('Fetch.disable');
    await waitFor(isReady,1500);
    assert.equal(await c.eval(`performance.getEntriesByName('xw:intro-ready').at(-1).detail`),'late-start');
  });
  // Quiet desktop mode isolates document interaction from optional camera travel.
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await check('selected-work detail link opens the right record; modal traps Tab and restores focus', async () => {
    await navigate('/home');
    await click('a[href="/projects#record=kyarafit"]');
    await waitFor(`document.querySelector('#project-terminal-overlay')?.classList.contains('is-open')`);
    assert.equal(await c.eval(`document.querySelector('#term-project-title').textContent`),'Kyarafit');
    await waitFor(`document.activeElement.id === 'close-terminal-btn'`);
    await press('Tab',{modifiers:8});
    assert.equal(await c.eval(`!!document.activeElement.closest('#project-terminal-overlay')`),true,'Shift+Tab must remain in modal');
    await press('Tab');
    assert.equal(await c.eval(`document.activeElement.id`),'close-terminal-btn');
    await press('Escape'); await sleep(250);
    assert.equal(await c.eval(`!!document.querySelector('.xw-window[data-app="projects"]')`),true,'Escape must retain Projects app');
    assert.equal(await c.eval(`document.querySelector('#project-terminal-overlay').classList.contains('hidden')`),true,'Escape must hide modal');
    assert.equal(await c.eval(`document.activeElement.classList.contains('project-card')`),true,'modal must restore card focus');
  });
  await check('project filters expose selection state and hide nonmatching cards', async () => {
    await navigate('/projects');
    await waitFor(`document.querySelector('[data-filter="all"]').hasAttribute('aria-pressed')`);
    await click('[data-filter="research"]');
    assert.equal(await c.eval(`document.querySelector('[data-filter="research"]').getAttribute('aria-pressed')`),'true');
    assert.equal(await c.eval(`Array.from(document.querySelectorAll('.project-card')).filter(e=>e.getClientRects().length).every(e=>e.dataset.type==='research')`),true);
    await click('[data-filter="all"]');
  });
  await check('Signal view returns modal focus to its visible graph node', async () => {
    await navigate('/projects');
    await waitFor(`document.querySelector('[data-view="signal"]').hasAttribute('aria-pressed')`);
    await click('[data-view="signal"]');
    await c.eval(`document.querySelector('.xw-sig-node').focus()`);
    await press('Enter');
    await waitFor(`document.activeElement.id === 'close-terminal-btn'`);
    await press('Escape'); await sleep(250);
    assert.equal(await c.eval(`document.activeElement.classList.contains('xw-sig-node')`),true);
  });
  await check('window close returns focus; reopening cached Dossier preserves build notes', async () => {
    await navigate('/projects');
    await click('[data-xw-win="close"]');
    assert.equal(await c.eval(`document.activeElement.dataset.xwDock`),'projects');
    await click('[data-xw-dock="dossier"]'); await waitFor(`!!document.querySelector('.xw-window[data-app="dossier"]')`);
    await click('.xw-bio summary');
    await click('[data-xw-win="close"]'); await click('[data-xw-dock="dossier"]');
    await waitFor(`!!document.querySelector('.xw-window[data-app="dossier"]')`);
    assert.equal(await c.eval(`document.querySelector('.xw-bio').open`),true);
  });
  await check('rapid navigation keeps the latest app, with a visible loading state', async () => {
    await navigate('/home');
    held=[]; await c.send('Fetch.enable',{patterns:[{urlPattern:base+'/projects',requestStage:'Request'}]});
    await click('.xw-hero-cta a[href="/contact"]'); await waitFor(`!!document.querySelector('.xw-window[data-app="contact"]')`);
    await click('[data-xw-dock="projects"]');
    await waitFor(`!document.querySelector('.xw-app-loading').hidden`);
    assert.equal(await c.eval(`!!document.querySelector('.xw-window[data-app="contact"]')`),true);
    await click('[data-xw-dock="resume"]'); await waitFor(`!!document.querySelector('.xw-window[data-app="resume"]')`);
    for(const id of held) await c.send('Fetch.continueRequest',{requestId:id});
    await c.send('Fetch.disable'); await sleep(300);
    assert.equal(await c.eval(`document.querySelector('.xw-window').dataset.app`),'resume');
  });
  await check('contact validation does not send a message', async () => {
    await navigate('/contact');
    await c.eval(`document.querySelector('#contact-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);
    assert.equal(await c.eval(`document.querySelector('#contact-form-status').dataset.state`),'error');
    assert.equal(requests.filter(url=>url===base+'/contact').length,1,'only the document GET is allowed');
  });
  await c.send('Emulation.setEmulatedMedia',{features:[]});
  await check('mobile intro arrives in the Dossier; touch scroll and Map tab work', async () => {
    await viewport(390,true); await navigate('/?from=qa'); await waitFor(isReady,8500);
    assert.equal(await c.eval(`location.search + location.hash`),'?from=qa#file');
    assert.equal(await c.eval(`!!document.querySelector('.xw-map-back')`),false,'dock Map tab replaces the overlapping floating shortcut');
    assert.equal(await c.eval(`getComputedStyle(document.querySelector('#main-content')).display !== 'none'`),true);
    await c.send('Input.synthesizeScrollGesture',{x:195,y:600,yDistance:-450,gestureSourceType:'touch'});
    await waitFor('scrollY > 0');
    await click('.xw-dock-item--mob');
    assert.equal(await c.eval(`document.body.classList.contains('xw-map-view')`),true);
    await click('[data-xw-dock="dossier"]');
    await waitFor(`!document.body.classList.contains('xw-map-view')`);
    await navigate('/projects'); await click('.xw-dock-item--mob');
    await waitFor(`location.pathname === '/home' && document.body.classList.contains('xw-map-view')`);
    await navigate('/#projects');
    assert.equal(await c.eval('location.hash'),'#projects');
    assert.equal(await c.eval(`document.body.classList.contains('xw-map-view')`),false);
  });
  await check('responsive documents fit at 320, 390, 768 and desktop widths; screenshots exist', async () => {
    for(const width of [320,390,768,1440]) {
      await viewport(width,width<900);
      for(const route of ['/home#file','/projects','/contact','/resume','/arcade']) {
        await navigate(route); await sleep(350);
        assert.equal(await c.eval('document.documentElement.scrollWidth <= innerWidth'),true,`${width} ${route} root overflow`);
        const bad = await c.eval(`Array.from(document.querySelectorAll('#main-content h1,#main-content h2,#main-content h3,#main-content .xw-cta,.xw-dock-item')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0 && (r.left < -1 || r.right > innerWidth+1)}).map(e=>e.textContent.trim())`);
        assert.deepEqual(bad,[],`${width} ${route} clipped heading/control`);
        if(route==='/projects' && width<900) {
          assert.equal(await c.eval(`Array.from(document.querySelectorAll('.xw-proj-grid--featured .project-card')).every(e=>e.getBoundingClientRect().width >= e.closest('.xw-proj-grid').getBoundingClientRect().width*.95)`),true,'featured cards must use the full mobile column');
          if(width<760) {
            await c.eval(`{const select=document.querySelector('[data-project-filter]');select.value='research';select.dispatchEvent(new Event('change',{bubbles:true}));}`);
            assert.equal(await c.eval(`Array.from(document.querySelectorAll('.project-card')).filter(e=>e.getClientRects().length).every(e=>e.dataset.type==='research')`),true);
            await c.eval(`{const select=document.querySelector('[data-project-filter]');select.value='all';select.dispatchEvent(new Event('change',{bubbles:true}));}`);
          }
        }
        if(width===390 || width===1440) await c.screenshot(`${evidence}/after-${width<900?'mobile':'desktop'}-${route.split('#')[0].slice(1)}.png`);
      }
    }
  });
  await check('normal browser paths have no uncaught exceptions or failed HTTP responses', async () => {
    assert.deepEqual(exceptions,[]);
    assert.deepEqual(consoleProblems,[]);
    assert.deepEqual(responses.filter(r=>r.status>=400),[]);
  });
} finally { await c.close(); }
await writeFile(`${evidence}/browser-checks.json`,JSON.stringify({results,exceptions,consoleProblems,failedResponses:responses.filter(r=>r.status>=400)},null,2)+'\n');
if(failures.length) { console.error(`${failures.length} failed: ${failures.join(', ')}`); process.exitCode=1; }
