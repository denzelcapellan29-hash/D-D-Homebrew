import {episodeScenes} from './episode1.js';
import {createAnalysis,autoDetect,paintMask,clamp,unpackSavedAnalysis} from './analysis.js';
import {TabletopWorld} from './world.js';

const $=id=>document.getElementById(id);
let image=null,analysis=null,world=null,mapName='The Rat Fissure',sourceName='area-1-rats.png';
let connectionOptions={enabled:true,depthFeet:60};
let miniatureSignature='',selectedSignature='';
let editing='floor',painting=false,tool='none',lastToast=0;
const cinema=new BroadcastChannel('mapforge-cinema-v1');
let cinemaOpen=false;
let selectedEpisodeScene=0;
let presentationScene={type:'live'};
let revealManifest={};
async function loadRevealManifest(){
 try{
  const r=await fetch('./assets/cinema/manifest.json',{cache:'no-store'});
  if(!r.ok)return;
  const data=await r.json();
  revealManifest=data?.scenes||{};
 }catch{}
}
function sendPresentation(){if(cinemaOpen)cinema.postMessage({type:'presentation',scene:presentationScene});}
function showEpisodeScene(idx){
 selectedEpisodeScene=Math.max(0,Math.min(episodeScenes.length-1,idx));
 const scene=episodeScenes[selectedEpisodeScene];$('episodeScene').value=String(selectedEpisodeScene);
 $('episodeNote').textContent=scene.note;
 presentationScene={type:scene.type,name:scene.name,src:scene.src,room:scene.id,caption:scene.caption};
 sendPresentation();$('episodeStatus').textContent=scene.type==='live'?'TV is showing live 3D.':`TV: ${scene.name}${scene.type==='room3d'?' (cinematic 3D)':''}`;
}
function prepareEpisodeScenes(){
 const select=$('episodeScene');
 for(const [i,scene] of episodeScenes.entries()){const option=document.createElement('option');option.value=String(i);option.textContent=scene.name;select.append(option);}
 select.value='0';$('episodeNote').textContent=episodeScenes[0].note;
 select.addEventListener('change',()=>{$('episodeNote').textContent=episodeScenes[Number(select.value)].note;});
 $('episodeShow').addEventListener('click',()=>showEpisodeScene(Number(select.value)));
 $('episodeReveal').addEventListener('click',()=>{
  const idx=Number(select.value),scene=episodeScenes[idx];
  const hero=revealManifest?.[scene.id]?.hero||scene.hero;
  if(!hero){notify('No cinematic reveal art is installed for this scene yet. Showing the live scene instead.');showEpisodeScene(idx);return;}
  presentationScene={type:'image',name:scene.name,src:hero};
  sendPresentation();$('episodeStatus').textContent='TV: cinematic reveal for '+scene.name;
 });
 $('episodeMap').addEventListener('click',()=>{const idx=Number(select.value),scene=episodeScenes[idx];if(!scene.src){notify('No original map is available for this scene.');return;}presentationScene={type:'image',name:scene.name,src:scene.src};sendPresentation();$('episodeStatus').textContent='TV: original battlemap for '+scene.name;});
 $('episodePrev').addEventListener('click',()=>showEpisodeScene(Number(select.value)-1));
 $('episodeNext').addEventListener('click',()=>showEpisodeScene(Number(select.value)+1));
 $('episodeBlackout').addEventListener('click',()=>{presentationScene={type:'blackout'};sendPresentation();$('episodeStatus').textContent='TV blacked out.';});
 $('episodeLive').addEventListener('click',()=>{presentationScene={type:'live'};sendPresentation();$('episodeStatus').textContent='TV is showing live 3D.';});
 document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(e.key==='ArrowRight'){e.preventDefault();showEpisodeScene(Number($('episodeScene').value)+1);}
  if(e.key==='ArrowLeft'){e.preventDefault();showEpisodeScene(Number($('episodeScene').value)-1);}
  if(e.code==='Space'){e.preventDefault();showEpisodeScene(Number($('episodeScene').value));}
  if(e.key.toLowerCase()==='b')$('episodeBlackout').click();
  if(e.key.toLowerCase()==='l')$('episodeLive').click();
 });
}

function sendScene(){
  if(!cinemaOpen||!world||!image||!analysis)return;
  try{cinema.postMessage({type:'scene',data:{...projectData(),gridEnabled:world.gridOn}});}catch(err){console.error('TV scene sync:',err);}
}
function sendFrame(){
  if(!cinemaOpen||!world||!analysis)return;
  cinema.postMessage({type:'frame',state:{position:world.camera.position.toArray(),quaternion:world.camera.quaternion.toArray(),fov:world.camera.fov,
    cutaway:world.cutaway,grid:world.gridOn,lighting:world.settings.lighting,
    tokens:world.getTokens().map(t=>{const token=world.tokens.find(x=>x.id===t.id);return {...t,y:token?.group.position.y||0};})}});
}
cinema.onmessage=e=>{if(e.data?.type==='ready'){cinemaOpen=true;sendScene();setTimeout(sendPresentation,500);}};


function notify(message){
  const box=$('toast');box.textContent=message;box.classList.add('show');
  window.clearTimeout(lastToast);lastToast=window.setTimeout(()=>box.classList.remove('show'),4200);
}
function showLoading(message){$('loadingText').textContent=message;$('loadingOverlay').hidden=false;}
function hideLoading(){$('loadingOverlay').hidden=true;}
function updateReadouts(){
  $('sensitivityVal').textContent=$('sensitivity').value+'%';
  $('wallHeightVal').textContent=$('wallHeight').value+' ft';
  $('brushVal').textContent=$('brush').value;
  $('shaftDepthVal').textContent=$('shaftDepth').value+' ft';
}
function currentOptions(){return {mode:$('preset').value,sensitivity:Number($('sensitivity').value),gridPixels:Number($('gridPixels').value)};}
function readableStem(name){
  const x=name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();
  return x.length ? x.slice(0,80).replace(/\b\w/g,c=>c.toUpperCase()):'Untitled Battlemap';
}
function refreshMetrics(){
  if(!image||!analysis)return;
  const x=(image.naturalWidth/analysis.gridPixels).toFixed(1);
  const z=(image.naturalHeight/analysis.gridPixels).toFixed(1);
  const walk=analysis.mask.reduce((sum,n)=>sum+n,0)/analysis.mask.length;
  $('sceneName').textContent=mapName;
  $('mapTitle').textContent=mapName.toUpperCase().slice(0,36);
  $('sceneMetrics').textContent=`${x} × ${z} squares · 5 ft each · ${Math.round(walk*100)}% walkable`;
  $('filename').textContent=sourceName;
}
function analyzeAndBuild(preserve=false){
  if(!image||!world)return;
  const {mode,sensitivity,gridPixels}=currentOptions();
  const safeGrid=clamp(Number.isFinite(gridPixels)?gridPixels:58,10,300);
  $('gridPixels').value=String(safeGrid);
  const prior=preserve?world.getTokens():[];
  analysis=createAnalysis(image,mode,sensitivity,safeGrid);
  rebuild(prior);
}
function rebuild(tokens){
  if(!world||!image||!analysis)return;
  if(world.tokenTransit){notify('Wait for the miniature to finish using the rope.');return;}
  showLoading('Raising the terrain…');
  try{
    world.build(image,analysis,Number($('wallHeight').value),tokens??world.getTokens(),connectionOptions);
    $('connectionPanel').hidden=!connectionOptions.enabled;
    world.setGrid($('gridToggle').classList.contains('active'));
    renderMaskEditor();refreshMetrics();
    // Let the canvas present its first frame before dismissing the overlay.
    requestAnimationFrame(()=>setTimeout(hideLoading,65));
    setTimeout(sendScene,120);
  }catch(e){console.error(e);hideLoading();notify('Generation failed: '+e.message);}
}
function renderMaskEditor(){
  if(!image||!analysis)return;
  const canvas=$('maskEditor');
  const ratio=image.naturalWidth/image.naturalHeight;
  const h=400,w=Math.max(80,Math.round(h*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
  const maskCanvas=document.createElement('canvas');maskCanvas.width=analysis.width;maskCanvas.height=analysis.height;
  const mc=maskCanvas.getContext('2d');const id=mc.createImageData(analysis.width,analysis.height);
  for(let i=0;i<analysis.mask.length;i++){
    const floor=analysis.mask[i]===1;
    id.data[i*4]=floor?63:104;id.data[i*4+1]=floor?164:64;
    id.data[i*4+2]=floor?128:40;id.data[i*4+3]=floor?78:140;
  }
  mc.putImageData(id,0,0);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(maskCanvas,0,0,w,h);ctx.imageSmoothingEnabled=true;
  const px=Number($('gridPixels').value);
  ctx.strokeStyle='rgba(235,223,192,.23)';ctx.lineWidth=.5;
  for(let x=0;x<image.naturalWidth/px;x++){const X=x*px/image.naturalWidth*w;ctx.beginPath();ctx.moveTo(X,0);ctx.lineTo(X,h);ctx.stroke();}
  for(let y=0;y<image.naturalHeight/px;y++){const Y=y*px/image.naturalHeight*h;ctx.beginPath();ctx.moveTo(0,Y);ctx.lineTo(w,Y);ctx.stroke();}
}
function setEditing(v){
  editing=v;for(const [key,id] of [['floor','paintFloor'],['rock','paintRock'],['inspect','paintPan']]){
    const selected=key===v;$(id).classList.toggle('selected',selected);$(id).setAttribute('aria-pressed',String(selected));
  }
  $('maskEditor').style.cursor=v==='inspect'?'crosshair':'crosshair';
}
function paintAt(e){
  if(!analysis||editing==='inspect')return;
  const rect=$('maskEditor').getBoundingClientRect();
  const u=(e.clientX-rect.left)/rect.width,v=(e.clientY-rect.top)/rect.height;
  if(u<0||v<0||u>1||v>1)return;
  paintMask(analysis,u,v,Number($('brush').value),editing==='floor'?1:0);
  renderMaskEditor();refreshMetrics();
}
function setTool(v){
  tool=v;world.placing=v;
  for(const [name,id] of [['none','tokenNone'],['hero','tokenHero'],['enemy','tokenEnemy']]){
    $(''+id).classList.toggle('selected',v===name);
  }
  if(v!=='none'&&world.walkMode){setCameraMode(false);notify('Click any walkable tile to place your miniature.');}
}
function setCameraMode(walk){
  world.switchMode(walk);
  $('orbitMode').classList.toggle('active',!walk);$('walkMode').classList.toggle('active',walk);
  $('orbitMode').setAttribute('aria-pressed',String(!walk));$('walkMode').setAttribute('aria-pressed',String(walk));
  $('walkControls').hidden=!walk;
  $('camHint').textContent=walk?'WASD to move · Drag to look · E to use rope':'Drag to orbit · Scroll to zoom · Click a miniature to select';
  if(walk)setTool('none');
}
async function decodeImage(src){
  const img=new Image();img.src=src;await img.decode();
  if(!img.naturalWidth||!img.naturalHeight)throw Error('Invalid image.');
  if(img.naturalWidth*img.naturalHeight>48_000_000)throw Error('Please use an image smaller than 48 megapixels.');
  return img;
}
async function loadMap(src,filename,isDemo=false){
  showLoading('Reading battlemap…');
  try{
    image=await decodeImage(src);sourceName=filename;
    connectionOptions={enabled:isDemo,depthFeet:Number($('shaftDepth').value)||60};
    mapName=isDemo?'Warehouse → Area 1':readableStem(filename);
    if(!isDemo){$('preset').value='cave';}
    analyzeAndBuild(false);
    notify(`Loaded ${filename}. You can refine the green walkable area in the editor.`);
  }catch(e){hideLoading();notify('Cannot load this image: '+e.message);}
}
async function loadFile(file){
  if(!file)return;if(!file.type.startsWith('image/')){notify('Please select a PNG, JPG or WEBP battlemap.');return;}
  if(file.size>35*1024*1024){notify('Image too large: limit is 35 MB.');return;}
  const url=URL.createObjectURL(file);
  try{await loadMap(url,file.name);}finally{URL.revokeObjectURL(url);}
}
function saveBlob(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function getImageBase64(){
  const can=document.createElement('canvas');can.width=image.naturalWidth;can.height=image.naturalHeight;
  can.getContext('2d').drawImage(image,0,0);return can.toDataURL('image/png');
}
function projectData(){
  return {app:'MapForge 3D',version:3,settings:{...world.settings},selectedTokenId:world.selectedTokenId,view:{level:world.activeLevel,mode:world.walkMode?'walk':'orbit',cutaway:world.cutaway},analysisMode:analysis.mode,connection:connectionOptions,title:mapName,sourceName,image:getImageBase64(),
    gridPixels:analysis.gridPixels,wallFeet:Number($('wallHeight').value),
    sensitivity:Number($('sensitivity').value),maskWidth:analysis.width,maskHeight:analysis.height,
    mask:Array.from(analysis.mask).join(''),tokens:world.getTokens(),created:new Date().toISOString()};
}
async function loadProject(file){
  if(!file)return;
  showLoading('Loading saved project…');
  try{
    const data=JSON.parse(await file.text());
    if(data.app!=='MapForge 3D'||!data.image||!data.mask)throw Error('Not a compatible MapForge project.');
    image=await decodeImage(data.image);sourceName=data.sourceName||'Saved battlemap';mapName=data.title||'Restored Scene';
    connectionOptions={enabled:!!data.connection?.enabled,depthFeet:clamp(Number(data.connection?.depthFeet)||60,20,150)};
    $('shaftDepth').value=String(connectionOptions.depthFeet);
    $('preset').value=data.analysisMode||'cave';$('gridPixels').value=String(clamp(Number(data.gridPixels)||58,10,300));
    $('wallHeight').value=String(clamp(Number(data.wallFeet)||10,5,25));
    $('sensitivity').value=String(clamp(Number(data.sensitivity)||46,20,85));
    updateReadouts();analysis=unpackSavedAnalysis(image,data);analysis.mode=data.analysisMode||'cave';
    rebuild(Array.isArray(data.tokens)?data.tokens:[]);
    world.setLighting(data.settings?.lighting||'tabletop');world.setLantern(data.settings?.lantern!==false);
    $('lightingMode').value=world.settings.lighting;$('lanternToggle').checked=world.settings.lantern;
    world.focusLevel(data.view?.level==='warehouse'&&connectionOptions.enabled?'warehouse':'area1');
    setCameraMode(data.view?.mode==='walk');
    world.setCutaway(typeof data.view?.cutaway==='boolean'?data.view.cutaway:world.activeLevel==='area1');
    world.selectToken(data.selectedTokenId);syncConnectionUI();notify('Project restored with edited mask and tokens.');
  }catch(e){hideLoading();notify('Could not open project: '+e.message);}
}

function setupEvents(){
  $('openTV').addEventListener('click',()=>{
    cinemaOpen=true;
    const win=window.open('./tv.html','mapforge-tv','popup=yes,width=1280,height=720');
    if(!win){notify('Allow popups for this local page, then try Open TV View again.');return;}
    notify('Drag the TV window onto your television; click Fullscreen in that window.');
    setTimeout(()=>{sendScene();sendPresentation();},1100);
  });

  $('lightingMode').addEventListener('change',e=>{world.setLighting(e.target.value);document.body.dataset.lighting=world.settings.lighting;});
  $('lanternToggle').addEventListener('change',e=>world.setLantern(e.target.checked));
  $('addLandingHero').addEventListener('click',()=>{setCameraMode(false);const p=world.activeLevel==='warehouse'?world.upperSpawn():world.connection?.landing||world.spawn;world.addToken('hero',p.x,p.z);syncConnectionUI();});
  $('miniatureSelect').addEventListener('change',e=>{world.selectToken(Number(e.target.value));syncConnectionUI();});
  $('renameMiniature').addEventListener('click',()=>{world.renameSelectedToken($('miniatureName').value);syncConnectionUI();});
  $('miniatureName').addEventListener('keydown',e=>{if(e.key==='Enter')$('renameMiniature').click();});
  $('focusMiniature').addEventListener('click',()=>{setCameraMode(false);world.focusSelectedToken();syncConnectionUI();});
  $('transferMiniature').addEventListener('click',()=>{setCameraMode(false);world.transferSelectedToken();syncConnectionUI();});
  $('removeMiniature').addEventListener('click',()=>{world.removeSelectedToken();syncConnectionUI();});
  $('shaftDepth').addEventListener('change',()=>{if(world.tokenTransit){$('shaftDepth').value=String(connectionOptions.depthFeet);updateReadouts();notify('Wait for the miniature to reach the other floor.');return;}connectionOptions.depthFeet=Number($('shaftDepth').value);rebuild();});
  $('viewWarehouse').addEventListener('click',()=>world.focusLevel('warehouse'));
  $('viewArea1').addEventListener('click',()=>world.focusLevel('area1'));
  $('viewConnection').addEventListener('click',()=>{setCameraMode(false);world.overview();});
  $('useRope').addEventListener('click',()=>world.useRope());
  $('cutawayToggle').addEventListener('change',e=>world.setCutaway(e.target.checked));
  ['sensitivity','wallHeight','brush','shaftDepth'].forEach(id=>$(id).addEventListener('input',updateReadouts));
  $('generate').addEventListener('click',()=>{analyzeAndBuild(false);notify('Terrain generated. Fix mistaken areas with the mask brush.');});
  $('applyMask').addEventListener('click',()=>{rebuild();notify('Edited mask applied to the 3D environment.');});
  $('redetect').addEventListener('click',()=>{
    const opt=currentOptions();if(opt.mode==='curated')analysis=createAnalysis(image,'curated',opt.sensitivity,opt.gridPixels);
    else analysis=createAnalysis(image,opt.mode,opt.sensitivity,opt.gridPixels);
    rebuild();notify('Walkable area detected again.');
  });
  $('paintFloor').addEventListener('click',()=>setEditing('floor'));
  $('paintRock').addEventListener('click',()=>setEditing('rock'));
  $('paintPan').addEventListener('click',()=>setEditing('inspect'));
  const canvas=$('maskEditor');
  canvas.addEventListener('pointerdown',e=>{if(editing==='inspect')return;painting=true;canvas.setPointerCapture(e.pointerId);paintAt(e);});
  canvas.addEventListener('pointermove',e=>{if(painting)paintAt(e);});
  canvas.addEventListener('pointerup',()=>{painting=false;});
  canvas.addEventListener('pointercancel',()=>{painting=false;});
  $('mapFile').addEventListener('change',e=>{loadFile(e.target.files?.[0]);e.target.value='';});
  const uploader=$('uploadArea');
  uploader.addEventListener('dragover',e=>{e.preventDefault();uploader.classList.add('dragover');});
  uploader.addEventListener('dragleave',()=>uploader.classList.remove('dragover'));
  uploader.addEventListener('drop',e=>{e.preventDefault();uploader.classList.remove('dragover');loadFile(e.dataTransfer.files?.[0]);});
  $('loadDemo').addEventListener('click',()=>{$('preset').value='curated';loadMap('./assets/area-1-rats.png','area-1-rats.png',true);});
  $('orbitMode').addEventListener('click',()=>setCameraMode(false));
  $('walkMode').addEventListener('click',()=>setCameraMode(true));
  $('recenter').addEventListener('click',()=>world.recenter());
  $('gridToggle').addEventListener('click',()=>{
    const selected=!$('gridToggle').classList.contains('active');
    $('gridToggle').classList.toggle('active',selected);
    $('gridToggle').setAttribute('aria-pressed',String(selected));world.setGrid(selected);
  });
  $('tokenNone').addEventListener('click',()=>setTool('none'));
  $('tokenHero').addEventListener('click',()=>setTool('hero'));
  $('tokenEnemy').addEventListener('click',()=>setTool('enemy'));
  $('clearTokens').addEventListener('click',()=>world.clearTokens());
  $('rollD20').addEventListener('click',()=>{
    const value=Math.floor(Math.random()*20)+1;
    $('diceResult').textContent=String(value);
    $('diceLabel').textContent=value===20?'Natural twenty!':value===1?'Critical failure':'d20 rolled';
  });
  $('saveProject').addEventListener('click',()=>{
    if(world.climbing||world.tokenTransit){notify('Wait for the rope journey to finish before saving.');return;}
    try{saveBlob(new Blob([JSON.stringify(projectData())],{type:'application/json'}),'mapforge-world.json');notify('Saved full project: map, mask and miniatures.');}
    catch(e){notify('Save failed: '+e.message);}
  });
  $('openProject').addEventListener('click',()=>$('projectFile').click());
  $('projectFile').addEventListener('change',e=>{loadProject(e.target.files?.[0]);e.target.value='';});
  $('exportGlb').addEventListener('click',async()=>{
    if(world.climbing||world.tokenTransit){notify('Wait for the rope journey to finish before exporting.');return;}
    const btn=$('exportGlb');btn.disabled=true;btn.textContent='Exporting…';
    try{
      const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
      const exporter=new GLTFExporter();
      await world.whenTexturesReady;
      const hidden=world.cutaway;world.setCutaway(false);
      let output;try{output=await exporter.parseAsync(world.worldRoot,{binary:true,onlyVisible:true,maxTextureSize:2048});}finally{world.setCutaway(hidden);}
      saveBlob(new Blob([output],{type:'model/gltf-binary'}),'mapforge-terrain.glb');
      notify('GLB model exported. Open it in Blender or a compatible viewer.');
    }catch(e){console.error(e);notify('GLB export failed: '+e.message);}
    finally{btn.disabled=false;btn.textContent='Export model (.glb)';}
  });
  $('screenshot').addEventListener('click',()=>{
    try{const a=document.createElement('a');a.download='mapforge-scene.png';a.href=world.capture();document.body.appendChild(a);a.click();a.remove();}
    catch(e){notify('Screenshot failed: '+e.message);}
  });
  for(const b of document.querySelectorAll('[data-move]')){
    const direction=b.dataset.move;
    const stop=e=>{e.preventDefault();world.walkButtons.delete(direction);};
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);world.walkButtons.add(direction);});
    b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);
    b.addEventListener('lostpointercapture',stop);
  }
}

function syncConnectionUI(){
  if(!world)return;
  $('activeLevel').textContent=world.climbing?'On the rope':world.activeLevel==='warehouse'?'Warehouse · upper level':'Area 1 · cave level';
  $('useRope').textContent=world.activeLevel==='warehouse'?'↓ Descend rope to Area 1':'↑ Climb rope to warehouse';
  $('useRope').disabled=!world.walkMode||!!world.climbing||!!world.tokenTransit;
  $('cutawayToggle').checked=world.cutaway;
  $('viewWarehouse').setAttribute('aria-pressed',String(world.activeLevel==='warehouse'));
  $('viewArea1').setAttribute('aria-pressed',String(world.activeLevel==='area1'));
  syncMiniatureUI();
}

function syncMiniatureUI(){
  const selected=world.selectedToken;
  const signature=JSON.stringify(world.tokens.map(t=>[t.id,t.label,t.level]));
  if(signature!==miniatureSignature){
    miniatureSignature=signature;const list=$('miniatureSelect');list.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent='No miniature selected';list.append(empty);
    for(const t of world.tokens){const option=document.createElement('option');option.value=String(t.id);option.textContent=t.label+' · '+(t.level==='warehouse'?'Warehouse':'Area 1');list.append(option);}
  }
  $('miniatureSelect').value=selected?String(selected.id):'';
  const selectedKey=selected?selected.id+':'+selected.label:'';
  if(selectedKey!==selectedSignature){selectedSignature=selectedKey;$('miniatureName').value=selected?.label||'';}
  const busy=!!world.tokenTransit;
  for(const id of ['miniatureName','renameMiniature','focusMiniature','removeMiniature'])$(id).disabled=!selected||busy;
  const reason=world.ropeStatus();$('transferMiniature').disabled=!!reason||!!world.climbing;
  $('transferMiniature').textContent=selected?.level==='warehouse'?'↓ Descend rope':'↑ Climb rope';
  $('miniatureStatus').textContent=reason||(selected.label+' is ready to '+(selected.level==='warehouse'?'descend into Area 1.':'climb to the warehouse.'));
  $('miniatureSelect').disabled=busy;$('clearTokens').disabled=busy;$('addLandingHero').disabled=busy;
  $('shaftDepth').disabled=busy||!!world.climbing;
}

async function init(){
  try{
    world=new TabletopWorld($('viewport'),notify);
    await loadRevealManifest();
    setupEvents();prepareEpisodeScenes();updateReadouts();
    await loadMap('./assets/area-1-rats.png','area-1-rats.png',true);
    world.overview();
    world.renderer.domElement.addEventListener('pointerup',()=>syncConnectionUI());
    setInterval(syncConnectionUI,250);
    setInterval(sendFrame,90);
  }catch(e){console.error(e);showLoading('Renderer could not start: '+e.message);}
}
init();
