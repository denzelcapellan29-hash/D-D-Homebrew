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
  // Real hole through the warehouse floor, rather than a black painted disc.
  const shape=new THREE.Shape();
  shape.moveTo(-c.halfW,-c.halfH);shape.lineTo(c.halfW,-c.halfH);
  shape.lineTo(c.halfW,c.halfH);shape.lineTo(-c.halfW,c.halfH);shape.closePath();
  const hole=new THREE.Path();
  for(let i=0;i<=40;i++){
    const a=-i/40*Math.PI*2,r=c.r*(1+.045*Math.sin(i*2.7));
    if(i===0)hole.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    else hole.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  hole.closePath();shape.holes.push(hole);
  const floor=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false}),wood);
  floor.name='Broken warehouse floor with open fissure';floor.rotation.x=-Math.PI/2;
  floor.position.set(c.x,c.depth-.12,c.z);floor.receiveShadow=true;upper.add(floor);
  // Plank seams stop at the fissure boundary.
  for(let z=-c.halfH+.22;z<c.halfH;z+=.38){
    const gap=Math.abs(z)<c.r*1.05?Math.sqrt((c.r*1.05)**2-z*z):0;
    if(gap){
      for(const sign of [-1,1])box(upper,'Plank seam',c.x+sign*(c.halfW+gap)/2,c.depth+.008,c.z+z,c.halfW-gap,.01,.018,darkWood);
    }else box(upper,'Plank seam',c.x,c.depth+.008,c.z+z,c.halfW*2,.01,.018,darkWood);
  }
  // Retaining shaft rings. Front quarter omitted to make the depth legible.
  // At the bottom, an additional east-facing opening physically meets Area 1.
  for(let y=.38;y<c.depth;y+=.75)for(let i=0;i<28;i++){
    const a=(i+.5)/28*Math.PI*2;
    if(Math.sin(a)>.64 || (y<world.rockHeight+.6&&Math.cos(a)>.74))continue;
    const m=box(shaft,'Fissure stone lining',c.x+Math.cos(a)*(c.r+.10),y,c.z+Math.sin(a)*(c.r+.10),.27,.70,.28,stone);
    m.rotation.y=-a;
  }
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
  for(let i=0;i<20;i++){
    const a=i/20*Math.PI*2;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.19+(i%3)*.06),stone);
    rock.position.set(c.x+Math.cos(a)*(c.r+.2),c.depth+.08,c.z+Math.sin(a)*(c.r+.2));
    rock.scale.set(1,.55,1);rock.name='Collapsed fissure rim rubble';upper.add(rock);
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
  for(let i=0;i<5;i++){
    const x=c.x-3.3+(i%2)*.9,z=c.z-2.5+Math.floor(i/2)*.65;
    box(upper,'Warehouse crate',x,c.depth+.32,z,.6,.64,.6,wood);
    box(upper,'Crate iron strap',x,c.depth+.65,z,.63,.04,.04,iron);
  }
  for(let i=0;i<7;i++){
    const plank=box(upper,'Fallen timber',c.x+1.65+(i%3)*.55,c.depth+.07,c.z+.7+Math.floor(i/3)*.55,.16,.1,1.1,darkWood);
    plank.rotation.y=i*.81;
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
