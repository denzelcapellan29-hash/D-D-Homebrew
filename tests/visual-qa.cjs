const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-artifacts'),port=8734;
fs.mkdirSync(out,{recursive:true});
let server,browser;const errors=[];const nap=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){for(let i=0;i<80;i++){try{const r=await fetch('http://127.0.0.1:'+port+'/');if(r.ok)return;}catch{}await nap(250);}throw Error('HTTP server failed to start');}
function observe(p,n){p.on('pageerror',e=>errors.push(n+' PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(n+' CONSOLE '+m.text());});}
async function shot(p,n){await p.screenshot({path:path.join(out,n+'.png')});}
async function run(){
 server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 await waitForServer();
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1});
 const dm=await ctx.newPage();observe(dm,'director');
 await dm.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'domcontentloaded'});
 await dm.locator('#loadingOverlay').waitFor({state:'hidden',timeout:45000});
 assert.ok(await dm.locator('#viewport canvas').count(),'WebGL canvas missing');
 assert.ok(await dm.locator('#viewport canvas').evaluate(c=>!!c.getContext('webgl2')||!!c.getContext('webgl')),'No WebGL context');
 await nap(1500);await shot(dm,'01-director-orbit');
 await dm.locator('#walkMode').click();await nap(900);
 assert.equal(await dm.locator('#walkMode').getAttribute('aria-pressed'),'true','Explore not selected');
 await shot(dm,'02-director-first-person');
 await dm.locator('#orbitMode').click();await nap(500);
 const tv=await ctx.newPage();observe(tv,'tv');
 await tv.goto('http://127.0.0.1:'+port+'/tv.html',{waitUntil:'domcontentloaded'});
 await nap(4500);await shot(tv,'03-tv-live');
 for(const [name,label,file] of [['trials','Area 2 · Trials','04-trials-3d'],['traps','Area 3 · Traps','05-traps-3d'],['death','Area 5 · Death','06-death-3d']]){
   await dm.locator('#episodeScene').selectOption({label});await dm.locator('#episodeShow').click();await nap(2700);
   assert.equal(await tv.locator('#cinemaPresentation').evaluate(el=>getComputedStyle(el).display),'none',name+' not 3D');
   assert.ok(await tv.locator('#screen canvas').count(),name+' canvas missing');await shot(tv,file);
 }
 await dm.locator('#episodeMap').click();await nap(700);await shot(tv,'07-tv-map');
 assert.equal(await tv.locator('#cinemaPresentation img').count(),1,'2D map missing');
 await dm.locator('#episodeBlackout').click();await nap(500);await shot(tv,'08-tv-blackout');
 assert.ok(await tv.locator('#cinemaPresentation').evaluate(el=>el.classList.contains('blackout')),'Blackout missing');
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({webgl:'passed',orbit:'passed',explore:'passed',tv:'passed',errors},null,2));
 if(errors.length)throw Error(errors.join('\n').slice(0,4000));
 console.log('PASS: WebGL + orbit + explore + TV + three scenes + map + blackout');
}
run().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack||e)+'\n'+errors.join('\n'));process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
