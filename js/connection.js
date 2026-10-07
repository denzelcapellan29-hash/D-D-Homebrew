import * as THREE from 'three';
import {stoneMaterial,woodMaterial} from './surfaces.js';

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
  return Math.abs(x-c.x)<c.halfW && Math.abs(z-c.z)<c.halfH && !inShaft(c,x,z,.15);
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
  // Catastrophic artifact rupture: deliberately asymmetrical and torn rather than
  // a circular engineered shaft. The playable rope opening remains compact, but
  // the visible break has lobes and branch fractures that shear the floor outward.
  const shape=new THREE.Shape();
  shape.moveTo(-c.halfW,-c.halfH);shape.lineTo(c.halfW,-c.halfH);
  shape.lineTo(c.halfW,c.halfH);shape.lineTo(-c.halfW,c.halfH);shape.closePath();
  const hole=new THREE.Path();
  const rupture=[];
  for(let i=0;i<52;i++){
    const a=-i/52*Math.PI*2;
    const lobe=.18*Math.sin(i*1.73)+.11*Math.sin(i*3.91)+.07*Math.sin(i*.61);
    const directional=.24*Math.max(0,Math.cos(a+.35))+.12*Math.max(0,Math.cos(a*2-1.1));
    const r=c.r*(1.02+lobe+directional);
    rupture.push([Math.cos(a)*r,Math.sin(a)*r]);
  }
  rupture.forEach(([x,z],i)=>{if(i===0)hole.moveTo(x,z);else hole.lineTo(x,z);});
  hole.closePath();shape.holes.push(hole);
  const floor=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false}),wood);
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
  const arcane=new THREE.MeshStandardMaterial({color:0x253b49,roughness:.62,metalness:.12,
    emissive:0x355f7b,emissiveIntensity:.65});
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
  fracture(.18,2.45,.12,1);fracture(2.58,1.85,.10,2);fracture(-1.54,1.55,.09,3);fracture(-2.72,1.18,.08,4);

  // Slumped floor plates make the failure read as structural collapse rather
  // than a decorative aperture.
  for(let i=0;i<11;i++){
    const a=i/11*Math.PI*2+.17,rad=c.r*(1.05+(i%3)*.10);
    const slab=box(upper,'Dropped warehouse floor slab',c.x+Math.cos(a)*rad,c.depth-.03-(i%4)*.05,
      c.z+Math.sin(a)*rad,.55+(i%3)*.18,.08,.42+(i%2)*.20,wood);
    slab.rotation.y=-a+(i%2?.2:-.13);slab.rotation.z=(i%2?1:-1)*(.08+(i%3)*.035);
  }
  // Natural, violently fractured shaft walls. Uneven rock teeth replace the old
  // ring-like lining so the descent cannot read as masonry or a constructed well.
  const shaftRand=n=>{const v=Math.sin(n*97.31+12.7)*43117.21;return v-Math.floor(v);};
  for(let y=.25,band=0;y<c.depth;y+=.62,band++)for(let i=0;i<24;i++){
    const a=(i+.35)/24*Math.PI*2;
    if(Math.sin(a)>.70 || (y<world.rockHeight+.7&&Math.cos(a)>.72))continue;
    const jitter=(shaftRand(i+band*31)-.5)*.32;
    const radius=c.r+.12+jitter;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.24+shaftRand(i+band*17)*.18,0),stone);
    rock.name='Fractured natural fissure wall';
    rock.position.set(c.x+Math.cos(a)*radius,y+(shaftRand(i+band*7)-.5)*.20,c.z+Math.sin(a)*radius);
    rock.scale.set(.75+shaftRand(i+2)*.85,1.35+shaftRand(band+i)*1.25,.72+shaftRand(i+9)*.72);
    rock.rotation.set(shaftRand(i+1)*2.4,-a,shaftRand(i+5)*1.8);
    rock.castShadow=true;rock.receiveShadow=true;shaft.add(rock);
  }
  const abyssGlow=new THREE.PointLight(0x4a7896,11,13,2);
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
  for(let i=0;i<29;i++){
    const a=i/29*Math.PI*2+.11*Math.sin(i*1.9),rad=c.r*(1.03+(i%5)*.075);
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.16+(i%4)*.065),stone);
    rock.position.set(c.x+Math.cos(a)*rad,c.depth+.02+(i%3)*.045,c.z+Math.sin(a)*rad);
    rock.scale.set(.8+(i%3)*.35,.35+(i%4)*.13,.75+(i%2)*.45);rock.rotation.set(i*.37,a,i*.19);
    rock.name='Exploded fissure rim rubble';upper.add(rock);
  }
  // Broken masonry perimeter, roof supports and remains of a red tile roof.
  for(const side of [-1,1]){
    box(upper,'Warehouse side masonry',c.x+side*c.halfW,c.depth+.78,c.z,.26,1.56,c.halfH*2,stone);
    box(upper,'Standing timber post',c.x+side*3.8,c.depth+1.9,c.z-2.8,.23,3.8,.23,darkWood);
  }
  box(upper,'Warehouse back wall',c.x,c.depth+1.0,c.z-c.halfH,c.halfW*2,2,.26,stone);
  box(upper,'Exposed roof crossbeam',c.x,c.depth+3.65,c.z-2.8,8.1,.22,.25,darkWood);
  const tile=new THREE.MeshStandardMaterial({color:0x813d30,roughness:1,side:THREE.DoubleSide});
  for(const side of [-1,1]){
    const roof=box(upper,'Remaining red tile roof',c.x+side*2.7,c.depth+3.2,c.z-3.0,3.3,.09,1.25,tile);
    roof.rotation.z=-side*.27;
  }
  // Fragmented gabled roof matching the ruined-warehouse reference:
  // a red tile roof persists across the rear, with visible broken rafters.
  // The foreground is removed as a cutaway so TV guests can see the hole.
  const redTiles=[0xa7553b,0x82412c,0xb66542,0x723a2a].map(color=>
    new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide}));
  const roofRand=n=>{const v=Math.sin(n*197.91+41.75)*48153.39;return v-Math.floor(v);};
  const pitch=.42;
  for(const side of [-1,1]){
    // Ridge-to-eave framing. Open slats remain where roof tiles broke away.
    for(const z of [-2.9,-1.75,-.60]){
      const beam=box(upper,'Exposed sloping timber rafter',c.x+side*2.0,c.depth+3.27,c.z+z,4.4,.17,.19,darkWood);
      beam.rotation.z=-side*pitch;
    }
    for(let row=0;row<6;row++)for(let col=0;col<5;col++){
      const seed=row*12+col+side*119;
      if(roofRand(seed)>.83 || (row>3&&col<2&&roofRand(seed+45)>.39))continue;
      const localX=side*(.47+row*.68),localZ=-3.4+col*.58;
      const h=4.13-Math.abs(localX)*.41;
      const section=box(upper,'Broken red clay roof tile',c.x+localX,c.depth+h,c.z+localZ,.76,.085,.57,redTiles[(row+col)%4]);
      section.rotation.z=-side*pitch;section.rotation.y=(roofRand(seed+1)-.5)*.025;
    }
  }
  box(upper,'Weathered ridge beam',c.x,c.depth+4.03,c.z-2.12,.27,.30,3.9,darkWood);
  // Collapsed chunks and fractured rafters at the cavern mouth.
  for(let i=0;i<27;i++){
    const angle=i*.71,rad=1.28+(i%5)*.20;
    const x=c.x+Math.cos(angle)*rad,z=c.z+Math.sin(angle)*rad;
    const r=.19+(i%4)*.12;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),stone);
    rock.position.set(x,c.depth+.16+r*.28,z);rock.rotation.set(angle,angle*.28,.23);rock.scale.set(1.2,.55,1.0);
    rock.name='Broken limestone at warehouse collapse';upper.add(rock);
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
  // Waterdeep context shell: enough real street and neighboring massing to stop
  // the warehouse from reading as a floating set. It remains deliberately low
  // detail because it is framing geometry, not an explorable city district.
  const streetMat=new THREE.MeshStandardMaterial({color:0x6e6a62,roughness:1});
  const plaster=new THREE.MeshStandardMaterial({color:0xa18d75,roughness:1});
  const slate=new THREE.MeshStandardMaterial({color:0x4a4f55,roughness:.96});
  box(upper,'Cobblestone street context',c.x,c.depth-.22,c.z+8.4,19,.34,10.5,streetMat);
  for(const side of [-1,1]){
    const bx=c.x+side*8.2;
    box(upper,'Neighboring Waterdeep facade',bx,c.depth+1.65,c.z+5.2,4.4,3.7,2.4,plaster);
    for(let k=0;k<3;k++)box(upper,'Neighboring timber frame',bx+side*(k-1)*.8,c.depth+1.7,c.z+3.96,.11,3.5,.12,darkWood);
    const roof=box(upper,'Neighboring slate roof',bx,c.depth+3.72,c.z+5.2,4.8,.16,2.8,slate);
    roof.rotation.z=-side*.18;
    for(let k=0;k<3;k++)box(upper,'Street crate',c.x+side*(5.7+k*.55),c.depth+.28,c.z+5.2+(k%2)*.65,.5,.55,.5,wood);
  }
  // Distant facade silhouettes close the horizon without obscuring orbit view.
  for(let k=0;k<5;k++){
    const x=c.x-7.4+k*3.7;
    box(upper,'Distant district mass',x,c.depth+1.15,c.z+11.6,3.1,2.7,1.3,k%2?plaster:stone);
  }
  // Dust plume and magical light make the fissure the visual cause of the ruin.
  const glow=new THREE.PointLight(0x547f9f,18,10,2);glow.position.set(c.x,c.depth-.55,c.z);upper.add(glow);
  for(let i=0;i<18;i++){
    const dustMat=new THREE.MeshBasicMaterial({color:0xc7baa2,transparent:true,opacity:.07+(i%4)*.018,depthWrite:false});
    const dust=new THREE.Mesh(new THREE.SphereGeometry(.12+(i%3)*.06,8,6),dustMat);
    dust.name='Rising rupture dust';dust.position.set(c.x+(roofRand(i+71)-.5)*2.2,c.depth+.18+(i%6)*.31,c.z+(roofRand(i+91)-.5)*1.8);
    dust.scale.set(.5,1.8,.5);upper.add(dust);
  }

  // Warning barrier across the open front of the damaged warehouse.
  const yellow=new THREE.MeshStandardMaterial({color:0xdab647,roughness:.7});
  for(const side of [-1,1])box(upper,'Barrier post',c.x+side*3.4,c.depth+.5,c.z+3.0,.08,1,.08,iron);
  box(upper,'Warehouse warning barrier',c.x,c.depth+.65,c.z+3.0,6.8,.075,.045,yellow);
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