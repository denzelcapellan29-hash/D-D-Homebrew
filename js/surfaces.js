import * as THREE from 'three';
export function loadSurfaces(){
  const loader=new THREE.TextureLoader(),pending=[];
  const load=(name,color=false)=>{
    let done,fail;pending.push(new Promise((resolve,reject)=>{done=resolve;fail=reject;}));
    const t=loader.load(new URL('../assets/materials/'+name+'.png',import.meta.url).href,done,undefined,fail);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.userData.shared=true;
    if(color)t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const stone=load('stone',true),stoneNormal=load('stone-normal');
  const wood=load('wood',true),woodNormal=load('wood-normal');
  const ready=Promise.all(pending);ready.catch(()=>{});
  return {stone,stoneNormal,wood,woodNormal,ready};
}
export function stoneMaterial(surfaces,options={}){
  return new THREE.MeshStandardMaterial({color:0x938779,roughness:.96,side:THREE.DoubleSide,
    ...(surfaces?{map:surfaces.stone,normalMap:surfaces.stoneNormal,normalScale:new THREE.Vector2(.7,.7)}:{}),...options});
}
export function woodMaterial(surfaces,options={}){
  return new THREE.MeshStandardMaterial({color:0x9a7752,roughness:.9,
    ...(surfaces?{map:surfaces.wood,normalMap:surfaces.woodNormal,normalScale:new THREE.Vector2(.4,.4)}:{}),...options});
}
// Stop/start easing at the approach, vertical climb and exit of the rope.
export function sampleRopePath(start,end,anchor,progress){
  const f=THREE.MathUtils.clamp(progress,0,1);
  const ease=t=>t*t*(3-2*t);
  if(f<.18)return start.clone().lerp(new THREE.Vector3(anchor.x,start.y,anchor.z),ease(f/.18));
  if(f<.82)return new THREE.Vector3(anchor.x,THREE.MathUtils.lerp(start.y,end.y,ease((f-.18)/.64)),anchor.z);
  return new THREE.Vector3(anchor.x,end.y,anchor.z).lerp(end,ease((f-.82)/.18));
}
