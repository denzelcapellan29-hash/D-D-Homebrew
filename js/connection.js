import * as THREE from 'three';
import {stoneMaterial,woodMaterial} from './surfaces.js';

const RUPTURE_POINTS=[
  [-1.55,-.56],[-.92,-1.02],[-.18,-.82],[.55,-1.18],[1.48,-.78],
  [1.12,-.18],[1.72,.27],[.78,.48],[1.12,1.08],[.18,.82],
  [-.58,1.24],[-.72,.54],[-1.58,.24],[-1.12,-.15]
];
function pointInRupture(c,x,z,pad=.10){
  const px=(x-c.x)/c.r,pz=(z-c.z)/c.r;let inside=false;
  for(let i=0,j=RUPTURE_POINTS.length-1;i<RUPTURE_POINTS.length;j=i++){
    const [xi,zi]=RUPTURE_POINTS[i],[xj,zj]=RUPTURE_POINTS[j];
    const hit=((zi>pz)!=(zj>pz))&&(px<(xj-xi)*(pz-zi)/(zj-zi+1e-9)+xi);
    if(hit)inside=!inside;
  }
  if(inside)return true;
  // Small safety margin around the visibly broken edge.
  for(const [rx,rz] of RUPTURE_POINTS)if(Math.hypot(px-rx,pz-rz)<pad)return true;
  return false;
}

// Hand-authored connection, grounded in the west-wall fissure on the reference.
// One world unit = one 5-foot square. Depth is a user-adjustable assumption.
export function connectionLayout(world, feet=60) {
  const p=world.mapToWorld(.273,.405);
  return {x:p.x,z:p.z,r:1.05,depth:feet/5,halfW:4.5,halfH:3.6,
    landing:world.mapToWorld(.363,.405)};
}
export function inShaft(c,x,z,margin=0) {
  return Math.hypot(x-c.x,z-c.z)<c.r+margin;
}
export function inLanding(c,x,z) {
  return inShaft(c,x,z) || (x>=c.x && x<=c.landing.x+.45 && Math.abs(z-c.z)<.55);
}
export function inWarehouse(c,x,z) {
  return Math.abs(x-c.x)<c.halfW && Math.abs(z-c.z)<c.halfH && !pointInRupture(c,x,z,.16);
}
export function buildConnection(world,c) {
  const root=new THREE.Group();root.name='Warehouse fissure connection';
  const upper=new THREE.Group();upper.name='Ruined warehouse upper level';root.add(upper);
  const shaft=new THREE.Group();shaft.name='Vertical fissure cutaway';root.add(shaft);
  const stone=stoneMaterial(world.surfaces);
  const wood=woodMaterial(world.surfaces);
  const darkWood=woodMaterial(world.surfaces,{color:0x65452e});
  const iron=new THREE.MeshStandardMaterial({color:0x262a2a,metalness:.45,roughness:.7});
  function box(parent,name,x,y,z,w,h,d,material) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function repeatedSurface(base,color,rx,ry){
    const mat=base.clone();mat.color.setHex(color);mat.roughness=1;
    if(mat.map){mat.map=mat.map.clone();mat.map.needsUpdate=true;mat.map.wrapS=mat.map.wrapT=THREE.RepeatWrapping;mat.map.repeat.set(rx,ry);mat.map.userData.shared=false;}
    if(mat.normalMap){mat.normalMap=mat.normalMap.clone();mat.normalMap.needsUpdate=true;mat.normalMap.wrapS=mat.normalMap.wrapT=THREE.RepeatWrapping;mat.normalMap.repeat.set(rx,ry);mat.normalMap.userData.shared=false;}
    return mat;
  }
  function canvasMaterial(kind){
    const can=document.createElement('canvas');can.width=256;can.height=256;const g=can.getContext('2d');
    if(kind==='cobbles'){
      g.fillStyle='#5d5a53';g.fillRect(0,0,256,256);
      for(let row=0;row<9;row++)for(let col=-1;col<9;col++){
        const w=36+(row+col)%3*4,h=24+(col%2)*3,x=col*34+(row%2)*17,y=row*29;
        g.fillStyle=['#777168','#68645e','#81786d','#5e5b56'][(row*7+col*3+20)%4];
        g.fillRect(x+2,y+2,w-4,h-4);g.strokeStyle='#3d3b37';g.lineWidth=2;g.strokeRect(x+2,y+2,w-4,h-4);
      }
    }else{
      g.fillStyle='#7a3829';g.fillRect(0,0,256,256);
      for(let row=0;row<10;row++)for(let col=-1;col<9;col++){
        const x=col*34+(row%2)*17,y=row*27;
        g.fillStyle=['#9f4b32','#7c3729','#b05a3a','#6d3227'][(row*5+col+16)%4];
        g.fillRect(x+2,y+2,32,24);g.strokeStyle='#4f261f';g.lineWidth=2;g.strokeRect(x+2,y+2,32,24);
      }
    }
    const tex=new THREE.CanvasTexture(can);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(kind==='cobbles'?6:3,kind==='cobbles'?6:4);
    tex.anisotropy=Math.min(8,world.renderer.capabilities.getMaxAnisotropy());
    return new THREE.MeshStandardMaterial({map:tex,color:0xffffff,roughness:1,side:THREE.DoubleSide});
  }
  const wallStone=repeatedSurface(stone,0x8a8176,5,4);
  const floorWood=repeatedSurface(wood,0x806044,5,5);
  const cobbles=canvasMaterial('cobbles');
  const roofTiles=canvasMaterial('tiles');
  // Catastrophic artifact rupture: deliberately asymmetrical and torn rather than
  // a circular engineered shaft. The playable rope opening remains compact, but
  // the visible break has lobes and branch fractures that shear the floor outward.
  const shape=new THREE.Shape();
  shape.moveTo(-c.halfW,-c.halfH);shape.lineTo(c.halfW,-c.halfH);
  shape.lineTo(c.halfW,c.halfH);shape.lineTo(-c.halfW,c.halfH);shape.closePath();
  const hole=new THREE.Path();
  const rupture=RUPTURE_POINTS.map(([x,z])=>[x*c.r,z*c.r]);
  rupture.forEach(([x,z],i)=>{if(i===0)hole.moveTo(x,z);else hole.lineTo(x,z);});
  hole.closePath();shape.holes.push(hole);
  const floor=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false}),floorWood);
  floor.name='Warehouse floor torn open by magical rupture';floor.rotation.x=-Math.PI/2;
  floor.position.set(c.x,c.depth-.12,c.z);floor.receiveShadow=true;upper.add(floor);

  // Plank seams stop at a deliberately generous rupture envelope so no clean
  // circular pattern survives around the opening.
  for(let z=-c.halfH+.22;z<c.halfH;z+=.38){
    const local=z;
    const envelope=c.r*(1.30+.10*Math.sin(local*4.2));
    const gap=Math.abs(local)<envelope?Math.sqrt(Math.max(0,envelope**2-local*local)):0;
    if(gap){
      for(const sign of [-1,1])box(upper,'Interrupted floor seam',c.x+sign*(c.halfW+gap)/2,c.depth+.008,c.z+z,c.halfW-gap,.01,.018,darkWood);
    }else box(upper,'Plank seam',c.x,c.depth+.008,c.z+z,c.halfW*2,.01,.018,darkWood);
  }

  // Branching artifact fractures: dark glassy seams with restrained arcane
  // emission, widening toward the central rupture.
  const arcane=new THREE.MeshStandardMaterial({color:0x292728,roughness:.88,metalness:.05,
    emissive:0x263642,emissiveIntensity:.18});
  const fracture=(angle,length,width,offset=0)=>{
    for(let j=0;j<4;j++){
      const t=(j+.5)/4,seg=length/4;
      const bend=Math.sin((j+offset)*1.8)*.16;
      const x=c.x+Math.cos(angle+bend)*(c.r*.72+t*length);
      const z=c.z+Math.sin(angle+bend)*(c.r*.72+t*length);
      const crack=box(upper,'Arcane fracture',x,c.depth+.022,z,width*(1-t*.58),.018,seg,arcane);
      crack.rotation.y=-angle-bend;
    }
  };
  fracture(.18,1.85,.075,1);fracture(2.58,1.30,.065,2);fracture(-1.54,1.05,.06,3);

  // Slumped floor plates make the failure read as structural collapse rather
  // than a decorative aperture.
  for(let i=0;i<7;i++){
    const a=i/11*Math.PI*2+.17,rad=c.r*(1.05+(i%3)*.10);
    const slab=box(upper,'Dropped warehouse floor slab',c.x+Math.cos(a)*rad,c.depth-.03-(i%4)*.05,
      c.z+Math.sin(a)*rad,.55+(i%3)*.18,.08,.42+(i%2)*.20,wood);
    slab.rotation.y=-a+(i%2?.2:-.13);slab.rotation.z=(i%2?1:-1)*(.08+(i%3)*.035);
  }
  // Continuous jagged chasm walls follow the same rupture silhouette as the
  // broken floor. This reads as torn geology rather than a ring of boulders.
  const shaftVerts=[],shaftCols=[];
  const bands=[
    {y:c.depth-.12,s:1.00},
    {y:c.depth*.73,s:.94},
    {y:c.depth*.43,s:.90},
    {y:.14,s:.86}
  ];
  for(let b=0;b<bands.length-1;b++){
    const aBand=bands[b],bBand=bands[b+1];
    for(let i=0;i<rupture.length;i++){
      const p1=rupture[i],p2=rupture[(i+1)%rupture.length];
      const midX=(p1[0]+p2[0])*.5;
      if(b===bands.length-2 && midX>c.r*.72)continue; // Area 1 opening
      const pts=[
        [p1[0]*aBand.s,aBand.y,p1[1]*aBand.s],
        [p2[0]*aBand.s,aBand.y,p2[1]*aBand.s],
        [p2[0]*bBand.s,bBand.y,p2[1]*bBand.s],
        [p1[0]*bBand.s,bBand.y,p1[1]*bBand.s]
      ];
      const tris=[0,1,2,0,2,3];
      for(const idx of tris){
        const q=pts[idx];shaftVerts.push(c.x+q[0],q[1],c.z+q[2]);
        const t=q[1]/Math.max(c.depth,1);shaftCols.push(.16+.16*t,.17+.14*t,.16+.12*t);
      }
    }
  }
  const shaftGeo=new THREE.BufferGeometry();
  shaftGeo.setAttribute('position',new THREE.Float32BufferAttribute(shaftVerts,3));
  shaftGeo.setAttribute('color',new THREE.Float32BufferAttribute(shaftCols,3));
  shaftGeo.computeVertexNormals();
  const shaftWall=new THREE.Mesh(shaftGeo,new THREE.MeshStandardMaterial({color:0x6b665d,vertexColors:true,roughness:1,side:THREE.DoubleSide,flatShading:true}));
  shaftWall.name='Artifact-torn chasm walls';shaftWall.castShadow=true;shaftWall.receiveShadow=true;shaft.add(shaftWall);
  const abyssGlow=new THREE.PointLight(0x425c6c,5.5,10,2);
  abyssGlow.position.set(c.x,c.depth*.18,c.z);shaft.add(abyssGlow);
  const landing=new THREE.Mesh(new THREE.CircleGeometry(c.r,40),stone);
  landing.rotation.x=-Math.PI/2;landing.position.set(c.x,.012,c.z);
  landing.name='Rope landing at Area 1';landing.receiveShadow=true;root.add(landing);
  box(root,'West-wall entrance floor', (c.x+c.landing.x)/2,.015,c.z,c.landing.x-c.x+.8,.035,1.10,stone);
  for(const side of [-1,1])box(root,'Fissure entrance jamb',(c.x+c.landing.x)/2,world.rockHeight/2,c.z+side*.67,c.landing.x-c.x+.4,world.rockHeight,.22,stone);
  // Rope remains visible in both level views and reaches the cave floor.
  const anchor={x:c.x-.52,z:c.z-.32};
  const beam=box(upper,'Rope anchor beam',c.x-.62,c.depth+.17,c.z-1.05,2.3,.24,.25,darkWood);
  beam.rotation.y=.36;
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(c.x-.62,c.depth+.30,c.z-1.05),
    new THREE.Vector3(anchor.x,c.depth+.10,anchor.z),
    new THREE.Vector3(anchor.x+.07,c.depth*.48,anchor.z+.06),
    new THREE.Vector3(anchor.x,.13,anchor.z)]);
  const rope=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.032,7,false),new THREE.MeshStandardMaterial({color:0xc7a974,roughness:1}));
  rope.name='Continuous rope from warehouse to Area 1';root.add(rope);
  const coil=new THREE.Mesh(new THREE.TorusGeometry(.17,.025,6,28),rope.material);
  coil.rotation.x=Math.PI/2;coil.position.set(anchor.x,.05,anchor.z);coil.name='Rope coil at landing';root.add(coil);
  // Splintered floor structure around the tear; wood, not a decorative ring
  // of rocks, is the dominant edge language inside the warehouse.
  for(let i=0;i<12;i++){
    const [rx,rz]=rupture[i%rupture.length],a=Math.atan2(rz,rx);
    const plank=box(upper,'Splintered rupture joist',c.x+rx*.92,c.depth+.02,c.z+rz*.92,.11,.09,.58+(i%4)*.17,darkWood);
    plank.rotation.y=-a+(i%2?.24:-.18);plank.rotation.z=(i%3-1)*.07;
  }
  // Broken masonry perimeter, roof supports and remains of a red tile roof.
  for(const side of [-1,1]){
    box(upper,'Warehouse side masonry',c.x+side*c.halfW,c.depth+.78,c.z,.26,1.56,c.halfH*2,wallStone);
    box(upper,'Standing timber post',c.x+side*3.8,c.depth+1.9,c.z-2.8,.23,3.8,.23,darkWood);
  }
  box(upper,'Warehouse back wall',c.x,c.depth+1.0,c.z-c.halfH,c.halfW*2,2,.26,wallStone);
  box(upper,'Exposed roof crossbeam',c.x,c.depth+3.65,c.z-2.8,8.1,.22,.25,darkWood);
  // Coherent broken gable roof: broad tile planes with missing chunks read
  // as architecture from the hero camera, while exposed rafters show collapse.
  const pitch=.42;
  for(const side of [-1,1]){
    for(const z of [-2.95,-1.7,-.55]){
      const beam=box(upper,'Exposed sloping timber rafter',c.x+side*2.0,c.depth+3.27,c.z+z,4.4,.16,.17,darkWood);
      beam.rotation.z=-side*pitch;
    }
    const panels=[
      {x:1.80,z:-2.95,w:3.25,d:1.15,y:3.42},
      {x:2.42,z:-1.58,w:2.05,d:1.28,y:3.18},
      {x:1.38,z:-.42,w:2.30,d:.82,y:3.58}
    ];
    for(const [j,p] of panels.entries()){
      const section=box(upper,'Broken red tile roof panel',c.x+side*p.x,c.depth+p.y,c.z+p.z,p.w,.075,p.d,roofTiles.clone());
      section.rotation.z=-side*pitch;section.rotation.y=(j-1)*.025*side;
    }
  }
  box(upper,'Weathered ridge beam',c.x,c.depth+4.03,c.z-2.12,.27,.30,3.9,darkWood);
  // A few masonry chunks sit where walls failed; keep the center readable.
  for(let i=0;i<5;i++){
    const angle=i*1.31+.42,rad=1.75+(i%2)*.32;
    const x=c.x+Math.cos(angle)*rad,z=c.z+Math.sin(angle)*rad;
    const r=.13+(i%2)*.07;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),wallStone);
    rock.position.set(x,c.depth+.06+r*.18,z);rock.rotation.set(angle,.3*i,.15);
    rock.scale.set(1.4,.5,.95);rock.name='Collapsed masonry fragment';upper.add(rock);
  }
  for(let i=0;i<9;i++){
    const x=c.x+(roofRand(i+6)-.5)*6.4,z=c.z+(roofRand(i+19)-.5)*4.6;
    if(inShaft(c,x,z,.19))continue;
    const debris=box(upper,'Shattered floorboard',x,c.depth+.16,z,.15,.09,.7+roofRand(i+66)*.8,darkWood);
    debris.rotation.y=roofRand(i+29)*Math.PI;
    debris.rotation.x=(roofRand(i+46)-.5)*.21;
  }
  for(let i=0;i<5;i++){
    const x=c.x-3.3+(i%2)*.9,z=c.z-2.5+Math.floor(i/2)*.65;
    box(upper,'Warehouse crate',x,c.depth+.32,z,.6,.64,.6,wood);
    box(upper,'Crate iron strap',x,c.depth+.65,z,.63,.04,.04,iron);
  }
  for(let i=0;i<7;i++){
    const plank=box(upper,'Fallen timber',c.x+1.65+(i%3)*.55,c.depth+.07,c.z+.7+Math.floor(i/3)*.55,.16,.1,1.1,darkWood);
    plank.rotation.y=i*.81;
  }
  // Waterdeep context: a believable cobbled apron and distant gabled
  // silhouettes. Nothing near the hero camera is allowed to read as a giant box.
  box(upper,'Waterdeep cobbled street',c.x,c.depth-.21,c.z+4.1,20,.30,16,cobbles);
  const plaster=new THREE.MeshStandardMaterial({color:0x70675d,roughness:1});
  const timber=new THREE.MeshStandardMaterial({color:0x3b2b22,roughness:1});
  function distantHouse(x,z,w,h,flip=1){
    const g=new THREE.Group();g.position.set(x,c.depth,z);upper.add(g);
    box(g,'Distant plaster facade',0,h*.5,0,w,h,.72,plaster);
    for(const sx of [-.34,.34])box(g,'Distant timber upright',sx*w, h*.52,.38,.09,h*.92,.08,timber);
    box(g,'Distant timber crossbar',0,h*.68,.38,w*.88,.08,.08,timber);
    const left=box(g,'Distant tiled roof',-w*.24,h+.34,0,w*.58,.08,1.25,roofTiles.clone());left.rotation.z=-.42*flip;
    const right=box(g,'Distant tiled roof',w*.24,h+.34,0,w*.58,.08,1.25,roofTiles.clone());right.rotation.z=.42*flip;
  }
  for(let k=0;k<6;k++)distantHouse(c.x-8.2+k*3.25,c.z-10.1-(k%2)*.5,2.45,2.7+(k%3)*.42,k%2?1:-1);
  // Restrained magical light and dusty haze from the rupture.
  const glow=new THREE.PointLight(0x4e7188,4.5,7,2);glow.position.set(c.x,c.depth-.55,c.z);upper.add(glow);
  for(let i=0;i<8;i++){
    const dustMat=new THREE.MeshBasicMaterial({color:0xb7aa96,transparent:true,opacity:.035+(i%3)*.01,depthWrite:false});
    const dust=new THREE.Mesh(new THREE.SphereGeometry(.09+(i%2)*.045,7,5),dustMat);
    dust.name='Rising rupture dust';dust.position.set(c.x+(roofRand(i+71)-.5)*1.6,c.depth+.10+(i%4)*.31,c.z+(roofRand(i+91)-.5)*1.3);
    dust.scale.set(.40,1.35,.40);upper.add(dust);
  }

  // Two battered caution barricades frame the entrance without cutting a
  // bright horizontal line across the first-person reveal.
  const yellow=new THREE.MeshStandardMaterial({color:0xc29b3f,roughness:.82});
  for(const side of [-1,1]){
    const bx=c.x+side*2.65;
    box(upper,'Barrier post',bx-side*.75,c.depth+.38,c.z+3.10,.07,.76,.07,iron);
    box(upper,'Barrier post',bx+side*.75,c.depth+.38,c.z+3.10,.07,.76,.07,iron);
    const rail=box(upper,'Broken caution barricade',bx,c.depth+.50,c.z+3.10,1.55,.06,.045,yellow);
    rail.rotation.z=side*.035;
  }
  // Warm stationary lanterns give the cave landing and warehouse distinct pools of light.
  const flameMaterial=new THREE.MeshStandardMaterial({color:0xffca78,emissive:0xff872b,emissiveIntensity:2});
  function lantern(parent,x,y,z){
    box(parent,'Lantern wall bracket',x,y-.12,z,.15,.08,.24,iron);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),flameMaterial);glow.position.set(x,y,z);glow.name='Lantern glow';parent.add(glow);
    const light=new THREE.PointLight(0xffb867,16,7,2);light.position.set(x,y+.1,z);parent.add(light);
    for(const dx of [-.13,.13])box(parent,'Lantern frame',x+dx,y,z,.025,.36,.025,iron);
  }
  lantern(root,c.landing.x-.08,1.15,c.z+.53);
  lantern(upper,c.x-2.7,c.depth+1.25,c.z-3.22);
  world.worldRoot.add(root);
  return {root,upper,shaft,anchor};
}