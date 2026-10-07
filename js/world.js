import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {clamp,walkableAt} from './analysis.js';
import {connectionLayout,inShaft,inLanding,inWarehouse,buildConnection} from './connection.js';
import {loadSurfaces,stoneMaterial,woodMaterial,sampleRopePath} from './surfaces.js';

const GOLD=0xdac297;
const V3 = THREE.Vector3;
function rand(a,b=0){const n=Math.sin((a+1)*127.1+(b+4)*311.7)*43758.5453;return n-Math.floor(n);}
function release(node){node.traverse(o=>{
  if(o.geometry)o.geometry.dispose();
  if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    for(const key of ['map','alphaMap','normalMap','roughnessMap']) if(m[key]&&!m[key].userData.shared)m[key].dispose();
    m.dispose();
  }}
}); while(node.children.length)node.remove(node.children[0]);}

export class TabletopWorld {
  constructor(mount,toast){
    this.mount=mount;this.toast=toast;
    this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.65;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    mount.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#242b2a');
    this.scene.fog=new THREE.Fog('#242b2a',38,100);
    this.camera=new THREE.PerspectiveCamera(53,1,.025,230);
    this.camera.position.set(13,19,17);
    this.orbit=new OrbitControls(this.camera,this.renderer.domElement);
    this.orbit.enableDamping=true;this.orbit.dampingFactor=.07;
    this.orbit.minDistance=2;this.orbit.maxDistance=100;
    this.orbit.maxPolarAngle=Math.PI*.47;
    this.orbit.target.set(0,0,0);
    this.orbit.update();
    this.ambient=new THREE.HemisphereLight(0xdde7e4,0x342e2a,2.6);this.scene.add(this.ambient);
    const sun=new THREE.DirectionalLight(0xffddb0,3.4);
    sun.position.set(-11,25,8);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;
    sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;
    sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;
    this.sun=sun;this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0x7592a3,1.2);fill.position.set(10,8,-15);this.scene.add(fill);
    this.fill=fill;this.surfaces=loadSurfaces();this.whenTexturesReady=this.surfaces.ready;
    this.settings={lighting:'tabletop',lantern:true};
    this.lantern=new THREE.PointLight(0xffc88d,20,8,2);this.lantern.name='Explorer lantern';this.scene.add(this.lantern);
    this.setLighting('tabletop');
    this.selectedTokenId=null;this.tokenTransit=null;
    this.worldRoot=new THREE.Group();this.worldRoot.name='MapForge world';this.scene.add(this.worldRoot);
    this.gridRoot=new THREE.Group();this.scene.add(this.gridRoot);
    this.tokenRoot=new THREE.Group();this.worldRoot.add(this.tokenRoot);
    this.clock=new THREE.Clock();this.keys=new Set();this.walkMode=false;
    this.gridOn=true;this.placing='none';this.tokens=[];this.nextTokenId=1;
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.floorPlane=new THREE.Plane(new V3(0,1,0),0);
    this.walkYaw=0;this.walkPitch=-.05;
    this.dragToken=null;this.dragLook=false;this.dragX=0;this.dragY=0;
    this.walkButtons=new Set();this.activeLevel='area1';this.connectionOptions={enabled:true,depthFeet:60};this.cutaway=false;
    this._installEvents();
    this.resizer=new ResizeObserver(()=>this.resize());this.resizer.observe(mount);
    this.resize();this.animate();
  }
  _installEvents(){
    const el=this.renderer.domElement;
    el.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      this.dragX=e.clientX;this.dragY=e.clientY;
      if(this.walkMode){this.dragLook=true;el.setPointerCapture(e.pointerId);return;}
      if(this.placing==='none'){
        const selected=this._pickToken(e);
        if(selected&&selected.level===this.activeLevel&&!this.tokenTransit){this.selectToken(selected.id);this.dragToken=selected;this.orbit.enabled=false;el.setPointerCapture(e.pointerId);}
      }
    });
    el.addEventListener('pointermove',e=>{
      if(this.walkMode&&this.dragLook){this.walkYaw-=(e.clientX-this.dragX)*.004;this.walkPitch=clamp(this.walkPitch-(e.clientY-this.dragY)*.0035,-1.25,1.25);this.dragX=e.clientX;this.dragY=e.clientY;this._applyWalkRotation();}
      if(this.dragToken){const point=this._rayToGround(e);if(point&&this.canStand(point.x,point.z,.22)){this.dragToken.group.position.x=point.x;this.dragToken.group.position.z=point.z;this.dragToken.group.position.y=this.floorY;this.dragToken.level=this.activeLevel;}}
    });
    el.addEventListener('pointerup',e=>{
      this.dragLook=false;if(this.walkMode)return;
      if(this.dragToken){this.dragToken=null;this.orbit.enabled=true;return;}
      const distance=Math.hypot(e.clientX-this.dragX,e.clientY-this.dragY);
      if(distance<6&&this.placing==='none'&&!this._pickToken(e))this.selectToken(null);
      if(distance<6 && this.placing!=='none'){
        const point=this._rayToGround(e);
        if(point && this.canStand(point.x,point.z,.22))this.addToken(this.placing,point.x,point.z);
        else this.toast('Choose a walkable floor tile.');
      }
    });
    el.addEventListener('pointercancel',()=>{this.dragToken=null;this.dragLook=false;this.orbit.enabled=!this.walkMode;});
    document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
      if(e.code==='KeyE'&&this.walkMode&&!e.repeat){e.preventDefault();this.useRope();}
      if(e.code==='Delete'&&!this.walkMode&&!e.repeat){e.preventDefault();this.removeSelectedToken();}
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'].includes(e.code)){
        this.keys.add(e.code);if(this.walkMode)e.preventDefault();
      }
    });
    document.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>{this.keys.clear();this.walkButtons.clear();});
  }
  _rayToGround(e){
    const b=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const out=new V3();return this.raycaster.ray.intersectPlane(this.floorPlane.set(new V3(0,1,0),-this.floorY),out)?out:null;
  }
  _pickToken(e){
    const b=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.tokens.filter(t=>t.level===this.activeLevel&&t.group.visible).map(t=>t.group),true);
    if(!hits.length)return null;
    let g=hits[0].object;while(g.parent&&g.parent!==this.tokenRoot)g=g.parent;
    return this.tokens.find(t=>t.group===g)||null;
  }
  mapToWorld(u,v){return {x:(u-.5)*this.worldW,z:(v-.5)*this.worldH};}
  worldToUV(x,z){return {u:x/this.worldW+.5,v:z/this.worldH+.5};}
  get floorY(){return this.connection&&this.activeLevel==='warehouse'?this.connection.depth:0;}
  canWalk(x,z,level=this.activeLevel){if(!this.analysis)return false;
    if(this.connection){
      if(level==='warehouse')return inWarehouse(this.connection,x,z);
      if(inLanding(this.connection,x,z))return true;
    }
    const {u,v}=this.worldToUV(x,z);return walkableAt(this.analysis,u,v);
  }
  canStand(x,z,radius=.14,level=this.activeLevel){
    if(!this.canWalk(x,z,level))return false;
    return [[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dz])=>this.canWalk(x+dx*radius,z+dz*radius,level));
  }
  setLighting(mode){
    mode=mode==='torchlit'?'torchlit':'tabletop';
    this.settings??={lantern:true};this.settings.lighting=mode;
    if(!this.ambient)return;
    const dark=mode==='torchlit';
    this.ambient.intensity=dark?.48:2.4;this.sun.intensity=dark?.65:3.1;this.fill.intensity=dark?.35:1.0;
    this.renderer.toneMappingExposure=dark?1.35:1.28;
    this.scene.background.set(dark?'#10171b':'#242b2a');
    this.scene.fog.color.copy(this.scene.background);
  }
  setLantern(enabled){this.settings??={lighting:'tabletop'};this.settings.lantern=!!enabled;}
  build(image,analysis,rockFeet=10,savedTokens=[],connectionOptions={enabled:false,depthFeet:60}){
    this.analysis=analysis;this.image=image;
    this.worldW=image.naturalWidth/analysis.gridPixels;
    this.worldH=image.naturalHeight/analysis.gridPixels;
    this.rockHeight=rockFeet/5;
    this.connectionOptions={enabled:!!connectionOptions.enabled,depthFeet:clamp(Number(connectionOptions.depthFeet)||60,20,150)};
    this.connection=this.connectionOptions.enabled?connectionLayout(this,this.connectionOptions.depthFeet):null;
    const oldSelection=this.selectedTokenId;const oldLevel=this.activeLevel;
    this.connectionMeshes=null;this.climbing=null;this.tokenTransit=null;this.activeLevel=this.connection&&oldLevel==='warehouse'?'warehouse':'area1';
    release(this.gridRoot);release(this.worldRoot);
    this.tokenRoot=new THREE.Group();this.tokenRoot.name='Miniatures';
    this.worldRoot.add(this.tokenRoot);this.tokens=[];this.nextTokenId=1;
    this._buildGround();this._buildRock();this._buildRubble();this._buildProps();
    if(this.connection)this.connectionMeshes=buildConnection(this,this.connection);
    this._buildGrid();
    for(const tok of savedTokens)this.addToken(tok.kind,tok.x,tok.z,tok.label,true,tok.level||'area1',tok.id);
    this.gridRoot.visible=this.gridOn;
    this._setSpawn();this.selectToken(oldSelection);this.setCutaway(this.cutaway);this.recenter();
  }
  _buildGround(){
    const tex=new THREE.Texture(this.image);tex.needsUpdate=true;
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    this.mapTexture=tex;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(this.worldW,this.worldH),new THREE.MeshStandardMaterial({map:tex,roughness:1,metalness:0,side:THREE.DoubleSide}));
    m.rotation.x=-Math.PI/2;m.position.y=-.018;m.receiveShadow=true;m.name='Original battlemap floor';
    this.worldRoot.add(m);
  }
  _buildRock(){
    const {width:w,height:h,mask,brightness}=this.analysis;
    const vertices=[],colors=[],indices=[],uvs=[];
    const vertexHeight=(x,y)=>{
      let count=0,total=0;
      for(let dy=-1;dy<=0;dy++)for(let dx=-1;dx<=0;dx++){
        let a=x+dx,b=y+dy;
        if(a>=0&&b>=0&&a<w&&b<h){count+=mask[b*w+a];total++;}
      }
      const p=this.mapToWorld(x/w,y/h);
      if(this.connection&&inLanding(this.connection,p.x,p.z))return 0;
      const blocked=1-count/Math.max(total,1);
      return blocked* this.rockHeight *(.82+.32*rand(x,y));
    };
    for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){
      const x=(i/w-.5)*this.worldW,z=(j/h-.5)*this.worldH;
      const y=vertexHeight(i,j);
      vertices.push(x,y,z);uvs.push(x*.65,z*.65);
      const idx=Math.min(h-1,Math.max(0,j))*w+Math.min(w-1,Math.max(0,i));
      const light=brightness[idx]||.4;
      const t=rand(i+91,j+22);
      colors.push(.40+light*.32+t*.055,.39+light*.29+t*.045,.37+light*.265+t*.045);
    }
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      const p=this.mapToWorld((i+.5)/w,(j+.5)/h);
      if(mask[j*w+i]||(this.connection&&inLanding(this.connection,p.x,p.z)))continue;
      const v=j*(w+1)+i;
      indices.push(v,v+w+1,v+1,v+1,v+w+1,v+w+2);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices);geo.computeVertexNormals();
    const stone=new THREE.Mesh(geo,stoneMaterial(this.surfaces,{color:0xffffff,vertexColors:true,flatShading:false}));
    stone.castShadow=true;stone.receiveShadow=true;stone.name='Auto-extruded stone walls';this.worldRoot.add(stone);
  }
  _buildRubble(){
    const {width:w,height:h,mask}=this.analysis;
    const placements=[],small=[];
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x;
      const edge=mask[i]===0 && [mask[i-1],mask[i+1],mask[i-w],mask[i+w]].some(v=>v===1);
      const nearby=mask[i]===1 && [mask[i-1],mask[i+1],mask[i-w],mask[i+w]].some(v=>v===0);
      if(edge && rand(x*2,y*9)<.63)placements.push([x,y,0]);
      if(nearby && rand(x*9,y*12)<.40)small.push([x,y,1]);
    }
    const make=(locations,radius,material,name)=>{
      if(this.connection)locations=locations.filter(([x,y])=>{
        const p=this.mapToWorld((x+.35+rand(x,y)*.4)/w,(y+.3+rand(y,x)*.4)/h);
        return !inLanding(this.connection,p.x,p.z);
      });
      const geo=new THREE.DodecahedronGeometry(radius,0);
      const inst=new THREE.InstancedMesh(geo,material,locations.length);inst.name=name;
      inst.castShadow=true;inst.receiveShadow=true;
      const dummy=new THREE.Object3D();
      locations.forEach(([x,y],i)=>{
        const k=rand(x+71,y+34),p=this.mapToWorld((x+.35+rand(x,y)*.4)/w,(y+.3+rand(y,x)*.4)/h);
        const s=.65+rand(x*4,y*7)*1.35;
        dummy.position.set(p.x,radius*s*(k>.7?.93:.6),p.z);
        dummy.rotation.set(rand(x,y)*3,rand(x+3,y)*6,rand(x,y+7)*2);
        dummy.scale.set(s,s*(.5+k*.8),s);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
        inst.setColorAt(i,new THREE.Color().setHSL(.075,.11,.30+rand(x+2,y+4)*.19));
      });
      this.worldRoot.add(inst);
    };
    make(placements,.20,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}), 'Ridge boulders');
    make(small,.07,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}), 'Loose floor stones');
  }
  _buildProps(){
    // Optional curated props: not inferred automatically from arbitrary uploads.
    if(this.analysis.mode!=='curated')return;
    const pos=this.mapToWorld(.613,.435);
    const barrel=new THREE.Group();barrel.name='Barrel';barrel.position.set(pos.x,.30,pos.z);
    const wood=woodMaterial(this.surfaces,{color:0xa5885d});
    const iron=new THREE.MeshStandardMaterial({color:0x30302c,metalness:.48,roughness:.6});
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.22,.21,.55,12),wood);body.castShadow=true;barrel.add(body);
    for(const y of [-.19,.18]){const band=new THREE.Mesh(new THREE.CylinderGeometry(.223,.225,.055,12),iron);band.position.y=y;barrel.add(band);}
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(.218,.218,.025,12),wood);lid.position.y=.27;barrel.add(lid);
    this.worldRoot.add(barrel);
    const plank=woodMaterial(this.surfaces,{color:0x927150});
    for(let i=0;i<8;i++){
      const r=this.mapToWorld(.42+(rand(i,2)-.5)*.15,.49+(rand(i,3)-.5)*.15);
      if(!this.canWalk(r.x,r.z,'area1'))continue;
      const board=new THREE.Mesh(new THREE.BoxGeometry(.07+rand(i,4)*.10,.035,.25+rand(i,5)*.55),plank);
      board.position.set(r.x,.085,r.z);board.rotation.y=rand(i,8)*Math.PI*2;board.castShadow=true;
      this.worldRoot.add(board);
    }
  }
  _buildGrid(){
    // 5-foot tactical grid aligned to the image scale, clipped to traversable floor.
    release(this.gridRoot);
    const verts=[],step=.23;
    for(let x=-this.worldW/2;x<=this.worldW/2+.001;x+=1){
      for(let z=-this.worldH/2;z+step<this.worldH/2;z+=step){
        if(this.canWalk(x,z+step/2)){verts.push(x,this.floorY+.066,z,x,this.floorY+.066,z+step);}
      }
    }
    for(let z=-this.worldH/2;z<=this.worldH/2+.001;z+=1){
      for(let x=-this.worldW/2;x+step<this.worldW/2;x+=step){
        if(this.canWalk(x+step/2,z))verts.push(x,this.floorY+.066,z,x+step,this.floorY+.066,z);
      }
    }
    if(this.connection&&this.activeLevel==='warehouse'){
      verts.length=0;const c=this.connection;
      for(let x=Math.ceil(c.x-c.halfW);x<c.x+c.halfW;x++)for(let z=c.z-c.halfH;z<c.z+c.halfH-step;z+=step)if(this.canWalk(x,z+step/2))verts.push(x,this.floorY+.066,z,x,this.floorY+.066,z+step);
      for(let z=Math.ceil(c.z-c.halfH);z<c.z+c.halfH;z++)for(let x=c.x-c.halfW;x<c.x+c.halfW-step;x+=step)if(this.canWalk(x+step/2,z))verts.push(x,this.floorY+.066,z,x+step,this.floorY+.066,z);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xf7ddab,transparent:true,opacity:.25,depthWrite:false}));
    lines.name='5 foot tactical grid';this.gridRoot.add(lines);
  }
  setGrid(enabled){this.gridOn=enabled;this.gridRoot.visible=enabled;}
  _setSpawn(){
    const {width:w,height:h,mask}=this.analysis;
    let best=null,score=1e10;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      if(!mask[y*w+x])continue;
      const u=(x+.5)/w,v=(y+.5)/h;
      const cost=Math.abs(u-.51)+Math.abs(v-.77);
      if(cost<score){score=cost;best=this.mapToWorld(u,v);}
    }
    this.spawn=best||{x:0,z:0};
  }
  selectToken(id){
    const selected=this.tokens.find(t=>t.id===Number(id));this.selectedTokenId=selected?.id??null;
    for(const t of this.tokens){const ring=t.group.getObjectByName('Miniature selection ring');if(ring){ring.material.emissive.set(t===selected?0xa46b1c:0x000000);ring.material.emissiveIntensity=t===selected ? .8 : 0;ring.scale.setScalar(t===selected?1.1:1);}}
    return selected||null;
  }
  get selectedToken(){return this.tokens.find(t=>t.id===this.selectedTokenId)||null;}
  renameSelectedToken(label){
    const t=this.selectedToken;if(!t||this.tokenTransit)return;
    const safe=String(label).trim().slice(0,60);if(!safe)return;
    t.label=safe;t.group.name=safe;this.toast('Miniature renamed.');
  }
  removeSelectedToken(){
    const t=this.selectedToken;if(!t||this.tokenTransit)return;
    this.tokenRoot.remove(t.group);release(t.group);this.tokens=this.tokens.filter(x=>x!==t);this.selectToken(null);this.toast('Miniature removed.');
  }
  focusSelectedToken(){
    const t=this.selectedToken;if(!t)return;
    this.focusLevel(t.level);
    if(!this.walkMode){this.orbit.target.copy(t.group.position);this.camera.position.copy(t.group.position).add(new V3(3,4,5));this.orbit.update();}
  }
  ropeStatus(token=this.selectedToken){
    if(!this.connection)return 'Load the connected demo to use the rope.';
    if(!token)return 'Select a miniature first.';
    if(this.tokenTransit)return 'Miniature is on the rope…';
    const p=token.level==='warehouse'?this.upperSpawn():this.connection.landing;
    if(Math.hypot(token.group.position.x-p.x,token.group.position.z-p.z)>2.4)return 'Move this miniature closer to the rope landing.';
    return '';
  }
  transferSelectedToken(){
    if(this.climbing){this.toast('Wait for the exploration camera to finish using the rope.');return false;}
    const reason=this.ropeStatus();if(reason){this.toast(reason);return false;}
    const t=this.selectedToken,next=t.level==='warehouse'?'area1':'warehouse';
    const p=next==='warehouse'?this.upperSpawn():this.connection.landing;
    this.setCutaway(false);
    this.tokenTransit={token:t,next,from:t.group.position.clone(),to:new V3(p.x,next==='warehouse'?this.connection.depth:0,p.z),elapsed:0,duration:3.2};
    this.toast(t.label+(next==='area1'?' is descending to Area 1…':' is climbing to the warehouse…'));return true;
  }
  setCutaway(enabled){
    this.cutaway=!!enabled;
    if(this.connectionMeshes){this.connectionMeshes.upper.visible=!this.cutaway;this.connectionMeshes.shaft.visible=!this.cutaway;}
    for(const t of this.tokens)t.group.visible=this.tokenTransit?.token===t||!(this.cutaway&&t.level==='warehouse');
  }
  focusLevel(level){
    if(level==='warehouse'&&!this.connection){this.toast('Load the connected demo first.');return;}
    this.climbing=null;this.activeLevel=level;
    this.setCutaway(level==='area1');this._buildGrid();
    if(this.walkMode){
      const p=level==='warehouse'?this.upperSpawn():this.connection?.landing||this.spawn;
      this.camera.position.set(p.x,this.floorY+1.05,p.z);this.walkYaw=0;this.walkPitch=-.08;this._applyWalkRotation();
    }else if(this.connection&&level==='warehouse'){
      const c=this.connection;this.orbit.target.set(c.x,c.depth,c.z);this.camera.position.set(c.x+8,c.depth+8,c.z+10);this.orbit.update();
    }else this.recenter();
  }
  upperSpawn(){const c=this.connection;return {x:c.x,z:c.z-1.6};}
  overview(){
    if(!this.connection){this.recenter();return;}
    this.switchMode(false);this.setCutaway(false);
    const c=this.connection;this.orbit.target.set(c.x*.4,c.depth*.45,c.z*.4);
    this.camera.position.set(c.x+23,c.depth+14,c.z+31);this.orbit.update();
  }
  useRope(){
    if(!this.connection){this.toast('Load the connected demo first.');return;}
    if(!this.walkMode){this.toast('Enter Explore mode to use the rope.');return;}
    if(this.climbing||this.tokenTransit)return;
    const c=this.connection,p=this.activeLevel==='warehouse'?this.upperSpawn():c.landing;
    if(Math.hypot(this.camera.position.x-p.x,this.camera.position.z-p.z)>2.4){this.toast('Walk closer to the rope landing first.');return;}
    const next=this.activeLevel==='warehouse'?'area1':'warehouse';
    const end=next==='warehouse'?this.upperSpawn():c.landing;
    this.setCutaway(false);this.keys.clear();this.walkButtons.clear();
    this.climbing={elapsed:0,duration:4,from:this.camera.position.clone(),to:new V3(end.x,(next==='warehouse'?c.depth:0)+1.05,end.z),next};
    this.toast(next==='warehouse'?'Climbing to the warehouse…':'Descending into Area 1…');
  }
  recenter(){
    const dim=Math.max(this.worldW,this.worldH);
    if(this.connection&&this.activeLevel==='warehouse'){this.focusLevel('warehouse');return;}
    if(this.walkMode){const p=this.connection?.landing||this.spawn;this.camera.position.set(p.x,1.05,p.z);this.walkYaw=0;this.walkPitch=0;this._applyWalkRotation();}
    else{this.orbit.target.set(0,0,0);this.camera.position.set(dim*.52,dim*.69,dim*.62);this.orbit.update();}
  }
  switchMode(isWalk){
    this.climbing=null;this.walkMode=isWalk;this.orbit.enabled=!isWalk;this.keys.clear();this.walkButtons.clear();
    if(isWalk){const p=this.activeLevel==='warehouse'&&this.connection?this.upperSpawn():this.connection?.landing||this.spawn;this.camera.position.set(p.x,this.floorY+1.05,p.z);this.walkYaw=0;this.walkPitch=-.04;this._applyWalkRotation();}
    else this.recenter();
  }
  _applyWalkRotation(){
    const yaw=this.walkYaw,pitch=this.walkPitch;
    const direction=new V3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
    this.camera.lookAt(this.camera.position.clone().add(direction));
  }
  addToken(kind,x,z,label=null,isRestoring=false,level=this.activeLevel,savedId=null){
    if(!this.canWalk(x,z,level))return;
    const requested=Number(savedId);
    const id=Number.isSafeInteger(requested)&&requested>0&&!this.tokens.some(t=>t.id===requested)?requested:this.nextTokenId;
    this.nextTokenId=Math.max(this.nextTokenId,id+1);
    const g=new THREE.Group();g.position.set(x,level==='warehouse'&&this.connection?this.connection.depth:0,z);g.name=label||`${kind==='hero'?'Hero':'Foe'} ${id}`;
    const color=kind==='hero'?0x7ca5bd:0xc47d56;
    const main=new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.15});
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.23,.24,.07,20),new THREE.MeshStandardMaterial({color:0x28282b,metalness:.2,roughness:.7}));base.position.y=.06;g.add(base);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.218,.024,6,24),new THREE.MeshStandardMaterial({color:kind==='hero'?0x91c4d5:0xeb9a74,metalness:.4,roughness:.45}));rim.name='Miniature selection ring';rim.rotation.x=Math.PI/2;rim.position.y=.11;g.add(rim);
    const body=new THREE.Mesh(new THREE.ConeGeometry(.165,.36,8),main);body.position.y=.31;body.castShadow=true;g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.116,12,10),new THREE.MeshStandardMaterial({color:kind==='hero'?0xedddbf:0x82936b,roughness:.83}));head.position.y=.57;head.castShadow=true;g.add(head);
    this.tokenRoot.add(g);
    const token={id,kind,group:g,label:g.name,level};this.tokens.push(token);
    if(!isRestoring){this.selectToken(id);this.toast(`${g.name} placed. Drag it to another tile.`);}
    return token;
  }
  clearTokens(){this.tokenTransit=null;this.selectedTokenId=null;release(this.tokenRoot);this.tokens=[];this.nextTokenId=1;this.toast('Tokens cleared.');}
  getTokens(){return this.tokens.map(t=>({id:t.id,kind:t.kind,x:t.group.position.x,z:t.group.position.z,label:t.label,level:t.level}));}
  resize(){
    const w=Math.max(this.mount.clientWidth,1),h=Math.max(this.mount.clientHeight,1);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);
  }
  animate(){
    if(!this.renderer)return;
    this.animationId=requestAnimationFrame(()=>this.animate());
    const dt=Math.min(this.clock.getDelta(),.05);
    if(this.climbing){
      const t=this.climbing;t.elapsed+=dt;const f=Math.min(1,t.elapsed/t.duration);
      const c=this.connection,a=this.connectionMeshes.anchor;
      this.camera.position.copy(sampleRopePath(t.from,t.to,a,f));
      this._applyWalkRotation();
      if(f>=1){this.activeLevel=t.next;this.climbing=null;this.setCutaway(t.next==='area1');this._buildGrid();this.toast(t.next==='area1'?'Arrived in Area 1. The passage leads north.':'Arrived at the warehouse fissure.');}
    }else if(this.walkMode){
      const forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')||this.walkButtons.has('forward')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')||this.walkButtons.has('back')?1:0);
      const side=(this.keys.has('KeyD')||this.keys.has('ArrowRight')||this.walkButtons.has('right')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')||this.walkButtons.has('left')?1:0);
      if(forward||side){
        const speed=this.keys.has('ShiftLeft')?3.7:2.0;
        const c=Math.cos(this.walkYaw),s=Math.sin(this.walkYaw);
        const length=Math.hypot(forward,side);
        const dx=(forward*s+side*c)/length*dt*speed,dz=(-forward*c+side*s)/length*dt*speed;
        const px=this.camera.position.x,pz=this.camera.position.z;
        if(this.canStand(px+dx,pz))this.camera.position.x=px+dx;
        if(this.canStand(this.camera.position.x,pz+dz))this.camera.position.z=pz+dz;
        this._applyWalkRotation();
      }
    }else this.orbit.update();
    if(this.tokenTransit){
      const t=this.tokenTransit;t.elapsed+=dt;const f=Math.min(1,t.elapsed/t.duration);
      t.token.group.position.copy(sampleRopePath(t.from,t.to,this.connectionMeshes.anchor,f));
      if(f>=1){t.token.level=t.next;this.tokenTransit=null;this.focusSelectedToken();this.toast(t.token.label+' arrived '+(t.next==='area1'?'in Area 1.':'at the warehouse.'));}
    }
    if(this.lantern){this.lantern.visible=!!this.settings.lantern&&this.walkMode;this.lantern.position.copy(this.camera.position).add(new V3(0,-.18,0));}
    this.renderer.render(this.scene,this.camera);
  }
  capture(){return this.renderer.domElement.toDataURL('image/png');}
}
