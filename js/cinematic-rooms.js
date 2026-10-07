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
const sphere=(g,r,x,y,z,m=STONE,detail=1)=>mesh(g,new THREE.IcosahedronGeometry(r,detail),m,x,y,z);
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
 for(let i=0;i<133;i++){
  const a=i/133*Math.PI*2,ir=(.94+rand(i+seed)*.21),x=Math.cos(a)*w*.505*ir,z=Math.sin(a)*d*.51*ir;
  const r=.32+rand(i+seed+9)*.71,h=.45+rand(i+seed+19)*1.2;
  const o=sphere(g,r,x,h*.47,z,mats[i%4],i%4===0?1:0);o.scale.set(1+rand(i+seed+37)*1.15,h/r,1+rand(i+seed+57)*.83);o.rotation.set(rand(i+45)*2,rand(i+78)*6,rand(i+87)*.3);
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
function reliefFigure(g,x,y,z,flip=1){
 const stone=M(0x6d6a60,.94);
 // Shallow bas-relief: hooded robed figure bending toward a circular pool.
 sphere(g,.16,x,y+.46,z,stone,1);
 const robe=mesh(g,new THREE.ConeGeometry(.27,.72,7),stone,x,y,z);robe.rotation.z=flip*.13;
 const arm=segment(g,[x+flip*.12,y+.20,z+.015],[x+flip*.34,y-.02,z+.02],.045,stone,6);
 const basin=mesh(g,new THREE.TorusGeometry(.30,.045,6,18),stone,x+flip*.48,y-.18,z+.01);basin.rotation.x=Math.PI/2;
}
function makeTrials(g){
 const w=29,d=17.5;floor(g,w,d);masonry(g,w,d,3.35);
 const pulse=[];
 // Four ritual basins are spaced farther apart and slightly larger so the
 // chamber reads as a major trial hall rather than a compact puzzle box.
 for(const [x,z,col] of [[-8.1,-4.1,0x208dea],[8.1,-4.1,0x28b88e],[-8.1,4.1,0xbcdde0],[8.1,4.1,0xaaa5c4]]){
  pulse.push(water(g,x,z,1.78,col));
 }
 // Six monolithic pillars: taller, heavier and carved with brass collars.
 for(const x of [-2.35,2.35])for(const z of [-3.6,0,3.6]){
  cyl(g,.62,.74,2.72,x,1.36,z,M(0x56574f),12);
  cyl(g,.78,.73,.20,x,2.80,z,M(0x93866d,.7,{metalness:.08}),12);
  cyl(g,.75,.81,.20,x,.18,z,M(0x484942),12);
  for(let a=0;a<4;a++){const ang=a*Math.PI/2;
   box(g,.13,1.7,.10,x+Math.sin(ang)*.62,1.35,z+Math.cos(ang)*.62,M(0x74736a));
  }
 }
 // Source detail: the walls depict robed figures submerging themselves
 // in the four pools. These are shallow reliefs, not readable GM text.
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const z=-5.8+i*3.85;
  reliefFigure(g,side*(w/2-.055),1.72,z,side);
 }
 // Raised threshold and tall paired stone doors at the east end.
 box(g,.95,.22,4.0,w/2-.72,.11,0,M(0x57564f));
 for(const z of [-1.08,1.08]){
  box(g,.26,3.15,2.05,w/2-.28,1.58,z,M(0x8c8577));
  box(g,.29,.19,.31,w/2-.46,1.42,z+(z<0?.37:-.37),BRASS);
 }
 // Large ornate central lock with concentric carved geometry.
 const lock=sphere(g,.38,w/2-.52,1.48,0,BRASS,2);lock.scale.set(.34,1.0,1.0);
 for(let j=0;j<3;j++){const r=ring(g,.28+j*.13,.035,w/2-.55,1.48,0,BRASS);r.rotation.y=Math.PI/2;r.rotation.z=j*.42;}
 // Side buttresses and ritual braziers add architectural scale cues.
 for(const side of [-1,1])for(const z of [-6.6,0,6.6]){
  box(g,.72,2.45,.95,side*(w/2-.48),1.22,z,M(0x4d4e48));
 }
 for(const [x,z] of [[-12.4,-7.0],[-12.4,7.0],[12.4,-7.0],[12.4,7.0]])torch(g,x,z,0xffac61);
 debris(g,w-5,d-3,18,19);
 return {camera:new V(-1.5,10.8,20.8),target:new V(0,.82,.2),pulse};
}
function pressure(g,x,w,d,m){const plate=box(g,w,.045,d,x,.064,0,m);plate.castShadow=false;
 for(const a of [-1,1])for(const b of [-1,1])sphere(g,.047,x+a*(w/2-.13),.09,b*(d/2-.13),BRASS);
 return plate;
}
function makeTraps(g){
 const w=31,d=11.6;floor(g,w,d);debris(g,w,d,30,219);
 // A longer, taller corridor so the sequence reads as a dangerous traversal,
 // not four plates sitting in a small room.
 for(const side of [-1,1])for(let i=0;i<40;i++){
  const x=-w/2+(i+.5)*w/40;
  box(g,w/40-.035,2.12,.52,x,1.06,side*d/2,M(i%5?0x4e4d47:0x68645b));
 }
 const bronze=M(0x625a4d,.7,{metalness:.15});
 pressure(g,-7.2,2.0,8.4,M(0x755b50,.82,{metalness:.2}));
 for(let i=0;i<11;i++){const p=sphere(g,.13,-7.2+(rand(i+52)-.5)*1.35,.078,(rand(i+93)-.5)*7.2,M(0x211a18));p.scale.y=.12;}
 pressure(g,-2.5,2.05,2.55,M(0x625e55));
 const trapB=box(g,1.48,.018,1.92,-2.5,.101,0,M(0x252829));trapB.castShadow=false;
 for(let i=0;i<8;i++)box(g,1.5,.028,.035,-2.5,.12,-.84+i*.24,bronze);
 pressure(g,2.7,2.15,4.95,M(0x695c54));
 for(let j=0;j<4;j++)sphere(g,.12,2.7+(rand(j+12)-.5)*1.0,.32+j*.13,(rand(j+36)-.5)*2.3,M(0x858d8a,.65,{transparent:true,opacity:.23}));
 pressure(g,8.0,2.25,8.5,M(0x514c44));
 // Deep doorway alcove gives the far end a destination.
 box(g,.70,2.9,4.35,12.6,1.45,0,M(0x3d3d39));
 for(const z of [-.94,.94]){
  box(g,.18,2.72,1.82,13.02,1.36,z,M(0x81786d));
  box(g,.20,.15,.18,12.86,1.24,z+Math.sign(z)*-.22,BRASS);
 }
 torch(g,-12.8,-5.0);torch(g,11.0,5.0,0xffc379);
 return {camera:new V(-2.0,8.2,20.3),target:new V(.8,.38,0),pulse:[]};
}
function cocoon(g,x,z,size=1){
 const silk=M(0xcecab9,.98);const mat=M(0xeae5d9,.9,{transparent:true,opacity:.4});
 const core=sphere(g,size*.54,x,2.25+size*.7,z,silk,2);core.scale.set(.90,1.80,.79);
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
 const body=sphere(g,.73,x,.81,z,shell,2);body.scale.set(1.2,.83,1.2);
 const belly=sphere(g,.82,x,1.0,z+.71,sac,2);belly.scale.set(1.12,.84,1.04);
 for(let i=0;i<8;i++){
  const side=i%2?1:-1,j=Math.floor(i/2),t=(j-1.5)*.43;
  const a=[x+side*.44,.88,z+t],b=[x+side*(1.35+j*.18),1.72,z+t*2.1],c=[x+side*(2.1+j*.14),.10,z+t*2.6];
  segment(g,a,b,.10,shell);segment(g,b,c,.067,shell);
 }
 sphere(g,.11,x-.28,.90,z-.51,red);sphere(g,.11,x+.28,.90,z-.51,red);
 return body;
}
function makeDeath(g){
 const w=25,d=15.5;cave(g,w,d,40);
 // Dust-filled hollow where the giant spider is concealed in the printed encounter.
 const hollow=cyl(g,3.0,3.25,.045,2.5,.046,-1.0,M(0x292725),36);hollow.castShadow=false;
 // Fewer, larger cocoons make each silhouette readable from a television.
 for(const [x,z,r] of [[-9.5,-1.8,.88],[-6.7,4.8,.72],[1.8,5.4,.98],[8.9,3.4,.82],[7.5,-5.0,.69]])cocoon(g,x,z,r);
 // Dense web curtains stay at the perimeter instead of filling the middle.
 for(let i=0;i<52;i++){
  const a=rand(i+29)*Math.PI*2,x=Math.cos(a)*w*.44,z=Math.sin(a)*d*.44;
  const b=[x+(rand(i+47)-.5)*1.8,.7+rand(i+65)*2.1,z+(rand(i+75)-.5)*1.9];
  line(g,[x,.25,z],b);
 }
 // Larger, slightly raised spider with a lower camera for a stronger reveal.
 spider(g,2.4,-1.05);
 for(let i=0;i<18;i++){
  const x=(rand(i+222)-.5)*w*.78,z=(rand(i+412)-.5)*d*.62;
  segment(g,[x,.11,z],[x+.35,.11,z+.2],.045,M(0xa5a18c));
 }
 // Cool backlight through the webbed rear wall plus a warm entry torch.
 const pulse=[torch(g,-9.4,-5.8,0xffb767),torch(g,7.9,-5.9,0x86b9cd)];
 return {camera:new V(-1.2,6.9,16.8),target:new V(1.0,.92,-.35),pulse};
}
function makeGoblin(g){
 const w=22,d=15;cave(g,w,d,120);
 // Keep only a few natural stalagmites, arranged as framing rather than a
 // forest of identical cones that competes with the character.
 for(const [x,z,h,r] of [[-7,-3,1.5,.42],[-6,3.8,2.2,.55],[5.8,-4.2,1.8,.48],[7,3.2,2.6,.62],[-1.2,-5.3,1.2,.36]]){
  const o=mesh(g,new THREE.ConeGeometry(r,h,8),M(0x5c5a51),x,h/2,z);o.rotation.z=(x+z)*.015;
 }
 const skin=M(0x71834b,.86),skinDark=M(0x52603a,.9),cloak=M(0x4c3d28,.95),leather=M(0x6b4b2f,.9);
 const eye=M(0xf4d98b,.35,{emissive:0xa48131,emissiveIntensity:.3}),tooth=M(0xd8d2b8),iron=M(0x373b39,.55,{metalness:.32});
 const x=-1.8,z=.35;
 // Bent legs and oversized feet give the silhouette a goblin stance.
 for(const side of [-1,1]){
  segment(g,[x+side*.23,.72,z],[x+side*.31,.35,z+.09],.13,skinDark,9);
  segment(g,[x+side*.31,.35,z+.09],[x+side*.43,.12,z+.23],.11,skinDark,9);
  const foot=sphere(g,.18,x+side*.45,.11,z+.34,skinDark,2);foot.scale.set(1.25,.45,1.75);
 }
 const torso=sphere(g,.48,x,1.05,z,cloak,2);torso.scale.set(.84,1.15,.67);
 // Belt, pouch and ragged shoulder cloth.
 ring(g,.38,.055,x,.92,z,leather);
 box(g,.24,.30,.14,x+.38,.82,z+.05,leather);
 const shoulder=box(g,.92,.10,.48,x,1.34,z-.02,M(0x59492f));shoulder.rotation.z=.04;
 // Long-necked head with brows, ears, nose and visible mouth.
 const neck=cyl(g,.17,.20,.34,x,1.49,z,skinDark,10);
 const head=sphere(g,.43,x,1.79,z+.02,skin,2);head.scale.set(1.02,.82,.87);
 for(const side of [-1,1]){
  const ear=sphere(g,.25,x+side*.48,1.82,z-.02,skin,1);ear.scale.set(1.55,.34,.76);ear.rotation.z=side*.22;
  sphere(g,.065,x+side*.17,1.84,z+.34,eye,2);
  const brow=box(g,.22,.045,.055,x+side*.16,1.94,z+.31,skinDark);brow.rotation.z=side*.16;
 }
 const nose=sphere(g,.12,x,1.70,z+.42,skinDark,1);nose.scale.set(.72,.72,1.18);
 box(g,.33,.045,.05,x,1.58,z+.43,M(0x241d17));
 for(const tx of [-.10,.10])sphere(g,.045,x+tx,1.55,z+.46,tooth,1);
 // One hand clutches a very ordinary crooked stick; the other gestures nervously.
 segment(g,[x+.37,1.28,z],[x+.66,.82,z+.10],.105,skin,9);
 segment(g,[x+.66,.82,z+.10],[x+.75,.45,z+.13],.09,skin,9);
 segment(g,[x+.73,.38,z+.14],[x+.93,2.68,z+.16],.055,WOOD,8);
 segment(g,[x-.36,1.28,z],[x-.70,1.13,z+.20],.10,skin,9);
 segment(g,[x-.70,1.13,z+.20],[x-.90,1.45,z+.34],.085,skin,9);
 for(let j=0;j<3;j++)segment(g,[x-.90,1.45,z+.34],[x-.98-j*.05,1.58+j*.03,z+.43],.025,skin,6);
 // Tiny iron knife at the belt: comic menace, not boss-monster language.
 segment(g,[x-.25,.92,z+.31],[x-.32,.55,z+.48],.035,iron,6);
 // Source detail: obvious heap of bones and gear to the northeast.
 for(let i=0;i<14;i++){
  const bx=5.3+(rand(i+701)-.5)*2.3,bz=-4.1+(rand(i+731)-.5)*1.9;
  segment(g,[bx,.10,bz],[bx+.30,.10,bz+.10],.045,M(0xb7aa8c),6);
 }
 box(g,.58,.28,.42,5.9,.16,-4.4,leather);
 // Fragile sharp stalactite cluster at the narrow approach to the next cavern.
 for(let i=0;i<8;i++){
  const h=.75+(i%4)*.22,x=7.0+(i%4)*.30,z=1.9+Math.floor(i/4)*.42;
  const s=mesh(g,new THREE.ConeGeometry(.13,h,7),M(0x69675f),x,3.85-h/2,z);s.rotation.z=(i%2?.08:-.06);
 } const pulse=[torch(g,5.2,-3.8),torch(g,-7.0,4.5,0xff9b55)];
 return {camera:new V(1.6,5.9,14.0),target:new V(x,1.22,z),pulse};
}
function makeStomp(g){
 const w=25,d=15;cave(g,w,d,210);
 const foot=M(0x735c47),nail=M(0x9f8b73);
 // Environmental evidence, not a carpet of tiny feet: several enormous,
 // overlapping impressions lead toward the suspended threat.
 for(let i=0;i<18;i++){
  const x=(rand(i+12)-.5)*w*.70,z=-5.6+i*.62+(rand(i+36)-.5)*.8,s=.48+rand(i+56)*.30;
  const p=sphere(g,s,x,.045,z,foot);p.scale.set(.78,.18,1.48);p.rotation.y=(rand(i+100)-.5)*.5;
  for(let toe=0;toe<4;toe++)sphere(g,s*.22,x+(toe-1.5)*s*.30,.055,z+s*.90,nail);
 }
 // Main stomp crater: cracked dark earth beneath the looming foot.
 const crater=cyl(g,3.1,3.5,.05,.2,.04,.15,M(0x242320),36);crater.castShadow=false;
 for(let i=0;i<14;i++){
  const a=i/14*Math.PI*2,r=3.0+(i%3)*.24;
  segment(g,[Math.cos(a)*1.1,.06,Math.sin(a)*1.1],[Math.cos(a)*r,.06,Math.sin(a)*r],.025,M(0x171716),5);
 }
 // Suspended giant granite foot: clearly foot-shaped, much larger, and tilted
 // toward the party so the absurd danger reads immediately.
 const granite=M(0x66635e),toeStone=M(0x827d72);
 const sole=sphere(g,2.15,.2,4.35,-.1,granite,2);sole.scale.set(1.22,.38,1.72);sole.rotation.x=.10;sole.rotation.z=-.05;
 const heel=sphere(g,1.18,.2,4.28,-2.25,granite,2);heel.scale.set(1.03,.58,.90);
 for(let toe=0;toe<5;toe++){
  const x=.2+(toe-2)*.82,size=toe===0?.90:toe===1?.79:.70-(toe-2)*.075;
  const t=sphere(g,size,x,4.10,2.35-((toe-1.8)**2)*.11,toeStone,2);
  t.scale.set(.67,.42,1.05);
 }
 // Source detail: rune-graven footprints on north and south walls power
 // the Big Foot. Keep them symbolic/player-visible without exposing mechanics.
 for(const side of [-1,1]){
  const wallZ=side*(d/2-.08);
  const sole=mesh(g,new THREE.CircleGeometry(.58,16),M(0x8f8067,.8,{emissive:0x3d2f1d,emissiveIntensity:.28}),0,1.42,wallZ);
  sole.scale.set(.72,1.28,1);sole.rotation.x=side*Math.PI/2;
  for(let toe=0;toe<5;toe++){
   const t=mesh(g,new THREE.CircleGeometry(.13-(toe*.009),12),sole.material,(toe-2)*.19,2.05-Math.abs(toe-2)*.05,wallZ-side*.01);
   t.rotation.x=side*Math.PI/2;
  }
 } // Heavy suspension rig disappearing upward into darkness.
 for(const [x,z] of [[-1.3,-1.3],[-1.25,1.1],[1.55,-1.25],[1.55,1.15]]){
  segment(g,[x,4.75,z],[x*1.65,6.6,z*1.65],.11,DARK);
 }
 const pulse=[torch(g,-9.8,-4.6),torch(g,9.8,4.5)];
 return {camera:new V(-.4,7.1,17.0),target:new V(.2,2.15,.25),pulse};
}
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
function makeDragon(g){
 const w=26,d=16;cave(g,w,d,313);
 // Dabshabah: a wounded young BRASS dragon. The silhouette must read as a
 // dragon first: long neck, wedge head, articulated limbs, broad folded wings.
 const scale=M(0xb38a43,.50,{metalness:.28}),belly=M(0xd4b36e,.58,{metalness:.14});
 const darkScale=M(0x795c32,.64,{metalness:.18}),membrane=M(0x5a4939,.90,{side:THREE.DoubleSide});
 const horn=M(0x9f8458,.72),eye=M(0xf2b84a,.2,{emissive:0xa25d16,emissiveIntensity:.72});
 const wound=M(0x72402f,.94);
 const cx=.35,cz=-.65;
 // Body and haunches form a grounded S-curve instead of a round toy torso.
 const body=sphere(g,1.18,cx,1.12,cz,scale,2);body.scale.set(1.65,.82,2.05);
 const chest=sphere(g,.92,cx,1.28,cz+1.18,belly,2);chest.scale.set(1.04,.96,1.28);
 for(const side of [-1,1]){
  const haunch=sphere(g,.78,cx+side*.78,.80,cz-.85,darkScale,2);haunch.scale.set(1.05,.85,1.18);
 }
 // Rising neck built from tapered articulated segments.
 const neckPts=[
  [cx,1.38,cz+1.35],[cx-.05,1.72,cz+1.95],[cx+.08,2.05,cz+2.52],[cx+.18,2.32,cz+3.05]
 ];
 for(let i=0;i<neckPts.length-1;i++)segment(g,neckPts[i],neckPts[i+1],.44-i*.055,scale,12);
 // Wedge-shaped head and jaw.
 const head=sphere(g,.64,cx+.20,2.38,cz+3.48,scale,2);head.scale.set(1.08,.66,1.32);
 const muzzle=sphere(g,.46,cx+.20,2.23,cz+3.98,belly,2);muzzle.scale.set(1.05,.50,1.35);
 const jaw=box(g,.82,.16,.72,cx+.20,2.08,cz+3.72,darkScale);jaw.rotation.x=-.07;
 for(const side of [-1,1]){
  sphere(g,.085,cx+.20+side*.30,2.49,cz+3.78,eye,2);
  sphere(g,.055,cx+.20+side*.19,2.30,cz+4.36,M(0x2d261d),2);
  // swept horns and cheek spines
  segment(g,[cx+.20+side*.34,2.63,cz+3.17],[cx+.20+side*.63,3.08,cz+2.55],.11,horn,9);
  for(let j=0;j<3;j++)segment(g,[cx+.20+side*(.38+j*.05),2.28-j*.05,cz+3.12-j*.12],[cx+.20+side*(.72+j*.10),2.16-j*.06,cz+2.78-j*.15],.055,horn,7);
 }
 // Four articulated legs with elbows/knees and clawed feet.
 for(const side of [-1,1]){
  // forelegs
  segment(g,[cx+side*.72,1.28,cz+1.16],[cx+side*.98,.66,cz+1.58],.18,scale,10);
  segment(g,[cx+side*.98,.66,cz+1.58],[cx+side*1.12,.18,cz+1.93],.13,scale,10);
  const ff=sphere(g,.20,cx+side*1.12,.15,cz+2.02,darkScale,2);ff.scale.set(1.25,.42,1.55);
  // rear legs
  segment(g,[cx+side*.92,.92,cz-.78],[cx+side*1.35,.48,cz-.30],.24,darkScale,10);
  segment(g,[cx+side*1.35,.48,cz-.30],[cx+side*1.55,.16,cz+.12],.16,scale,10);
  const rf=sphere(g,.24,cx+side*1.56,.14,cz+.24,darkScale,2);rf.scale.set(1.25,.42,1.62);
  for(let j=0;j<3;j++){
   segment(g,[cx+side*(1.08+j*.08),.17,cz+2.08+j*.03],[cx+side*(1.10+j*.12),.10,cz+2.28+j*.05],.032,horn,6);
   segment(g,[cx+side*(1.52+j*.08),.15,cz+.30+j*.03],[cx+side*(1.56+j*.12),.09,cz+.52+j*.05],.035,horn,6);
  }
 }
 // Folded wings rise from the shoulders and sweep backward. Multiple panels,
 // finger bones and scalloped trailing edges create a readable dragon wing.
 for(const side of [-1,1]){
  const root=[cx+side*.68,1.72,cz-.18];
  const elbow=[cx+side*2.2,3.05,cz-1.0];
  const tip=[cx+side*4.6,2.55,cz-3.25];
  const rear=[cx+side*2.35,.82,cz-3.55];
  segment(g,root,elbow,.12,horn,9);segment(g,elbow,tip,.08,horn,8);segment(g,root,rear,.07,horn,8);
  const verts=[
    ...root,...elbow,...tip,
    ...root,...tip,...rear,
    ...root,...rear,cx+side*1.30,1.05,cz-.55
  ];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.computeVertexNormals();
  mesh(g,geo,membrane);
 }
 // Long tapering tail curls away from the camera.
 const tailPath=new THREE.CatmullRomCurve3([
  new V(cx,1.0,cz-1.8),new V(cx-.45,.70,cz-3.0),new V(cx-1.65,.50,cz-4.1),new V(cx-3.2,.42,cz-3.7),new V(cx-4.25,.34,cz-2.8)
 ]);
 mesh(g,new THREE.TubeGeometry(tailPath,44,.28,10,false),scale);
 for(let i=0;i<7;i++){const p=tailPath.getPoint((i+.4)/8);const s=mesh(g,new THREE.ConeGeometry(.13,.38,5),horn,p.x,p.y+.29,p.z);s.rotation.z=.12;}
 // Wound on left shoulder, subdued but visible.
 const bruise=sphere(g,.34,cx-.92,1.58,cz+.62,wound,2);bruise.scale.set(1.45,.16,.72);
 // Source detail: earthquake rubble pins and wounds the wyrmling, constraining
 // her breathing and making the encounter read as rescue rather than boss fight.
 for(const [x,y,z,s] of [[-1.05,1.72,-.25,.72],[-1.45,1.42,-.65,.58],[-.55,1.90,-1.0,.50]]){
  const rock=mesh(g,new THREE.DodecahedronGeometry(s,0),M(0x55534d),cx+x,y,cz+z);rock.scale.set(1.35,.75,1.10);rock.rotation.set(.3,.5,.2);
 } // Two darkmantles remain secondary silhouettes overhead.
 for(const x of [-4.4,4.8]){
  sphere(g,.45,x,4.15,-3.2,DARK,2);
  for(let i=0;i<4;i++)segment(g,[x,4.0,-3.2],[x+(i-1.5)*.52,2.95,-2.45],.06,DARK);
 }
 // Small brass reflections / treasure scraps support color without turning it into a hoard.
 for(let i=0;i<13;i++){
  const x=(rand(i+440)-.5)*10,z=(rand(i+460)-.5)*6-1.4;
  const coin=sphere(g,.055,x,.07,z,BRASS,1);coin.scale.set(1.5,.25,1.0);
 }
 const pulse=[torch(g,-9.5,-5.6,0xff9f4d),torch(g,9.5,-4.8,0xffc873)];
 return {camera:new V(-1.0,6.4,17.2),target:new V(cx,1.45,cz+1.55),pulse};
}
function makeShrine(g){const w=23,d=14;floor(g,w,d);masonry(g,w,d,3.9);
 const altar=box(g,5.1,1.2,3.3,0,.6,-1.4,M(0x69685e));
 for(let i=0;i<6;i++)box(g,.58,1.85,.65,-8.4+i*3.36,.92,-5.3,M(0x504e49));
 const metal=M(0xb8a15f,.34,{metalness:.72}),ghost=M(0x8c7cd0,.24,{emissive:0x423075,emissiveIntensity:.6});
 const center=sphere(g,.50,0,2.68,-1.4,ghost,2);const arcs=[];
 for(let j=0;j<4;j++){
  const o=ring(g,1.12+j*.32,.052,0,2.62,-1.4,metal);o.rotation.x=(j+1)*.37;o.rotation.y=j*1.1;arcs.push(o);
 }
 // The broken Orrery of the Wanderer: broken radial braces and missing planets.
 for(let k=0;k<5;k++){
  const a=k*1.42,rad=1.36+(k%3)*.22;
  segment(g,[0,2.62,-1.4],[Math.cos(a)*rad,2.65+Math.sin(a)*.65,-1.4+Math.sin(a)*rad*.5],.048,metal,8);
  if(k!==2)sphere(g,.15+rand(k+13)*.11,Math.cos(a)*rad,2.65+Math.sin(a)*.65,-1.4+Math.sin(a)*rad*.5,metal,2);
 }
 for(let k=0;k<4;k++)box(g,.33,.11,.24,-1.8+k*1.16,1.30,-.2+k%2*.18,M(0x4c453d));
 for(let i=0;i<10;i++){const x=(rand(i+300)-.5)*9,z=(rand(i+340)-.5)*5;
  const o=sphere(g,.1,x,.16,z,ghost);o.scale.y=.44;
 }
 // Source-visible story props: Caerhan's body, Sergeant Teeshe resting in
 // the southwest corner, and the damaged entropy guardian above the altar.
 const cloth=M(0x31475c),skin=M(0x8b6c56),dwarf=M(0x55402e),guardian=M(0x7b705d,.55,{metalness:.45});
 // Teeshe: player-facing silhouette only; no possession cue.
 sphere(g,.18,-7.7,1.58,4.8,skin,1);box(g,.52,1.05,.34,-7.7,.88,4.8,cloth);
 // Caerhan: fallen dwarf near the altar.
 const body=box(g,1.05,.28,.44,-1.8,.18,-.85,dwarf);body.rotation.y=.45;sphere(g,.19,-2.30,.25,-.58,skin,1);
 // Gearwork maul/entropy guardian suspended over altar.
 const hub=sphere(g,.42,0,3.42,-1.4,guardian,2);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;segment(g,[0,3.42,-1.4],[Math.cos(a)*2.15,3.15,-1.4+Math.sin(a)*2.15],.10,guardian,8);}
 box(g,.72,.34,.34,2.38,3.10,-1.4,guardian); const pulse=[torch(g,-9,2,0xa891fa),torch(g,9,2,0xffb66c)];return {camera:new V(-.3,8.0,15.6),target:new V(0,1.28,-1),pulse,arcs};}
const BUILDERS={trials:makeTrials,traps:makeTraps,death:makeDeath,goblin:makeGoblin,stomp:makeStomp,tentacle:makeTentacle,dragon:makeDragon,shrine:makeShrine};
export function createCinematicRoom(world,room){
 const root=new THREE.Group();root.name='Episode 1 / '+room;world.scene.add(root);
 const build=BUILDERS[room];if(!build)throw Error('No cinematic room: '+room);
 const config=build(root),save={background:world.scene.background.clone(),fog:world.scene.fog,ambient:world.ambient.intensity,sun:world.sun.intensity,fill:world.fill.intensity,fov:world.camera.fov};
 world.worldRoot.visible=false;world.gridRoot.visible=false;world.orbit.enabled=false;world.lantern.visible=false;
 world.scene.background=new THREE.Color('#121615');world.scene.fog=new THREE.FogExp2('#111713',.010);
 // Practical, motivated cinematic lighting: a low-intensity rim from the
 // room's deepest edge separates the focal subject from the cave silhouette.
 // These lights belong to the disposable room group, never to the base map.
 const hues={trials:0x809adf,traps:0xb3b6ba,death:0x79a9cf,goblin:0xe0a15b,
  stomp:0x8aa4b3,tentacle:0x60bc9b,dragon:0xf4ba6e,shrine:0xa79af7};
 const rim=new THREE.PointLight(hues[room]||0xb2b2ae,7,24,2);
 rim.position.set(config.target.x+3.2,4.6,config.target.z-5.4);root.add(rim);
 world.ambient.intensity=1.12;world.sun.intensity=1.72;world.fill.intensity=.58;
 world.camera.fov=51;world.camera.updateProjectionMatrix();
 // A director's establishing-to-reveal dolly. It begins farther back and
 // higher, then takes ~4.5 seconds to settle on the room's focal point.
 // The motion is time based, so screenshots and TV frames agree regardless
 // of display refresh rate. A tiny post-reveal drift avoids a frozen frame.
 const clock=new THREE.Clock(),opening=new V(config.camera.x-.9,config.camera.y+1.65,config.camera.z+3.2);
 const startLook=config.target.clone().add(new V(-.8,-.4,-1.4));
 let elapsed=0,stopped=false;
 function tick(){
  if(stopped)return;
  elapsed+=Math.min(clock.getDelta(),.08);
  const reveal=Math.min(1,elapsed/4.5),smooth=reveal*reveal*(3-2*reveal);
  const t=Math.max(0,elapsed-4.5)*.13;
  world.camera.position.copy(opening).lerp(config.camera,smooth);
  world.camera.position.x+=Math.sin(t)*.48*smooth;
  world.camera.position.y+=Math.sin(t*.7)*.09*smooth;
  world.camera.position.z+=Math.cos(t)*.40*smooth;
  const aim=startLook.clone().lerp(config.target,smooth);
  aim.x+=Math.sin(t*.6)*.09*smooth;
  world.camera.lookAt(aim);
  for(let i=0;i<config.pulse.length;i++){
   const light=config.pulse[i];
   light.intensity=(11+Math.sin(elapsed*1.27+i*.8)*1.2);
  }
  rim.intensity=6.4+Math.sin(elapsed*.55)*.55;
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