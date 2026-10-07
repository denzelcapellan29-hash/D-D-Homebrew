import {createCinematicRoom} from './cinematic-rooms.js';
import {TabletopWorld} from './world.js';
import {unpackSavedAnalysis} from './analysis.js';
const status=document.getElementById('status');
const presentation=document.getElementById('cinemaPresentation');
let presentationMode='live';
let stopRoom=null;
let pendingRoom=null;
function leaveRoom(){if(stopRoom){stopRoom();stopRoom=null;}}
function enterRoom(scene){
 pendingRoom=scene;
 if(!ready||!world)return;
 leaveRoom();
 try{stopRoom=createCinematicRoom(world,scene.room,scene.src);}catch(err){console.error('Cinematic room:',err);status.textContent='3D room unavailable. Choose Show original 2D map on the director.';status.hidden=false;}
}

function setPresentation(scene){
 presentation.replaceChildren();presentation.classList.remove('blackout');
 if(scene?.type!=='room3d')leaveRoom();
 if(scene?.type==='room3d'){presentationMode='room3d';presentation.style.display='none';status.hidden=true;enterRoom(scene);return;}
 pendingRoom=null;
 if(!scene||scene.type==='live'){presentationMode='live';presentation.style.display='none';return;}
 presentationMode=scene.type;presentation.style.display='block';status.hidden=true;
 if(scene.type==='blackout'){presentation.classList.add('blackout');return;}
 if(scene.type==='image'){const img=new Image();img.alt=scene.name||'Episode scene';img.src=scene.src;presentation.append(img);return;}
 const card=document.createElement('div');card.id='cinemaCard';const title=document.createElement('h1');title.textContent=scene.name||'';const caption=document.createElement('p');caption.textContent=scene.caption||'';card.append(title,caption);presentation.append(card);
}

const channel=new BroadcastChannel('mapforge-cinema-v1');
let world=null, loading=false,ready=false,latest=null,tokenSignature='';
function sendReady(){channel.postMessage({type:'ready'});}
async function openScene(data){
 if(loading)return;loading=true;ready=false;
 try{
  const image=new Image();image.src=data.image;await image.decode();
  const analysis=unpackSavedAnalysis(image,data);
  world.build(image,analysis,Number(data.wallFeet)||10,Array.isArray(data.tokens)?data.tokens:[],data.connection||{enabled:false});
  world.setLighting(data.settings?.lighting||'tabletop');world.setLantern(data.settings?.lantern!==false);
  world.setGrid(data.gridEnabled!==false);
  tokenSignature=JSON.stringify(data.tokens||[]);
  status.hidden=true;ready=true;
  if(pendingRoom)enterRoom(pendingRoom);
 }catch(err){status.textContent='Could not load TV scene: '+err.message;console.error(err);}
 finally{loading=false;if(latest){const state=latest;latest=null;sync(state);}}
}
function sync(state){
 if(!ready||!world){latest=state;return;}
 if(presentationMode==='room3d')return;
 world.camera.position.fromArray(state.position);
 world.camera.quaternion.fromArray(state.quaternion);
 world.camera.fov=state.fov;world.camera.updateProjectionMatrix();
 world.orbit.enabled=false;
 world.walkMode=false;
 if(world.cutaway!==state.cutaway)world.setCutaway(state.cutaway);
 if(world.gridOn!==state.grid)world.setGrid(state.grid);
 if(world.settings.lighting!==state.lighting)world.setLighting(state.lighting);
 const signature=JSON.stringify(state.tokens);
 if(signature!==tokenSignature){
  const current=new Map(world.tokens.map(t=>[t.id,t]));
  for(const token of state.tokens){
   let t=current.get(token.id);
   if(!t){t=world.addToken(token.kind,token.x,token.z,token.label,true,token.level,token.id);}
   if(t){t.group.position.x=token.x;t.group.position.z=token.z;t.group.position.y=token.y??(token.level==='warehouse'?world.connection?.depth||0:0);t.level=token.level;t.group.visible=!(world.cutaway&&t.level==='warehouse');}
   current.delete(token.id);
  }
  for(const t of current.values()){world.tokenRoot.remove(t.group);world.tokens=world.tokens.filter(x=>x!==t);}
  tokenSignature=signature;
 }
}
channel.onmessage=e=>{
 const m=e.data;
 if(m.type==='presentation')setPresentation(m.scene);
 if(m.type==='scene')openScene(m.data);
 if(m.type==='frame')sync(m.state);
};
try{world=new TabletopWorld(document.getElementById('screen'),()=>{});world.orbit.enabled=false;sendReady();setInterval(()=>{if(!ready&&!loading)sendReady();},1500);}catch(err){status.textContent='3D renderer unavailable: '+err.message;}
document.getElementById('fullscreen').addEventListener('click',()=>document.documentElement.requestFullscreen?.());
