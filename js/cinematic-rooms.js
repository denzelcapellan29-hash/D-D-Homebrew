// TV-only, procedural 3D dioramas. Source battlemaps remain available as a 2D fallback.
import * as THREE from 'three';

const V=THREE.Vector3;
const mat=(color,roughness=0.88,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
const STONE=mat(0x625e53), DARK=mat(0x302f2b), WALL=mat(0x47423b), METAL=mat(0x8c7460,.56,{metalness:.48});
const WEB=new THREE.LineBasicMaterial({color:0xc8c5ba,transparent:true,opacity:.43,depthWrite:false});
const rand=(n)=>{const s=Math.sin(n*127.1+29.3)*43758.5453;return s-Math.floor(s);};
function mesh(group,geom,material,x=0,y=0,z=0){const o=new THREE.Mesh(geom,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
function box(g,w,h,d,x,y,z,m=STONE){return mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);}
function cylinder(g,r1,r2,h,x,y,z,m=STONE,sides=18){return mesh(g,new THREE.CylinderGeometry(r1,r2,h,sides),m,x,y,z);}
function sphere(g,r,x,y,z,m=STONE){return mesh(g,new THREE.IcosahedronGeometry(r,1),m,x,y,z);}
function line(g,a,b,m=WEB){const geometry=new THREE.BufferGeometry().setFromPoints([new V(...a),new V(...b)]);const o=new THREE.Line(geometry,m);g.add(o);return o;}
function torus(g,r,t,x,y,z,m=METAL){const o=mesh(g,new THREE.TorusGeometry(r,t,8,48),m,x,y,z);o.rotation.x=-Math.PI/2;return o;}
function light(g,x,y,z,color,power=18,radius=12){const l=new THREE.PointLight(color,power,radius,2);l.position.set(x,y,z);g.add(l);return l;}
function edgeWalls(g,w,d,height=2.4){
 const t=.57;box(g,w,height,t,0,height/2,-d/2,WALL);box(g,w,height,t,0,height/2,d/2,WALL);
 box(g,t,height,d,-w/2,height/2,0,WALL);box(g,t,height,d,w/2,height/2,0,WALL);
 for(let k=0;k<35;k++){
  const n=k+8,side=k%4,xx=(rand(n)*.91-.455)*w,zz=(rand(n+99)*.91-.455)*d;
  sphere(g,.16+rand(n+20)*.34,side<2?xx:(side===2?-w/2+.35:w/2-.35),.17,side<2?(side===0?-d/2+.2:d/2-.2):zz,mat(0x57534c));
 }
}
function rockChamber(g,w,d){
 const ground=box(g,w,.3,d,0,-.16,0,mat(0x4b4841));ground.receiveShadow=true;
 const boulderMat=[mat(0x373a38),mat(0x4a4740),mat(0x635d51),mat(0x272b2c)];
 for(let i=0;i<130;i++){
  const theta=i/130*Math.PI*2,rr=1+(rand(i+34)-.5)*.5;
  const x=Math.cos(theta)*w*.49*rr,z=Math.sin(theta)*d*.48*rr;
  const rock=sphere(g,.35+rand(i+4)*.9,x,.12+rand(i+15)*.7,z,boulderMat[i%4]);
  rock.scale.set(1+rand(i+17),.7+rand(i+43)*2,.7+rand(i+67));
 }
 for(let i=0;i<24;i++){
  const x=(rand(i+113)-.5)*w*.84,z=(rand(i+174)-.5)*d*.83;
  const r=.08+rand(i+75)*.27;sphere(g,r,x,r*.48,z,boulderMat[i%4]);
 }
}
function mapBase(g,tex,w,d){
 const texture=new THREE.TextureLoader().load(tex);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const plane=mesh(g,new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:texture,roughness:1,polygonOffset:true,polygonOffsetFactor:-1}),0,.012,0);
 plane.rotation.x=-Math.PI/2;plane.castShadow=false;return plane;
}
function makeTrials(g,base){
 const w=23,d=13.6;
 box(g,w,.3,d,0,-.19,0,mat(0x716d60));mapBase(g,base,w,d);edgeWalls(g,w,d,1.85);
 const pools=[[-6.3,-3.0,0x167edb],[6.3,-3.0,0x16ae70],[-6.3,2.7,0xe4edff],[6.3,2.7,0xb7a3ff]];
 const pulse=[];
 for(const [x,z,color] of pools){
  cylinder(g,1.9,1.95,.15,x,.12,z,METAL,56);
  cylinder(g,1.67,1.67,.08,x,.22,z,mat(color,.14,{metalness:.15,emissive:color,emissiveIntensity:.75,transparent:true,opacity:.85}),56);
  torus(g,1.79,.15,x,.25,z,mat(0xb0a38a,.43,{metalness:.48}));
  for(let a=0;a<4;a++)box(g,.32,.19,.4,x+Math.sin(a*Math.PI/2)*1.94,.24,z+Math.cos(a*Math.PI/2)*1.94,STONE);
  pulse.push(light(g,x,1.15,z,color,10,7));
 }
 for(const x of [-1.95,1.95])for(const z of [-2.4,.1,2.65]){
  cylinder(g,.39,.5,1.5,x,.75,z,DARK,12);
  cylinder(g,.53,.48,.19,x,1.55,z,METAL,12);
 }
 // Two sealed doors on the east wall.
 for(const z of [-.65,1.1])box(g,.13,1.55,.82,w/2-.3,.81,z,mat(0xbbb2a0));
 for(const x of [-9.2,9.2])light(g,x,2.2,-5.6,0xffb763,9,7);
 return {camera:new V(-1.3,11.8,16.9),target:new V(0,0,0),pulse,w,d};
}
function makeTraps(g,base){
 const w=26,d=9.6;
 box(g,w,.3,d,0,-.15,0,mat(0x777269));mapBase(g,base,w,d);
 box(g,w,.62,.42,0,.31,-d/2,WALL);box(g,w,.62,.42,0,.31,d/2,WALL);
 for(let i=0;i<28;i++)box(g,.6,.47,.65,-12.5+i*.92,.24,-d/2+.25,i%4?STONE:DARK);
 for(let i=0;i<28;i++)box(g,.6,.47,.65,-12.5+i*.92,.24,d/2-.25,i%3?STONE:DARK);
 const plate=mat(0x986f58,.52,{metalness:.65});
 const xs=[-5.1,-1.4,2.1,5.6],zs=[0,.0,0,0];
 for(let i=0;i<4;i++){
  const x=xs[i],wide=(i===1?1.65:1.85),long=(i===0||i===3?7.35:i===1?1.9:4.1);
  const obj=box(g,wide,.095,long,x,.105,zs[i],plate);obj.castShadow=false;
  for(const a of [-1,1])for(const b of [-1,1])sphere(g,.075,x+a*(wide/2-.12),.19,b*(long/2-.12),METAL);
  // Raised letters, visibly associated with their trap plates.
  const glyph=document.createElement('canvas');glyph.width=128;glyph.height=128;
  const c=glyph.getContext('2d');c.clearRect(0,0,128,128);c.fillStyle='#f0e8cf';c.font='bold 90px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('ABCD'[i],64,67);
  const text=new THREE.CanvasTexture(glyph);const p=mesh(g,new THREE.PlaneGeometry(.72,.72),new THREE.MeshBasicMaterial({map:text,transparent:true,depthWrite:false,side:THREE.DoubleSide}),x,.168,0);p.rotation.x=-Math.PI/2;
 }
 // Doorway and an unlit set of stairs at the far end.
 box(g,.53,2.5,.4,10.1,1.25,-2.05,WALL);box(g,.53,2.5,.4,10.1,1.25,2.05,WALL);
 for(let i=0;i<5;i++)box(g,.8,.12,3.6,10.7+i*.52,.1+i*.15,0,STONE);
 light(g,-9.5,2.5,-3.2,0xfdb66f,15,8);light(g,9.5,2.3,3.1,0xe5bb79,11,7);
 return {camera:new V(-2.0,11.4,15.8),target:new V(0,0,0),pulse:[],w,d};
}
function cocoon(g,x,z,r=0.6){
 const coc=sphere(g,r,x,r*.85,z,mat(0xaaa9a0,.95));coc.scale.set(1.0,1.55,.78);
 for(let k=0;k<12;k++){
  const theta=k/12*Math.PI*2;
  for(let s=0;s<3;s++){
   const th2=theta+.2+s*.19;
   line(g,[x+Math.cos(theta)*r*.96,.18,z+Math.sin(theta)*r*.8],[x+Math.cos(th2)*r*.8,1.3*r,z+Math.sin(th2)*r*.65]);
  }
 }
}
function spider(g,x,z){
 const black=mat(0x131313,.85),abdomen=mat(0x211c1a),red=mat(0xb42b1b,.38,{emissive:0x4e1009,emissiveIntensity:.4});
 const body=sphere(g,.65,x,.95,z,black);body.scale.set(1.3,.65,1.2);
 const rear=sphere(g,.85,x,1.1,z+.78,abdomen);rear.scale.set(1.05,.8,1.2);
 for(let i=0;i<8;i++){
  const side=i%2?1:-1,idx=Math.floor(i/2),theta=(idx-1.5)*.51;
  const a=new V(x+side*.38,1.05,z+theta);
  const b=new V(x+side*(1.75+idx*.13),1.5,z+theta*1.9);
  const c=new V(x+side*(2.15+idx*.22),.07,z+theta*2.6);
  for(const [p,q] of [[a,b],[b,c]]){
   const delta=q.clone().sub(p),joint=mesh(g,new THREE.CylinderGeometry(.09,.14,delta.length(),7),black,...p.clone().add(q).multiplyScalar(.5).toArray());
   joint.quaternion.setFromUnitVectors(new V(0,1,0),delta.normalize());
  }
 }
 sphere(g,.14,x-.34,1.02,z-.58,red);sphere(g,.14,x+.34,1.02,z-.58,red);
}
function makeDeath(g,base){
 const w=23,d=13.8;rockChamber(g,w,d);
 mapBase(g,base,w,d);
 const silk=mat(0xafa99c,.8,{transparent:true,opacity:.65});
 const cocoons=[[-9,-1.2,.68],[-7.5,4.6,.55],[-4.4,5.3,.82],[1.4,5.8,.53],[6.6,5.1,.73],[10,-.7,.67],[9.7,-4.6,.55],[4.6,-5.7,.86],[-8.4,-4.4,.65]];
 for(const [x,z,r] of cocoons)cocoon(g,x,z,r);
 // Sagging webs between jagged rocks along the perimeter.
 for(let i=0;i<42;i++){
  const ang=rand(i+37)*Math.PI*2,r=.87+rand(i+39)*.15;
  const x=Math.cos(ang)*w*.5*r,z=Math.sin(ang)*d*.5*r;
  for(let j=0;j<3;j++)line(g,[x,.25+rand(i+j)*2,z],[x+(rand(i+j+17)-.5)*3,.02,z+(rand(i+j+43)-.5)*3]);
 }
 // Fossils and leftover armor near the web clusters.
 for(let i=0;i<9;i++){
  const x=(rand(i+231)-.5)*w*.8,z=(rand(i+217)-.5)*d*.73;
  cylinder(g,.09,.09,.65,x,.16,z,silk,7).rotation.z=.55;
  sphere(g,.18,x+.25,.15,z+.2,silk);
 }
 spider(g,2.1,-.3);
 light(g,-6.4,2.4,1.6,0xffcb87,13,9);light(g,5.4,2.6,-2.9,0xa3b9d8,9,9);
 return {camera:new V(-.5,13.4,18.8),target:new V(0,.0,0),pulse:[],w,d};
}
export function createCinematicRoom(world,room,asset){
 const root=new THREE.Group();root.name='Cinematic '+room;world.scene.add(root);
 const config=room==='trials'?makeTrials(root,asset):room==='traps'?makeTraps(root,asset):makeDeath(root,asset);
 let elapsed=0,stopped=false;
 const prev={background:world.scene.background.clone(),fog:world.scene.fog,ambient:world.ambient.intensity,sun:world.sun.intensity,fill:world.fill.intensity};
 world.worldRoot.visible=false;world.gridRoot.visible=false;world.orbit.enabled=false;world.lantern.visible=false;
 world.scene.background=new THREE.Color('#121514');world.scene.fog=new THREE.FogExp2('#151716',.018);
 world.ambient.intensity=.78;world.sun.intensity=1.6;world.fill.intensity=.6;
 world.camera.fov=49;world.camera.updateProjectionMatrix();
 const target=config.target.clone();
 function tick(){
  if(stopped)return;
  elapsed+=.016;
  const t=elapsed*.11;
  const pos=config.camera;
  world.camera.position.set(pos.x+Math.sin(t)*1.25,pos.y+Math.sin(t*.7)*.32,pos.z+Math.cos(t)*1.05);
  world.camera.lookAt(target.x+Math.sin(t*.6)*.4,target.y,target.z);
  for(let i=0;i<config.pulse.length;i++)config.pulse[i].intensity=9+Math.sin(elapsed*1.4+i*1.5)*2;
  requestAnimationFrame(tick);
 }
 tick();
 return function stop(){
  stopped=true;world.scene.remove(root);
  root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material!==STONE&&o.material!==DARK&&o.material!==WALL&&o.material!==METAL&&o.material!==WEB){
   for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose?.();m.dispose?.();}
  }});
  world.worldRoot.visible=true;world.gridRoot.visible=world.gridOn;
  world.scene.background=prev.background;world.scene.fog=prev.fog;
  world.ambient.intensity=prev.ambient;world.sun.intensity=prev.sun;world.fill.intensity=prev.fill;
 };
}
