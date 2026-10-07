/** Headless rendering QA. Requires: npm install --no-save playwright */
const {chromium} = require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'qa-artifacts');
fs.mkdirSync(out,{recursive:true});
const port=8734;
let server, browser, directorPage;
const errors=[];
const nap=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return;}catch{}await nap(250);}throw Error('Local HTTP server did not start');}
function observe(page,name){page.on('pageerror',e=>errors.push(`${name} PAGEERROR: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`${name} CONSOLE: ${m.text()}`);});}
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});}
async function run(){
 server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 await waitForServer();
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1});
 const dm=await context.newPage();directorPage=dm;observe(dm,'director');
 await dm.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
 await dm.locator('#loadingOverlay').waitFor({state:'hidden',timeout:45000});
 assert.ok(await dm.locator('#viewport canvas').count(),'WebGL canvas missing');
 assert.ok(await dm.locator('#viewport canvas').evaluate(c=>!!c.getContext('webgl2')||!!c.getContext('webgl')),'WebGL context unavailable');
 await nap(1500);await shot(dm,'01-director-orbit');
 // v0.8 immersion acceptance: capture the warehouse rupture in its own orbit
 // composition, then verify Explore sightlines in both connected levels.
 await dm.locator('#viewWarehouse').click();await nap(900);await shot(dm,'01b-warehouse-rupture-orbit');
 await dm.locator('#walkMode').click();await nap(900);
 assert.equal(await dm.locator('#walkMode').getAttribute('aria-pressed'),'true','Explore mode not selected');
 await shot(dm,'01c-warehouse-first-person');
 await dm.locator('#orbitMode').click();await dm.locator('#viewArea1').click();await nap(650);
 await dm.locator('#walkMode').click();await nap(900);await shot(dm,'02-director-first-person');
 await dm.locator('#orbitMode').click();await nap(500);
 const tv=await context.newPage();observe(tv,'tv');
 await tv.goto(`http://127.0.0.1:${port}/tv.html`,{waitUntil:'domcontentloaded'});
 await tv.locator('#status').waitFor({state:'hidden',timeout:90000});await nap(1000);await shot(tv,'03-tv-live');
 const indices=[['trials','04-trials-3d'],['traps','05-traps-3d'],['death','06-death-3d'],['goblin','09-goblin-3d'],['stomp','10-stomp-3d'],['tentacle','11-tentacle-3d'],['dragon','12-dragon-3d'],['shrine','13-shrine-3d']];
 for(const [id,name] of indices){
  await dm.locator('#episodeScene').selectOption({label:{trials:'Area 2 · Trials',traps:'Area 3 · Traps',death:'Area 5 · Death',goblin:'Area 6 · Goblin',stomp:'Area 7 · Stomp',tentacle:'Area 8 · Tentacle',dragon:'Area 9 · Dragon',shrine:'Area 10 · Shrine of Destruction'}[id]});
  await dm.locator('#episodeShow').click();
  // Two moments of the Trials camera cue: establishing and settled reveal.
  if(id==='trials'){await nap(850);await shot(tv,'04-trials-establishing');await nap(5000);}
  else await nap(2700);
  assert.equal(await tv.locator('#cinemaPresentation').evaluate(el=>getComputedStyle(el).display),'none',`${id} did not request 3D`);
  assert.ok(await tv.locator('#screen canvas').count(),`${id} canvas missing`);
  await shot(tv,name);
 }
 await dm.locator('#episodeScene').selectOption({label:'Area 2 · Trials'});
 await dm.locator('#episodeMap').click();await nap(700);await shot(tv,'07-tv-map');
 assert.equal(await tv.locator('#cinemaPresentation img').count(),1,'2D map not displayed');
 await dm.locator('#episodeBlackout').click();await nap(500);await shot(tv,'08-tv-blackout');
 assert.ok(await tv.locator('#cinemaPresentation').evaluate(el=>el.classList.contains('blackout')),'Blackout did not work');
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({webgl:'passed',orbit:'passed',explore:'passed',tv:'passed',scenes:indices.map(x=>x[0]),errors},null,2));
 if(errors.length)throw Error(errors.join('\n').slice(0,4000));
 console.log('PASS: WebGL + orbit + first-person + TV + 3D scenes + map + blackout');
}
run().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack||e)+'\n'+errors.join('\n'));process.exitCode=1;}).finally(async()=>{if(directorPage&&process.exitCode){await directorPage.screenshot({path:path.join(out,'failure-director.png')}).catch(()=>{});}if(browser)await browser.close();if(server)server.kill();});