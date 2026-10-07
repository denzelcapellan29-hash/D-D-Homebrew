// Source-informed cinematic dioramas for Acq Inc Episode 1. The source maps
// remain selectable separately; player-facing 3D must not contain GM labels.
import * as THREE from 'three';
const V=THREE.Vector3;
const M=(color,roughness=.92,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
const STONE=M(0x77756a), DARK=M(0x343432), ROCK=M(0x3b3e3a), WOOD=M(0x694b32), BRASS=M(0xa88b5c,.54,{metalness:.46}), WEB=M(0xe9e6d9,.9,{transparent:true,opacity:.55,side:THREE.DoubleSide});
const lineMat=new THREE.LineBasicMaterial({color:0xd8d5c6,transparent:true,opacity:.49,depthWrite:false});
const rand=n=>{const s=Math.sin(n*121.13+19.17)*43758.545;return s-Math.floor(s)};
const mesh=(g,geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
const box=(g,w,h,d,x,y,z,m=STONE)=>mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);
const sphere=(g,r,x,y,z,m=STONE,detail=0)=>mesh(g,new THREE.IcosahedronGeometry(r,detail),m,x,y,z);
const cyl=(g,rt,rb,h,x,y,z,m=STONE,sides=16)=>mesh(g,new THREE.CylinderGeometry(rt,rb,h,sides),m,x,y,z);
function segment(g,a,b,r,m,side=8){const p=new V(...a),q=new V(...b),d=q.clone().sub(p);const o=cyl(g,r,r,d.length(),...(p.add(q).multiplyScalar(.5)).toArray(),m,side);o.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());return o;}
function line(g,a,b,m=lineMat){const o=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V(...a),new V(...b)]),m);g.add(o);return o;}
function ring(g,r,t,x,y,z,m=BRASS){const o=mesh(g,new THREE.TorusGeometry(r,t,9,64),m,x,y,z);o.rotation.x=-Math.PI/2;return o;}
function torch(g,x,z,color=0xffb464){box(g,.20,.40,.22,x,1.8,z,DARK);sphere(g,.14,x,2.15,z,M(color,.35,{emissive:color,emissiveIntensity:1}));const light=new THREE.PointLight(color,14,9,2);light.position.set(x,2.2,z);g.add(light);return light;}
function stoneTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#272926';ctx.fillRect(0,0,512,512);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const k=x+y*8,v=Math.floor(70+rand(k+2)*39),w=Math.floor(4+rand(k+73)*10);
  ctx.fillStyle=`rgb(${v},${v-2},${v-7})`;ctx.fillRect(x*64+2,y*64+2,60,60);
  ctx.fillStyle=`rgba(186,174,144,${.03+rand(k+13)*.12})`;ctx.fillRect(x*64+3,y*64+4,59,3);
  for(let j=0;j<28;j++){const n=k*29+j,px=x*64+rand(n+1)*60,py=y*64+rand(n+22)*60;
   ctx.fillStyle=rand(n+55)>.5?'#5a574d':'#393c37';ctx.globalAlpha=.05+rand(n+18)*.21;ctx.fillRect(px,py,1+rand(n+13)*w,1+rand(n+90)*3);
  }ctx.globalAlpha=1;
  if(rand(k+8)>.67){ctx.strokeStyle='rgba(20,21,20,.28)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x*64+rand(k+11)*55,y*64+3);ctx.lineTo(x*64+30,y*64+25);ctx.lineTo(x*64+53,y*64+40);ctx.stroke();}
 }
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;tex.repeat.set(2.0,1.25);return tex;
}
function earthTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const cx=c.getContext('2d');
 cx.fillStyle='#474237';cx.fillRect(0,0,512,512);
 for(let i=0;i<11000;i++){
  const x=rand(i+100)*512,y=rand(i+209)*512,a=.03+rand(i+17)*.23;
  cx.fillStyle=rand(i+701)>.5?`rgba(176,160,123,${a})`:`rgba(13,14,13,${a})`;
  const r=.6+rand(i+312)*6;cx.beginPath();cx.ellipse(x,y,r,r*.47,rand(i+33)*6,0,Math.PI*2);cx.fill();
 }
 for(let i=0;i<34;i++){
  const x=rand(i+855)*512,y=rand(i+999)*512;
  cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+(rand(i+11)-.5)*45,y+(rand(i+100)-.5)*39);
  cx.strokeStyle='rgba(19,23,20,.32)';cx.lineWidth=1.3;cx.stroke();
 }
 const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2.2,1.35);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function floor(g,w,d,stone=true){
 const c=stone?stoneTexture():earthTexture();const m=new THREE.MeshStandardMaterial({map:c,roughness:1,metalness:0});
 const f=mesh(g,new THREE.PlaneGeometry(w,d),m,0,.018,0);f.rotation.x=-Math.PI/2;f.castShadow=false;
 box(g,w,.3,d,0,-.21,0,M(stone?0x595851:0x35322e));return f;
}
function debris(g,w,d,count=70,seed=0){
 const mats=[M(0x68665e),M(0x4b4b46),M(0x817d6f),M(0x2f3232)];
 for(let i=0;i<count;i++){const n=i+seed,px=(rand(n*3)-.5)*w*.94,pz=(rand(n*7+24)-.5)*d*.85;
  const r=.06+rand(n+5)*.19;const o=sphere(g,r,px,r*.5,pz,mats[i%4]);o.scale.set(.8+rand(n+37),.3+rand(n+47)*.75,.7+rand(n+33));o.rotation.y=rand(n+21)*6;
 }
}
function masonry(g,w,d,height=2.35){
 const m=M(0x504e47),cap=M(0x777166);const t=.48;
 for(const [horizontal,side] of [[true,-1],[true,1],[false,-1],[false,1]]){
  if(horizontal && side===1)continue; // player-view cutaway: do not block the chamber foreground
  const L=horizontal?w:d,N=Math.ceil(L/1.15);
  for(let i=0;i<N;i++){
   const v=-L/2+(i+.5)*L/N,jitter=(rand(i+(side<0?17:39))-.5)*.06;
   if(horizontal){box(g,L/N-.05,height+jitter,t,v,(height+jitter)/2,side*d/2,m);box(g,L/N-.1,.12,.6,v,height+.025,side*d/2,cap);}
   else {box(g,t,height+jitter,L/N-.06,side*w/2,(height+jitter)/2,v,m);box(g,.6,.12,L/N-.09,side*w/2,height+.025,v,cap);}
  }
 }
 for(let i=0;i<30;i++){const side=i%4,px=(rand(i+3)-.5)*w*.94,pz=(rand(i+27)-.5)*d*.89;
  const a=sphere(g,.2+rand(i+4)*.24,side<2?px:(side===2?-w/2+.25:w/2-.25),.15,side<2?(side===0?-d/2+.2:d/2-.2):pz,M(0x605d56));a.scale.y=.5;
 }
}
function cave(g,w,d,seed=0){
 floor(g,w,d,false);
 const mats=[M(0x363935),M(0x46423a),M(0x57544b),M(0x242a2b)];
 for(let i=0;i<175;i++){
  const a=i/175*Math.PI*2,ir=(.94+rand(i+seed)*.21),x=Math.cos(a)*w*.505*ir,z=Math.sin(a)*d*.51*ir;
  const r=.32+rand(i+seed+9)*.71,h=.45+rand(i+seed+19)*1.2;
  const o=sphere(g,r,x,h*.47,z,mats[i%4]);o.scale.set(1+rand(i+seed+37)*1.15,h/r,1+rand(i+seed+57)*.83);o.rotation.set(rand(i+45)*2,rand(i+78)*6,rand(i+87)*.3);
 }
 debris(g,w,d,44,seed+106);
}
function water(g,x,z,r,color){
 // A real-looking well: dark lower cavity, rim, translucent active liquid and ripples.
 cyl(g,r-.03,r-.03,.18,x,-.075,z,M(0x111d23),64);
 cyl(g,r-.18,r-.18,.02,x,.035,z,M(color,.16,{emissive:color,emissiveIntensity:.56,metalness:.19,transparent:true,opacity:.85}),64);
 ring(g,r,.17,x,.13,z,M(0x9b9583,.59,{metalness:.16}));
 ring(g,r-.28,.012,x,.051,z,M(0xe1f5f3,.19,{transparent:true,opacity:.37,emissive:color,emissiveIntensity:.44}));
 const light=new THREE.PointLight(color,10,7,2);light.position.set(x,1.15,z);g.add(light);return light;
}
function makeTrials(g){
 const w=23,d=13.6;floor(g,w,d);masonry(g,w,d,2.65);
 const pulse=[];for(const [x,z,c] of [[-6.25,-2.7,0x208dea],[6.25,-2.7,0x28b88e],[-6.25,2.7,0xbcdde0],[6.25,2.7,0xaaa5c4]]) pulse.push(water(g,x,z,1.5,c));
 for(const x of [-1.75,1.75])for(const z of [-2.55,0,2.55]){
  cyl(g,.46,.54,1.84,x,.92,z,M(0x5c5c54),12);cyl(g,.58,.56,.16,x,1.92,z,M(0x908671),12);
  for(let a=0;a<4;a++){const ang=a*Math.PI/2;box(g,.12,1.18,.08,x+Math.sin(ang)*.48,.93,z+Math.cos(ang)*.48,M(0x78766d));}
 }
 // Tall paired stone doors at the east end, with a narrow seam and carved hardware.
 for(const z of [-.8,.8]){const door=box(g,.20,2.4,1.56,w/2-.2,1.2,z,M(0x918a7a));box(g,.23,.17,.26,w/2-.34,1.17,z+(z<0?.28:-.28),BRASS);}
 for(const z of [-5.6,5.6])torch(g,-10.6,z,0xffa95d);
 for(const z of [-5.6,5.6])torch(g,10.7,z,0xffb460);
 debris(g,w-4,d-2,14,19);
 return {camera:new V(-.8,10.2,15.2),target:new V(0,.62,0),pulse};
}
function pressure(g,x,w,d,m){const plate=box(g,w,.045,d,x,.064,0,m);plate.castShadow=false;
 for(const a of [-1,1])for(const b of [-1,1])sphere(g,.047,x+a*(w/2-.13),.09,b*(d/2-.13),BRASS);
 return plate;
}
function makeTraps(g){
 const w=25,d=9.8;floor(g,w,d);debris(g,w,d,24,219);
 // Corridor is channelled by old masonry rather than a floating platform.
 for(const side of [-1,1])for(let i=0;i<35;i++){
  const x=-w/2+(i+.5)*w/35;
  box(g,w/35-.035,1.62,.43,x,.84,side*d/2,M(i%5?0x514f47:0x6b675c));
 }
 // Traps A-D are real physical plates, deliberately unlabelled in player view.
 const bronze=M(0x625a4d,.7,{metalness:.15});
 pressure(g,-5.3,1.7,7.1,M(0x755b50,.82,{metalness:.2}));
 // Heat-scorched patch on the first pressure plate.
 for(let i=0;i<9;i++){const p=sphere(g,.12,-5.3+(rand(i+52)-.5)*1.1,.078,(rand(i+93)-.5)*6.3,M(0x221c1a));p.scale.y=.13;}
 pressure(g,-1.6,1.8,2.2,M(0x625e55));
 const trapB=box(g,1.25,.018,1.65,-1.6,.101,0,M(0x252829));trapB.castShadow=false;
 for(let i=0;i<7;i++)box(g,1.28,.028,.035,-1.6,.12,-.7+i*.23,bronze);
 pressure(g,2.0,1.9,4.3,M(0x695c54));
 // Spectral snare: no GM C label or magical rune diagram visible by default.
 for(let j=0;j<3;j++)sphere(g,.11,2+(rand(j+12)-.5)*.9,.32+j*.14,(rand(j+36)-.5)*2,M(0x858d8a,.65,{transparent:true,opacity:.27}));
 pressure(g,5.8,1.95,7.0,M(0x514c44));
 // Double door corresponding to the locked passage.
 for(const z of [-.76,.76]){box(g,.16,2.4,1.5,9.8,1.2,z,M(0x81786d));box(g,.18,.13,.16,9.65,1.1,z+Math.sign(z)*-.18,BRASS);}
 torch(g,-9.5,-4.35);torch(g,8.45,4.35,0xffc379);
 return {camera:new V(-.5,9.4,15.0),target:new V(.5,.34,0),pulse:[]};
}
function cocoon(g,x,z,size=1){
 const silk=M(0xcecab9,.98);const mat=M(0xeae5d9,.9,{transparent:true,opacity:.4});
 const core=sphere(g,size*.54,x,2.25+size*.7,z,silk);core.scale.set(.90,1.55,.75);
 for(let j=0;j<15;j++){
  const a=j/15*Math.PI*2,r=size*.55;
  const start=[x+Math.cos(a)*r*.55,2.1,z+Math.sin(a)*r*.4];
  const end=[x+Math.cos(a+1.1)*r*.55,4.8,z+Math.sin(a+1.1)*r*.4];
  segment(g,start,end,.013,mat,4);
 }
 line(g,[x,4.6,z],[x+rand(x+11)*.8,5.2,z]);
}
function spider(g,x,z){
 const shell=M(0x171b1b),sac=M(0x302820),red=M(0xff4b21,.2,{emissive:0x9a1c0b,emissiveIntensity:.92});
 const body=sphere(g,.64,x,.81,z,shell);body.scale.set(1.2,.83,1.2);
 const belly=sphere(g,.74,x,1.0,z+.71,sac);belly.scale.set(1.12,.84,1.04);
 for(let i=0;i<8;i++){
  const side=i%2?1:-1,j=Math.floor(i/2),t=(j-1.5)*.43;
  const a=[x+side*.44,.88,z+t],b=[x+side*(1.35+j*.18),1.72,z+t*2.1],c=[x+side*(2.1+j*.14),.10,z+t*2.6];
  segment(g,a,b,.10,shell);segment(g,b,c,.067,shell);
 }
 sphere(g,.11,x-.28,.90,z-.51,red);sphere(g,.11,x+.28,.90,z-.51,red);
 return body;
}
function makeDeath(g){
 const w=23,d=13.8;cave(g,w,d,40);
 // Dust-filled hollow where the giant spider is concealed in the printed encounter.
 const hollow=cyl(g,2.65,2.9,.04,2.2,.046,-.9,M(0x302d29),32);hollow.castShadow=false;
 for(const [x,z,r] of [[-9,-1.4,.75],[-6.3,4.4,.58],[2.2,5,.89],[8.3,3.1,.72],[6.9,-4.7,.55]])cocoon(g,x,z,r);
 // Silk sheets cling to the outer cave walls, not a lattice suspended in empty space.
 for(let i=0;i<40;i++){
  const a=rand(i+29)*Math.PI*2,x=Math.cos(a)*w*.44,z=Math.sin(a)*d*.44;
  const b=[x+(rand(i+47)-.5)*1.6,.5+rand(i+65)*1.7,z+(rand(i+75)-.5)*1.7];
  line(g,[x,.2,z],b);
 }
 spider(g,2.1,-.85);
 for(let i=0;i<13;i++){
  const x=(rand(i+222)-.5)*w*.8,z=(rand(i+412)-.5)*d*.6;
  segment(g,[x,.11,z],[x+.35,.11,z+.2],.045,M(0xa5a18c));
 }
 const pulse=[torch(g,-8.6,-5.2,0xffb767),torch(g,7.1,-5.5,0x86b9cd)];
 return {camera:new V(-.8,9.5,15.6),target:new V(.2,.7,0),pulse};
}
function makeGoblin(g){const w=20,d=14;cave(g,w,d,120);
 for(let i=0;i<21;i++){const x=(rand(i+102)-.5)*w*.75,z=(rand(i+122)-.5)*d*.78;
  const h=.7+rand(i+23)*2;const o=mesh(g,new THREE.ConeGeometry(.23+rand(i+54)*.37,h,6),STONE,x,h/2,z);o.rotation.z=(rand(i+78)-.5)*.18;
 }
 // One nervous goblin with a false staff of magical authority.
 const body=sphere(g,.38,-3,.75,1.1,M(0x596044));body.scale.y=1.1;
 sphere(g,.32,-3,1.33,1.1,M(0x77764a));segment(g,[-2.6,.25,1.1],[-2.58,2.15,1.1],.052,WOOD);
 const pulse=[torch(g,4.5,-3.5)];return {camera:new V(1.0,7.3,16),target:new V(-2,.7,0),pulse};}
function makeStomp(g){const w=23,d=14;cave(g,w,d,210);
 const foot=M(0x735c47),nail=M(0x9f8b73);
 for(let i=0;i<74;i++){
  const x=(rand(i+12)-.5)*w*.83,z=(rand(i+36)-.5)*d*.73,s=.21+rand(i+56)*.24;
  const p=sphere(g,s,x,.07,z,foot);p.scale.set(.65,.32,1.36);p.rotation.y=rand(i+100)*6;
  for(let toe=0;toe<3;toe++)sphere(g,s*.24,x+(toe-1)*s*.38,.08,z+s,nail);
 }
 const block=box(g,3.8,1.15,3.8,0,3.6,0,M(0x6e6a60));block.rotation.z=.07;
 for(let i=0;i<4;i++)segment(g,[i<2?-1.7:1.7,4.2,i%2?-1.7:1.7],[i<2?-3.1:3.1,5.7,i%2?-3.1:3.1],.11,DARK);
 const pulse=[torch(g,-9,-4),torch(g,9,4)];return {camera:new V(-.2,9,17),target:new V(0,1.1,0),pulse};}
function makeTentacle(g){const w=21,d=15;floor(g,w,d);masonry(g,w,d,3.1);
 const waterMat=M(0x285249,.27,{metalness:.27,transparent:true,opacity:.9,emissive:0x082c25,emissiveIntensity:.5});
 cyl(g,4.0,4.0,.12,0,.05,0,M(0x101b1b),64);cyl(g,3.65,3.65,.035,0,.11,0,waterMat,64);ring(g,4.09,.24,0,.21,0,STONE);
 // Real source encounter: tentacle emerges from a ten-foot-deep central cesspool.
 const path=new THREE.CatmullRomCurve3([new V(-.4,.1,.7),new V(-1.1,1.6,.3),new V(-.7,3,.1),new V(1.2,3.6,-1),new V(2.3,5.2,-.8),new V(2.0,6.5,.3)]);
 mesh(g,new THREE.TubeGeometry(path,60,.39,12,false),M(0x3a9875,.42,{emissive:0x0b2920,emissiveIntensity:.35}));
 for(let i=0;i<11;i++){
  const t=(i+.3)/13,p=path.getPoint(t);const o=sphere(g,.13,p.x+.3,p.y,p.z,M(0x9dc992));o.scale.set(.5,.6,.32);
 }
 for(let i=0;i<7;i++){
  const x=-7.5+i*2.3;const drain=cyl(g,.33,.34,2,x,2.1,-d/2+.6,M(0x66635c));drain.rotation.z=Math.PI/2;
 }
 const pulse=[torch(g,-9,4),torch(g,9,4,0xa2f2b7)];return {camera:new V(-.5,8.7,17),target:new V(0,1.55,0),pulse};}
function makeDragon(g){const w=23,d=14;cave(g,w,d,313);
 const gold=M(0xb59a52,.65,{metalness:.24}),wing=M(0x6e5d3f,.86,{side:THREE.DoubleSide});
 const body=sphere(g,1.6,0,1.35,0,gold);body.scale.set(1.46,.86,.96);
 const head=sphere(g,.86,1.6,1.73,-.6,gold);head.scale.set(1.15,.74,.9);
 for(const side of [-1,1]){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([side*.7,1.8,0,side*4.5,3.4,1.1,side*3.8,.48,-1.5],3));geo.computeVertexNormals();mesh(g,geo,wing);
  segment(g,[1.4+side*.12,2.16,-.88],[1.2+side*.48,2.79,-1.4],.09,gold);
 }
 for(let i=0;i<6;i++)sphere(g,.21,2.3+i*.17,1.1,-1.1+(i%2)*.25,gold);
 // Two darkmantles hang over the injured brass wyrmling.
 for(const x of [-3.8,4.1]){
  sphere(g,.43,x,3.35,-2.9,DARK);for(let i=0;i<4;i++)segment(g,[x,3.2,-2.9],[x+(i-1.5)*.52,2.1,-2.2],.065,DARK);
 }
 const pulse=[torch(g,-8,-5,0xff9f4d),torch(g,8,-4,0xffc873)];return {camera:new V(1.1,8.3,17),target:new V(0,1.5,0),pulse};}
function makeShrine(g){const w=23,d=14;floor(g,w,d);masonry(g,w,d,3.9);
 const altar=box(g,5.1,1.2,3.3,0,.6,-1.4,M(0x69685e));
 for(let i=0;i<6;i++)box(g,.58,1.85,.65,-8.4+i*3.36,.92,-5.3,M(0x504e49));
 const metal=M(0xb8a15f,.34,{metalness:.72}),ghost=M(0x8c7cd0,.24,{emissive:0x423075,emissiveIntensity:.6});
 const center=sphere(g,.44,0,2.48,-1.4,ghost);const arcs=[];
 for(let j=0;j<4;j++){
  const o=ring(g,1.05+j*.27,.045,0,2.45,-1.4,metal);o.rotation.x=(j+1)*.37;o.rotation.y=j*1.1;arcs.push(o);
 }
 for(let i=0;i<10;i++){const x=(rand(i+300)-.5)*9,z=(rand(i+340)-.5)*5;
  const o=sphere(g,.1,x,.16,z,ghost);o.scale.y=.44;
 }
 const pulse=[torch(g,-9,2,0xa891fa),torch(g,9,2,0xffb66c)];return {camera:new V(-.5,8.4,17.4),target:new V(0,1.15,-1),pulse,arcs};}
const BUILDERS={trials:makeTrials,traps:makeTraps,death:makeDeath,goblin:makeGoblin,stomp:makeStomp,tentacle:makeTentacle,dragon:makeDragon,shrine:makeShrine};
export function createCinematicRoom(world,room){
 const root=new THREE.Group();root.name='Episode 1 / '+room;world.scene.add(root);
 const build=BUILDERS[room];if(!build)throw Error('No cinematic room: '+room);
 const config=build(root),save={background:world.scene.background.clone(),fog:world.scene.fog,ambient:world.ambient.intensity,sun:world.sun.intensity,fill:world.fill.intensity,fov:world.camera.fov};
 world.worldRoot.visible=false;world.gridRoot.visible=false;world.orbit.enabled=false;world.lantern.visible=false;
 world.scene.background=new THREE.Color('#121615');world.scene.fog=new THREE.FogExp2('#111713',.010);
 world.ambient.intensity=1.20;world.sun.intensity=1.8;world.fill.intensity=.65;world.camera.fov=54;world.camera.updateProjectionMatrix();
 let elapsed=0,stopped=false;function tick(){if(stopped)return;elapsed+=.016;const t=elapsed*.15;
  const base=config.camera,tar=config.target;
  world.camera.position.set(base.x+Math.sin(t)*.85,base.y+Math.sin(t*.7)*.18,base.z+Math.cos(t)*.65);
  world.camera.lookAt(tar.x+Math.sin(t*.7)*.15,tar.y,tar.z);
  for(let i=0;i<config.pulse.length;i++)config.pulse[i].intensity=11+Math.sin(elapsed*1.27+i*.8)*1.55;
  if(config.arcs)for(let i=0;i<config.arcs.length;i++)config.arcs[i].rotation.z=elapsed*(i%2?.07:-.06);
  requestAnimationFrame(tick);
 }tick();
 return function stop(){stopped=true;world.scene.remove(root);
  root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if([STONE,DARK,ROCK,WOOD,BRASS,WEB,lineMat].includes(m))continue;m.map?.dispose?.();m.dispose?.();
  }}});
  world.worldRoot.visible=true;world.gridRoot.visible=world.gridOn;
  world.scene.background=save.background;world.scene.fog=save.fog;world.ambient.intensity=save.ambient;world.sun.intensity=save.sun;world.fill.intensity=save.fill;
  world.camera.fov=save.fov;world.camera.updateProjectionMatrix();
 };
}