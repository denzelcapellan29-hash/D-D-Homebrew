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
  return {x:p.x,z:p.z,r:1.34,depth:feet/5,halfW:4.5,halfH:3.6,
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
  const roofRand=n=>{const v=Math.sin(n*197.91+41.75)*48153.39;return v-Math.floor(v);};
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

  // The opening must read as depth from the warehouse, not as a pale floor patch.
  // Place a dark polygon just below the broken floor, matching the exact rupture
  // silhouette, then ring it with a short fractured inner wall.
  const mouthShape=new THREE.Shape();
  rupture.forEach(([x,z],i)=>{if(i===0)mouthShape.moveTo(x,z);else mouthShape.lineTo(x,z);});mouthShape.closePath();
  const mouthMat=new THREE.MeshBasicMaterial({color:0x05080a,transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide});
  const mouth=new THREE.Mesh(new THREE.ShapeGeometry(mouthShape),mouthMat);
  mouth.name='Deep black fissure mouth';mouth.rotation.x=-Math.PI/2;
  mouth.position.set(c.x,c.depth-.32,c.z);upper.add(mouth);
  const lipVerts=[];
  for(let i=0;i<rupture.length;i++){
    const a=rupture[i],b=rupture[(i+1)%rupture.length],dropA=.42+.10*Math.sin(i*1.7),dropB=.42+.10*Math.sin((i+1)*1.7);
    const qa=[a[0],-.02,a[1]],qb=[b[0],-.02,b[1]],qc=[b[0]*.92,-dropB,b[1]*.92],qd=[a[0]*.92,-dropA,a[1]*.92];
    for(const q of [qa,qb,qc,qa,qc,qd])lipVerts.push(q[0]+c.x,q[1]+c.depth-.12,q[2]+c.z);
  }
  const lipGeo=new THREE.BufferGeometry();lipGeo.setAttribute('position',new THREE.Float32BufferAttribute(lipVerts,3));lipGeo.computeVertexNormals();
  const lipMat=new THREE.MeshStandardMaterial({color:0x3c3934,roughness:1,side:THREE.DoubleSide});
  const innerLip=new THREE.Mesh(lipGeo,lipMat);innerLip.name='Fractured inner fissure wall';innerLip.castShadow=true;innerLip.receiveShadow=true;upper.add(innerLip);

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
  const scorch=new THREE.MeshBasicMaterial({color:0x171513,transparent:true,opacity:.55,depthWrite:false});
  const scorchBranch=(angle,length)=>{
    const geo=new THREE.PlaneGeometry(.07,length);
    const m=new THREE.Mesh(geo,scorch);m.rotation.x=-Math.PI/2;m.rotation.z=-angle;
    m.position.set(c.x+Math.cos(angle)*(c.r+length*.5),c.depth+.028,c.z+Math.sin(angle)*(c.r+length*.5));
    m.name='Scorched fracture branch';upper.add(m);
  };
  scorchBranch(.72,1.15);scorchBranch(-2.18,.92);scorchBranch(2.92,.72);

  // Slumped floor plates make the failure read as structural collapse rather
  // than a decorative aperture.
  for(let i=0;i<4;i++){
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
  const abyssGlow=new THREE.PointLight(0x415866,3.6,9,2);
  abyssGlow.position.set(c.x,c.depth*.18,c.z);shaft.add(abyssGlow);
  const landingGeo=new THREE.CircleGeometry(c.r*1.03,15);
  const landing=new THREE.Mesh(landingGeo,stone);
  landing.rotation.x=-Math.PI/2;landing.rotation.z=.17;landing.scale.set(1.0,.78,1);
  landing.position.set(c.x,.012,c.z);landing.name='Rough rope landing at Area 1';landing.receiveShadow=true;root.add(landing);
  const entranceFloor=box(root,'Natural west-wall fissure floor',(c.x+c.landing.x)/2,.012,c.z,c.landing.x-c.x+.72,.03,1.02,stone);
  entranceFloor.rotation.y=.02;
  // Player-facing Area 1 cutaway needs a readable west-wall fissure without
  // adding freestanding "rock props". A dark irregular crevice sits in the wall
  // and the local rope tail emerges from it.
  const entranceMouthMat=new THREE.MeshBasicMaterial({color:0x090c0c,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false});
  const entranceMouth=new THREE.Mesh(new THREE.CircleGeometry(.72,11),entranceMouthMat);
  entranceMouth.position.set(c.x+.10,1.26,c.z);entranceMouth.rotation.y=Math.PI/2;entranceMouth.scale.set(1,.82,1.28);
  entranceMouth.name='Dark west-wall fissure mouth';root.add(entranceMouth);
  // Rope remains visible in both level views and reaches the cave floor.
  const anchor={x:c.x-.52,z:c.z-.32};
  const beam=box(upper,'Rope anchor beam',c.x-.62,c.depth+.17,c.z-1.05,2.3,.24,.25,darkWood);
  beam.rotation.y=.36;
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(c.x-.62,c.depth+.30,c.z-1.05),
    new THREE.Vector3(anchor.x,c.depth+.10,anchor.z),
    new THREE.Vector3(anchor.x+.07,c.depth*.48,anchor.z+.06),
    new THREE.Vector3(anchor.x,.13,anchor.z)]);
  const ropeMat=new THREE.MeshStandardMaterial({color:0xc7a974,roughness:1});
  const rope=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.032,7,false),ropeMat);
  rope.name='Continuous rope inside the fissure';shaft.add(rope);
  // In Area 1 cutaway view, show only the final hanging section below the cave
  // ceiling. This prevents the rope from appearing to descend from empty sky.
  const area1Rope=new THREE.Group();area1Rope.name='Area 1 visible rope tail';area1Rope.visible=false;root.add(area1Rope);
  const tailCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(anchor.x+.04,1.78,anchor.z+.03),
    new THREE.Vector3(anchor.x+.08,1.08,anchor.z+.06),
    new THREE.Vector3(anchor.x,.13,anchor.z)
  ]);
  const tail=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,36,.032,7,false),ropeMat);tail.name='Rope hanging from cave ceiling';area1Rope.add(tail);
  const coil=new THREE.Mesh(new THREE.TorusGeometry(.17,.025,6,28),ropeMat);
  coil.rotation.x=Math.PI/2;coil.position.set(anchor.x,.05,anchor.z);coil.name='Rope coil at landing';area1Rope.add(coil);
  // Splintered floor structure around the tear; wood, not a decorative ring
  // of rocks, is the dominant edge language inside the warehouse.
  for(let i=0;i<4;i++){
    const idx=(i*3)%rupture.length,[rx,rz]=rupture[idx],a=Math.atan2(rz,rx);
    const plank=box(upper,'Splintered rupture joist',c.x+rx*1.03,c.depth+.015,c.z+rz*1.03,.10,.08,.46+(i%3)*.13,darkWood);
    plank.rotation.y=-a+(i%2?.18:-.14);plank.rotation.z=(i%3-1)*.055;
  }
  // Broken masonry perimeter, roof supports and remains of a red tile roof.
  for(const side of [-1,1]){
    box(upper,'Warehouse side masonry',c.x+side*c.halfW,c.depth+.78,c.z,.26,1.56,c.halfH*2,wallStone);
    box(upper,'Standing timber post',c.x+side*3.8,c.depth+1.9,c.z-2.8,.23,3.8,.23,darkWood);
  }
  box(upper,'Warehouse back wall',c.x,c.depth+.88,c.z-c.halfH,c.halfW*2,1.76,.26,wallStone);
  // Exposed half-timber framing gives the surviving masonry believable
  // warehouse structure and breaks up the flat cutaway-wall read.
  for(const side of [-1,1]){
    const wallX=c.x+side*(c.halfW-.15);
    box(upper,'Warehouse side timber rail',wallX,c.depth+1.18,c.z,.13,.13,c.halfH*2-.7,darkWood);
    for(const zOff of [-2.25,0,2.25]){
      box(upper,'Warehouse side timber stud',wallX,c.depth+.92,c.z+zOff,.15,1.72,.16,darkWood);
    }
  }
  for(const xOff of [-3.15,0,3.15]){
    box(upper,'Warehouse back timber stud',c.x+xOff,c.depth+.94,c.z-c.halfH+.15,.15,1.70,.15,darkWood);
  }
  box(upper,'Warehouse back timber rail',c.x,c.depth+1.26,c.z-c.halfH+.15,c.halfW*2-.55,.14,.16,darkWood);
  for(const side of [-1,1]){
    const brace=box(upper,'Warehouse back diagonal brace',c.x+side*1.65,c.depth+.92,c.z-c.halfH+.16,2.55,.13,.14,darkWood);
    brace.rotation.z=side*.46;
  }
  // Broken front-corner returns frame the ruin from the hero camera. The
  // center stays open as the damaged entrance, but the building no longer
  // reads as a roof perched over a three-sided stage.
  for(const side of [-1,1]){
    box(upper,'Broken warehouse front wall',c.x+side*3.82,c.depth+.28,c.z+c.halfH-.04,1.24,.56,.28,wallStone);
    const post=box(upper,'Splintered front corner post',c.x+side*4.22,c.depth+.69,c.z+c.halfH-.12,.20,1.38,.20,darkWood);
    post.rotation.z=side*.06;
  }
  box(upper,'Exposed roof crossbeam',c.x,c.depth+3.65,c.z-2.8,8.1,.22,.25,darkWood);
  // Mostly-collapsed roof: exposed timber trusses dominate, with only a few
  // coherent tile sections still hanging from the rear gable. This reads as a
  // ruined warehouse rather than a collection of floating roof strips.
  const pitch=.42;
  for(const side of [-1,1]){
    for(const z of [-2.85,-1.45,-.15]){
      const beam=box(upper,'Exposed sloping timber rafter',c.x+side*1.95,c.depth+3.18,c.z+z,4.15,.15,.17,darkWood);
      beam.rotation.z=-side*pitch;
    }
    const rear=box(upper,'Surviving rear roof section',c.x+side*1.78,c.depth+3.34,c.z-2.35,3.55,.085,1.55,roofTiles.clone());
    rear.rotation.z=-side*pitch;
    if(side<0){
      const torn=box(upper,'Hanging broken roof section',c.x-2.35,c.depth+3.02,c.z-.55,1.65,.08,.95,roofTiles.clone());
      torn.rotation.z=pitch;torn.rotation.y=-.08;
    }
  }
  box(upper,'Weathered ridge beam',c.x,c.depth+3.96,c.z-2.18,.25,.27,3.55,darkWood);
  // One snapped rafter leans into the collapse, visually tying roof failure to
  // the floor rupture.
  const snapped=box(upper,'Snapped roof rafter',c.x+1.35,c.depth+1.95,c.z-.25,.18,3.15,.18,darkWood);
  snapped.rotation.z=.48;snapped.rotation.y=-.24;
  // A few masonry chunks sit where walls failed; keep the center readable.
  for(let i=0;i<5;i++){
    const angle=i*1.31+.42,rad=1.75+(i%2)*.32;
    const x=c.x+Math.cos(angle)*rad,z=c.z+Math.sin(angle)*rad;
    const r=.13+(i%2)*.07;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),wallStone);
    rock.position.set(x,c.depth+.06+r*.18,z);rock.rotation.set(angle,.3*i,.15);
    rock.scale.set(1.4,.5,.95);rock.name='Collapsed masonry fragment';upper.add(rock);
  }
  for(let i=0;i<4;i++){
    const side=i<2?-1:1;
    const x=c.x+side*(2.25+roofRand(i+6)*1.0),z=c.z+.55+(i%2)*1.0;
    const debris=box(upper,'Shattered floorboard',x,c.depth+.11,z,.14,.08,.82+roofRand(i+66)*.45,darkWood);
    debris.rotation.y=.35+i*1.17;
    debris.rotation.x=(roofRand(i+46)-.5)*.12;
  }
  for(let i=0;i<5;i++){
    const x=c.x-3.3+(i%2)*.9,z=c.z-2.5+Math.floor(i/2)*.65;
    box(upper,'Warehouse crate',x,c.depth+.32,z,.6,.64,.6,wood);
    box(upper,'Crate iron strap',x,c.depth+.65,z,.63,.04,.04,iron);
  }
  for(let i=0;i<4;i++){
    const plank=box(upper,'Fallen timber',c.x+2.05+(i%2)*.58,c.depth+.07,c.z+.92+Math.floor(i/2)*.62,.15,.09,.9,darkWood);
    plank.rotation.y=.45+i*.87;
  }
  const foundationMat=new THREE.MeshStandardMaterial({color:0x454842,roughness:1});
  // Continuous stone substructure beneath the warehouse footprint, cut around
  // the same magical rupture. This removes the remaining "floating stage" read
  // while preserving the open chasm.
  const baseShape=new THREE.Shape();
  baseShape.moveTo(-c.halfW-.22,-c.halfH-.22);baseShape.lineTo(c.halfW+.22,-c.halfH-.22);
  baseShape.lineTo(c.halfW+.22,c.halfH+.22);baseShape.lineTo(-c.halfW-.22,c.halfH+.22);baseShape.closePath();
  const baseHole=new THREE.Path();
  rupture.forEach(([x,z],i)=>{const s=1.08;if(i===0)baseHole.moveTo(x*s,z*s);else baseHole.lineTo(x*s,z*s);});
  baseHole.closePath();baseShape.holes.push(baseHole);
  const base=new THREE.Mesh(new THREE.ExtrudeGeometry(baseShape,{depth:.34,bevelEnabled:false}),foundationMat);
  base.name='Warehouse continuous stone substructure';base.rotation.x=-Math.PI/2;
  base.position.set(c.x,c.depth-.46,c.z);base.castShadow=true;base.receiveShadow=true;upper.add(base);

  for(const side of [-1,1])box(upper,'Warehouse stone foundation side',c.x+side*(c.halfW+.12),c.depth-.27,c.z,.28,.46,c.halfH*2+.55,foundationMat);
  box(upper,'Warehouse stone foundation front',c.x,c.depth-.27,c.z+c.halfH+.12,c.halfW*2+.55,.46,.28,foundationMat);
  box(upper,'Warehouse stone foundation rear',c.x,c.depth-.27,c.z-c.halfH-.12,c.halfW*2+.55,.46,.28,foundationMat);

  // Waterdeep context: continuous cobbles and distant roofline masses. Keep
  // the context below the warehouse silhouette so it supports the shot instead
  // of competing with it.
  const streetShape=new THREE.Shape();
  const sw=12,sd=10.5;
  streetShape.moveTo(-sw,-sd);streetShape.lineTo(sw,-sd);streetShape.lineTo(sw,sd);streetShape.lineTo(-sw,sd);streetShape.closePath();
  const warehouseVoid=new THREE.Path();
  const wx=c.halfW+.42,wz=c.halfH+.42,streetOffsetZ=3.9;
  // ShapeGeometry is later rotated -90deg around X, so local +Y maps to world -Z.
  // The warehouse is streetOffsetZ behind the street mesh origin.
  const localWarehouseZ=streetOffsetZ;
  warehouseVoid.moveTo(-wx,localWarehouseZ-wz);warehouseVoid.lineTo(-wx,localWarehouseZ+wz);
  warehouseVoid.lineTo(wx,localWarehouseZ+wz);warehouseVoid.lineTo(wx,localWarehouseZ-wz);warehouseVoid.closePath();
  streetShape.holes.push(warehouseVoid);
  const street=new THREE.Mesh(new THREE.ShapeGeometry(streetShape),cobbles);
  street.name='Waterdeep cobbled street around warehouse';street.rotation.x=-Math.PI/2;
  street.position.set(c.x,c.depth-.205,c.z+streetOffsetZ);street.receiveShadow=true;upper.add(street);
  const plaster=new THREE.MeshStandardMaterial({color:0x4d4b47,roughness:1});
  const roofDark=new THREE.MeshStandardMaterial({color:0x342c29,roughness:1});
  const windowMat=new THREE.MeshStandardMaterial({color:0x9d7948,emissive:0x8a5624,emissiveIntensity:.32,roughness:.72});
  for(let k=0;k<5;k++){
    const x=c.x-7.6+k*3.8,z=c.z-11.7-(k%2)*.35,h=1.8+(k%3)*.35;
    box(upper,'Distant Waterdeep facade',x,c.depth+h*.5,z,3.2,h,1.0,plaster);
    // Paired sloped roof planes make the skyline read as a lived-in medieval
    // district while staying deliberately low-detail in the background.
    const left=box(upper,'Distant Waterdeep pitched roof',x-.74,c.depth+h+.48,z,1.85,.10,1.45,roofDark);
    left.rotation.z=-.36;
    const right=box(upper,'Distant Waterdeep pitched roof',x+.74,c.depth+h+.48,z,1.85,.10,1.45,roofDark);
    right.rotation.z=.36;
    if(k%2===0){
      for(const wx of [-.7,.7])box(upper,'Distant warm window',x+wx,c.depth+h*.56,z+.515,.32,.44,.025,windowMat);
    }
  }
  // Low side fragments close the street edges without becoming foreground boxes.
  for(const side of [-1,1]){
    box(upper,'Ruined neighboring wall',c.x+side*7.0,c.depth+.34,c.z+4.0,1.25,.72,8.0,wallStone);
  }

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
  return {root,upper,shaft,area1Rope,anchor};
}