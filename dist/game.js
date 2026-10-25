import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CanvasRenderer } from './canvas-renderer.js';

const $ = id => document.getElementById(id);
const TAU=Math.PI*2, KEY='unfinished-garden-free-v2';
const SPECIES=[
 {id:'banyan',name:'榕树',latin:'Ficus',cat:'tree',note:'舒展树冠',colors:[0x506c37,0x7b914b,0x99a95c],kind:'tree',height:3.6},
 {id:'maple',name:'青枫',latin:'Acer',cat:'tree',note:'轻盈枝叶',colors:[0x788148,0xa2a569,0x647446],kind:'maple',height:3.0},
 {id:'ginkgo',name:'银杏',latin:'Ginkgo',cat:'tree',note:'金色叶片',colors:[0xc3b767,0xd5c77a,0xa8ad57],kind:'ginkgo',height:3.2},
 {id:'bougain',name:'三角梅',latin:'Bougainvillea',cat:'flower',note:'玫粉花瀑',colors:[0x567347,0x819352,0x6c824a],flower:[0xc8869a,0xe0a6b6,0xad6684],kind:'bougain',height:1.5},
 {id:'hydrangea',name:'绣球',latin:'Hydrangea',cat:'flower',note:'雾蓝花团',colors:[0x4d7153,0x73956c,0x62865c],flower:[0xa1acc8,0xc0c3d8,0x8c9db9],kind:'hydrangea',height:1},
 {id:'salvia',name:'蓝花鼠尾草',latin:'Salvia',cat:'flower',note:'紫色花序',colors:[0x65764c,0x8a9964,0x6e8257],flower:[0x8b83ad,0xb3a3c3,0x7b769b],kind:'salvia',height:1.1},
 {id:'fern',name:'肾蕨',latin:'Nephrolepis',cat:'leaf',note:'羽状绿意',colors:[0x657f3e,0x98a658,0x799149],kind:'fern',height:.8},
 {id:'monstera',name:'龟背竹',latin:'Monstera',cat:'leaf',note:'宽叶层次',colors:[0x39614b,0x547b57,0x6e925e],kind:'monstera',height:1.5},
 {id:'hosta',name:'玉簪',latin:'Hosta',cat:'leaf',note:'柔软地被',colors:[0x819667,0xacb68a,0x648157],kind:'hosta',height:.55},
 {id:'grass',name:'细叶芒',latin:'Miscanthus',cat:'leaf',note:'风里的穗',colors:[0x9a9b61,0xb2ad74,0x87905d],kind:'grass',height:1.15},
 {id:'ivy',name:'常春藤',latin:'Hedera',cat:'vine',note:'向下漫生',colors:[0x537143,0x7b915b,0x9cab70],kind:'ivy',height:2},
 {id:'pothos',name:'绿萝',latin:'Epipremnum',cat:'vine',note:'垂坠心叶',colors:[0x638042,0x97a84d,0x7f994d],kind:'pothos',height:1.6}
];
const speciesMap=Object.fromEntries(SPECIES.map(s=>[s.id,s]));
let state={plants:[],growth:1,season:0,light:'day'},selectedId=null,plantingId=null,mode='select',floor='all';
let history=[],future=[],plantMeshes=new Map(),templates={},ghost=null,drag=null,down=null,rainingUntil=0;
let seed=42;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}function range(a,b){return a+(b-a)*rand();}
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
let renderer;
try{const surface=document.createElement('canvas'),context=surface.getContext('webgl2',{antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer=context?new THREE.WebGLRenderer({canvas:surface,context,antialias:true,alpha:true,preserveDrawingBuffer:true}):new CanvasRenderer();}catch(e){renderer=new CanvasRenderer();}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
$('viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe9eddf,38,75);
const camera=new THREE.PerspectiveCamera(33,1,.1,100);camera.position.set(15,12,17);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.9,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=8;controls.maxDistance=34;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.485;controls.enablePan=true;controls.panSpeed=.6;controls.rotateSpeed=.7;controls.zoomSpeed=.7;
const ambient=new THREE.HemisphereLight(0xffffec,0x8f9f86,2.1);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xfff5d5,3.6);sun.position.set(-8,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:45});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);
const fill=new THREE.DirectionalLight(0xd9e9d7,.7);fill.position.set(8,6,-8);scene.add(fill);
function concreteTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#dddccf';ctx.fillRect(0,0,256,256);for(let i=0;i<14000;i++){const n=Math.floor(range(100,200));ctx.fillStyle=`rgba(${n},${n},${n-10},${range(.02,.1)})`;ctx.fillRect(rand()*256,rand()*256,rand()*2+.5,rand()*2+.5);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.SRGBColorSpace;return t;}
const concrete=new THREE.MeshStandardMaterial({color:0xe2e0d1,map:concreteTexture(),roughness:1});
const concreteDark=new THREE.MeshStandardMaterial({color:0xb5b9a4,roughness:1});const stoneMat=new THREE.MeshStandardMaterial({color:0xb9bba8,roughness:1});const mossMat=new THREE.MeshStandardMaterial({color:0x919a6b,roughness:1});const woodMat=new THREE.MeshStandardMaterial({color:0x857b60,roughness:1});
const architecture=new THREE.Group(),upper=new THREE.Group();scene.add(architecture);architecture.add(upper);
const slabs=[];
function box(w,h,d,x,y,z,mat=concrete,parent=architecture){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function slab(w,d,x,z,y,parent){let m=box(w,.23,d,x,y-.115,z,concrete,parent);slabs.push(m);return m;}
slab(10.4,6.5,0,0,0,architecture);
// Only two usable levels. The upper level is an open terrace, not an empty third story.
slab(10.4,2.3,0,-2.1,3.1,upper);slab(10.4,2.3,0,2.1,3.1,upper);slab(3.8,1.9,-3.3,0,3.1,upper);slab(3.8,1.9,3.3,0,3.1,upper);
for(const x of [-4.85,0,4.85])for(const z of [-2.95,2.95]){box(.3,2.95,.3,x,1.475,z);box(.42,.27,6.4,x,2.82,0);}
for(const z of [-2.95,2.95])box(10.25,.28,.36,0,2.82,z);
// Incomplete walls preserve the sense of an abandoned structure.
box(4.3,1.6,.16,-2.7,.8,-3.05);box(1.55,.7,.16,3.95,.35,-3.05);
box(.16,.85,2,-5.04,.425,-1.92);box(2.25,.45,.16,-3.8,3.325,-3.05,concrete,upper);
box(.16,.7,2.1,-5.04,3.45,-1.9,concrete,upper);
for(let i=0;i<17;i++)box(1.1,.19,0.39,5.8,.09+i*.183,3.15-i*.36);
box(1.1,.22,.75,5.8,2.99,-3.0);
// Fine joints and traces in the concrete, without soil piles or planter boxes.
const seamMat=new THREE.LineBasicMaterial({color:0x9eaa95,transparent:true,opacity:.2});
function line(points,mat=seamMat,parent=architecture){let l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat);parent.add(l);return l;}
for(let x=-4;x<=4;x+=2){line([v(x,.008,-3),v(x,.008,3)]);line([v(x,3.108,1),v(x,3.108,3)],seamMat,upper);line([v(x,3.108,-3),v(x,3.108,-1)],seamMat,upper);}
for(let i=0;i<18;i++){let x=range(-4.8,4.8),z=range(-2.9,2.9);let y=i%2?3.11:.01;if(y>1&&Math.abs(x)<1.4&&Math.abs(z)<.96)continue;line([v(x,y,z),v(x+.12,y,z+.13),v(x+.11,y,z+.25),v(x+.28,y,z+.36)],seamMat,y>1?upper:architecture);}
const ground=new THREE.Mesh(new THREE.CircleGeometry(60,80),new THREE.MeshStandardMaterial({color:0xe5e8d9,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.26;ground.receiveShadow=true;scene.add(ground);
// Subtle grass and moss around the foundation.
const mossGeo=new THREE.CircleGeometry(1,12);for(let i=0;i<38;i++){let a=rand()*TAU,x=Math.cos(a)*range(5.2,5.7),z=Math.sin(a)*range(3.25,3.9);let m=new THREE.Mesh(mossGeo,mossMat);m.rotation.x=-Math.PI/2;m.scale.set(range(.12,.45),range(.08,.2),1);m.position.set(x,-.245,z);scene.add(m);}
const pondMaterial=new THREE.MeshStandardMaterial({color:0x9bb6a7,roughness:.2,metalness:.12,transparent:true,opacity:.72});
for(let i=0;i<3;i++){let m=new THREE.Mesh(new THREE.CircleGeometry(1,40),pondMaterial);m.rotation.x=-Math.PI/2;m.scale.set(.6+i*.25,.16+i*.07,1);m.position.set(-3+i*2,.012,1.85-i*.65);architecture.add(m);}

// Botanical geometry. Each specimen is instanced to keep a dense garden light.
function leafGeometry(){const g=new THREE.BufferGeometry(),pos=[],norm=[],uv=[],idx=[];let n=10;for(let i=0;i<=n;i++){let t=i/n,w=Math.sin(t*Math.PI)*.48;for(let j=0;j<3;j++){let x=(j-1)*w;pos.push(x,t,.13*Math.sin(Math.PI*t)-Math.abs(x)*.16);uv.push(j/2,t);}}for(let i=0;i<n;i++)for(let j=0;j<2;j++){let a=i*3+j;idx.push(a,a+1,a+3,a+1,a+4,a+3);}g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
const leafGeo=leafGeometry(),stemGeo=new THREE.CylinderGeometry(1,1,1,5),ballGeo=new THREE.IcosahedronGeometry(1,1),flowerGeo=new THREE.IcosahedronGeometry(1,0);
const leafMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.86,side:THREE.DoubleSide});const stemMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});const bloomMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
const dummy=new THREE.Object3D(),up=v(0,1,0),tempColor=new THREE.Color();
function buildPlant(s,index){seed=410+index*139;let group=new THREE.Group(),leaves=[],stems=[],blooms=[];
 function leaf(p,dir,len,width=1,color){let q=new THREE.Quaternion().setFromUnitVectors(up,dir.clone().normalize());leaves.push({p,q,scale:v(len*width,len,len),color:color??s.colors[Math.floor(rand()*s.colors.length)]});}
 function stem(a,b,r=.018,color=0x7b7953){let d=b.clone().sub(a);stems.push({p:a.clone().add(b).multiplyScalar(.5),q:new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize()),scale:v(r,d.length(),r*.85),color});}
 function bloom(p,size,color){blooms.push({p,q:new THREE.Quaternion().setFromEuler(new THREE.Euler(rand()*3,rand()*3,rand()*3)),scale:v(size,size*.7,size),color:color??s.flower?.[Math.floor(rand()*s.flower.length)]??0xd7c497});}
 const kind=s.kind;
 if(['tree','maple','ginkgo'].includes(kind)){
  const h=s.height;let joints=[v(0,0,0),v(.06,h*.37,.03),v(-.06,h*.7,0),v(.07,h*.94,.03)];for(let i=0;i<3;i++)stem(joints[i],joints[i+1],.065-i*.016,0x8f8c6b);
  for(let b=0;b<9;b++){let a=b*2.4,base=v(0,h*(.34+b*.057),0),radius=range(.55,1.15)*(b>6?.7:1),end=v(Math.cos(a)*radius,base.y+range(.35,.7),Math.sin(a)*radius);stem(base,end,.025,0x8f8c6b);
   for(let t=0;t<4;t++){let ang=a+range(-1.6,1.6),p=end.clone().add(v(Math.cos(ang)*.32,range(-.05,.35),Math.sin(ang)*.32));stem(end,p,.009,0x8a8766);
    for(let k=0;k<10;k++){let angle=rand()*TAU,rr=Math.sqrt(rand())*.5;let pos=p.clone().add(v(Math.cos(angle)*rr,range(-.08,.3),Math.sin(angle)*rr));let dir=v(Math.cos(angle),range(.15,.7),Math.sin(angle));leaf(pos,dir,range(.23,.43),kind==='ginkgo'?1.35:kind==='maple'?.7:.9);}
   }
  }
 }else if(kind==='fern'){
  for(let b=0;b<14;b++){let a=b*2.4,len=range(.55,1.05);let prev=v();for(let j=1;j<=10;j++){let t=j/10,p=v(Math.cos(a)*len*t,.95*len*Math.sin(t*1.8),Math.sin(a)*len*t);stem(prev,p,.005,0x75844e);for(let side of [-1,1]){let dir=v(Math.cos(a+.95*side),.15,Math.sin(a+.95*side));leaf(p,dir,.25*Math.sin(t*Math.PI)*len+.04,.42);}prev=p;}}
 }else if(kind==='monstera'||kind==='hosta'){
  for(let j=0;j<(kind==='hosta'?15:11);j++){let a=j*2.4,len=kind==='hosta'?range(.2,.45):range(.5,1.1),tip=v(Math.cos(a)*len*.55,len,Math.sin(a)*len*.55);stem(v(),tip,kind==='hosta'?.007:.018,0x66824f);leaf(tip,v(Math.cos(a),.35,Math.sin(a)),kind==='hosta'?range(.35,.65):range(.65,.95),kind==='hosta'?.65:1.05);}
 }else if(kind==='ivy'||kind==='pothos'){
  for(let b=0;b<8;b++){let a=b*2.4,l=range(1,2.3),prev=v();for(let j=0;j<13;j++){let t=j/12,rr=.12+t*.5,p=v(Math.cos(a)*rr+Math.sin(t*5+b)*.09,.16-Math.pow(t,1.15)*l,Math.sin(a)*rr);stem(prev,p,.007,0x74805c);let side=j%2?1:-1;leaf(p,v(Math.cos(a+side),.15,Math.sin(a+side)),range(.15,kind==='pothos'?.34:.26),kind==='pothos'?1:.8);prev=p;}}
  for(let j=0;j<12;j++){let a=rand()*TAU;leaf(v(Math.cos(a)*.1,.03,Math.sin(a)*.1),v(Math.cos(a),.4,Math.sin(a)),.33,.9);}
 }else if(kind==='grass'||kind==='salvia'){
  for(let j=0;j<(kind==='grass'?38:24);j++){let a=rand()*TAU,h=range(.45,1.2),base=v(range(-.25,.25),0,range(-.25,.25)),tip=base.clone().add(v(Math.cos(a)*.26,h,Math.sin(a)*.26));stem(base,tip,.005,0x899163);for(let k=1;k<=3;k++){let p=base.clone().lerp(tip,k/4);leaf(p,v(Math.cos(a+k),.65,Math.sin(a+k)),kind==='grass'?range(.4,.75):.22,kind==='grass'?.065:.32);}for(let k=0;k<7;k++){let p=tip.clone().add(v(range(-.03,.03),k*.035,range(-.03,.03)));bloom(p,kind==='grass'?.035:.042,kind==='grass'?0xc7bd8e:undefined);}}
 }else if(kind==='hydrangea'){
  for(let j=0;j<9;j++){let a=j*2.4,r=range(.1,.55),tip=v(Math.cos(a)*r,range(.45,.85),Math.sin(a)*r);stem(v(),tip,.015,0x788267);for(let k=0;k<6;k++)leaf(tip.clone().multiplyScalar(.65),v(Math.cos(a+k),.1,Math.sin(a+k)),.45,.8);
  for(let k=0;k<28;k++){let az=rand()*TAU,yy=range(-1,1),rr=Math.sqrt(1-yy*yy)*.22;bloom(tip.clone().add(v(Math.cos(az)*rr,yy*.18,Math.sin(az)*rr)),range(.055,.09));}}
 }else if(kind==='bougain'){
  for(let j=0;j<9;j++){let a=j*2.4,tip=v(Math.cos(a)*range(.4,.9),range(.5,1.25),Math.sin(a)*range(.4,.9));stem(v(),tip,.015,0x8d8167);for(let k=0;k<16;k++){let p=tip.clone().multiplyScalar(range(.35,1)).add(v(range(-.2,.2),range(-.1,.25),range(-.2,.2)));leaf(p,v(Math.cos(a+k),.4,Math.sin(a+k)),range(.16,.28));}for(let k=0;k<20;k++)bloom(tip.clone().add(v(range(-.28,.28),range(-.15,.22),range(-.28,.28))),range(.07,.12));}
 }
 function batch(data,geo,mat){if(!data.length)return;let m=new THREE.InstancedMesh(geo,mat,data.length);data.forEach((t,i)=>{dummy.position.copy(t.p);dummy.quaternion.copy(t.q);dummy.scale.copy(t.scale);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,tempColor.setHex(t.color));});m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;group.add(m);}
 batch(stems,stemGeo,stemMat);batch(leaves,leafGeo,leafMat);batch(blooms,flowerGeo,bloomMat);group.userData.species=s.id;return group;
}
SPECIES.forEach((s,i)=>templates[s.id]=buildPlant(s,i));
const plantsRoot=new THREE.Group();scene.add(plantsRoot);
const ring=new THREE.Mesh(new THREE.RingGeometry(.56,.58,64),new THREE.MeshBasicMaterial({color:0x769b58,transparent:true,opacity:.85,side:THREE.DoubleSide,depthTest:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;ring.renderOrder=10;scene.add(ring);
const previewRing=new THREE.Mesh(new THREE.RingGeometry(.3,.32,48),new THREE.MeshBasicMaterial({color:0x6b8b54,transparent:true,opacity:.6,side:THREE.DoubleSide,depthTest:false}));previewRing.rotation.x=-Math.PI/2;previewRing.visible=false;previewRing.renderOrder=10;scene.add(previewRing);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function inFloor(x,z,level){return Math.abs(x)<=4.98&&Math.abs(z)<=3.02&&!(level===1&&Math.abs(x)<1.4&&Math.abs(z)<.95);}
function floorAtEvent(e,forcedLevel){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const levels=forcedLevel!==undefined?[forcedLevel]:floor==='all'?[1,0]:[Number(floor)];for(const level of levels){const p=raycaster.ray.intersectPlane(new THREE.Plane(v(0,1,0),-level*3.1),v());if(p&&inFloor(p.x,p.z,level))return {x:p.x,z:p.z,level};}return null;}
function pickedPlant(e){floorAtEvent(e);let meshes=[];plantMeshes.forEach((g,id)=>{if(g.visible)g.children.forEach(m=>meshes.push(m));});const hits=raycaster.intersectObjects(meshes,false);return hits[0]?.object.parent.userData.id??null;}
function applyTransform(p,g){g.position.set(p.x,p.level*3.1+.015,p.z);g.rotation.y=p.rotation;g.scale.setScalar(p.scale*state.growth);g.visible=floor==='all'||p.level===Number(floor);}
function renderPlants(){for(const g of plantMeshes.values()){plantsRoot.remove(g);g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}plantMeshes.clear();for(const p of state.plants){let g=templates[p.species].clone(true);g.userData.id=p.id;applyTransform(p,g);plantsRoot.add(g);plantMeshes.set(p.id,g);}updateUI();}
function updateUI(){const kinds=new Set(state.plants.map(p=>p.species)).size;$('gardenCount').textContent=`${state.plants.length} 株植物 · ${kinds} 种生机`;$('growthLabel').textContent=['初夏','盛夏','晚夏','初秋'][state.season%4];$('undo').disabled=!history.length;$('redo').disabled=!future.length;const p=state.plants.find(p=>p.id===selectedId);$('inspector').hidden=!p;$('placementInfo').hidden=!!p;ring.visible=!!p;if(p){ring.position.set(p.x,p.level*3.1+.035,p.z);ring.scale.setScalar(p.scale*1.05);$('selectedName').textContent=speciesMap[p.species].name;$('plantScale').value=p.scale;$('scaleValue').value=Math.round(p.scale*100)+'%';$('plantRotation').value=Math.round(p.rotation/TAU*360)%360;$('rotationValue').value=Math.round(p.rotation/TAU*360)%360+'°';}document.querySelectorAll('.plant-card').forEach(b=>b.classList.toggle('selected',b.dataset.species===plantingId));$('selectTool').classList.toggle('active',mode==='select');$('viewTool').classList.toggle('active',mode==='view');$('hint').textContent=mode==='plant'?`正在种植 ${speciesMap[plantingId].name} · 点击楼面任意位置 · Esc 结束`:(p?'拖动选中的植物移动 · 右侧可调整大小与转向':'拖动空白处旋转视角 · 滚轮缩放 · 右键拖动平移');}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='已自动保存至本机';}catch(e){$('saveStatus').textContent='本机存储不可用，请保存风景';}}
function checkpoint(){history.push(JSON.stringify(state));if(history.length>35)history.shift();future=[];}
function finish(){save();updateUI();}
function setMode(m,id=null){if(m!=='plant')$('placementInfo').innerHTML='<span>↖</span><div><b>自由布置，没有坑位</b><p>选择植物后点击楼面，可连续种植。</p></div>';mode=m;plantingId=id;selectedId=null;previewRing.visible=false;if(ghost){scene.remove(ghost);ghost.traverse(o=>{if(o.isMesh){o.material.dispose();if(o.isInstancedMesh)o.dispose();}});ghost=null;}if(m==='plant'){ghost=templates[id].clone(true);ghost.traverse(obj=>{if(obj.isMesh){obj.material=obj.material.clone();obj.material.transparent=true;obj.material.opacity=.38;obj.castShadow=false;obj.material.depthWrite=false;}});ghost.visible=false;scene.add(ghost);}updateUI();}
function select(id){setMode('select');selectedId=id;updateUI();}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function addPlant(species,pos,scale=1){if(state.plants.length>=110){toast('花园已很繁茂了，移除一些植物再继续吧');return;}checkpoint();let p={id:uid(),species,...pos,scale,rotation:Math.random()*TAU};state.plants.push(p);renderPlants();finish();}
function demo(){const data=[
 ['banyan',-3.7,-1.8,0,.85],['maple',3.4,-1.8,0,.87],['fern',-4.1,1.9,0,1.1],['fern',-3.1,2.1,0,.8],['hosta',-4.2,.6,0,1.1],['monstera',-2.7,-1.7,0,.9],['hydrangea',-3.9,2.7,0,.8],['fern',-2.2,2.65,0,.8],['grass',3.6,2.15,0,1.1],['grass',4.3,2.3,0,.8],['salvia',2.9,2.8,0,.9],['hosta',3.5,.7,0,1.2],['fern',3.6,-.4,0,.8],['monstera',.7,-2.4,0,.85],['hosta',1.6,-2.5,0,.9],
 ['maple',-3.6,-1.9,1,.85],['ginkgo',2.7,-1.9,1,.74],['bougain',4.2,-2.4,1,.9],['bougain',4.1,2.4,1,.8],['hydrangea',-3.5,1.8,1,.8],['hydrangea',-2.6,2.4,1,.7],['salvia',-3.6,-.1,1,.8],['salvia',-4.3,-.35,1,.65],['fern',-4.2,-2.2,1,.85],['hosta',-2.4,-2.55,1,.9],['grass',1.2,-2.5,1,.9],['fern',3.6,-1.4,1,.75],['monstera',2.6,1.65,1,.65],['hosta',3.25,2.5,1,.85],['ivy',-4.5,2.95,1,.95],['ivy',-3.65,3,1,.75],['pothos',-.6,3.0,1,.95],['ivy',.1,3,1,.8],['pothos',4.8,.5,1,.8],['ivy',-4.95,-.35,1,.8],['grass',.5,2.3,1,.6],['hosta',-.2,2.1,1,.75]
 ];state={plants:data.map((d,i)=>({id:uid()+i,species:d[0],x:d[1],z:d[2],level:d[3],scale:d[4],rotation:i*2.399})),growth:1,season:0,light:'day'};}
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Array.isArray(saved.plants)&&saved.plants.every(p=>speciesMap[p.species]&&Number.isFinite(p.x)&&Number.isFinite(p.z))){state=saved;}else{demo();$('welcome').hidden=false;}}catch(e){demo();$('welcome').hidden=false;}
renderPlants();

// A specimen portrait for each card, rendered from the very same 3D model.
function buildCards(){const thumbScene=new THREE.Scene();thumbScene.add(new THREE.HemisphereLight(0xffffed,0x849078,3));let light=new THREE.DirectionalLight(0xfff2d1,3);light.position.set(-4,8,6);thumbScene.add(light);const cam=new THREE.PerspectiveCamera(34,1,.1,30);const oldRatio=renderer.getPixelRatio();renderer.setPixelRatio(1);renderer.setSize(160,160,false);renderer.shadowMap.enabled=false;for(const s of SPECIES){const g=templates[s.id].clone(true);thumbScene.add(g);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(v()),center=bounds.getCenter(v());const extent=Math.max(size.x,size.y,size.z);cam.position.copy(center.clone().add(v(extent*.95,extent*.6,extent*1.7)));cam.lookAt(center);renderer.render(thumbScene,cam);const b=document.createElement('button');b.className='plant-card';b.dataset.species=s.id;b.dataset.category=s.cat;b.setAttribute('aria-label',`种植${s.name}`);b.innerHTML=`<img src="${renderer.domElement.toDataURL()}" alt="${s.name}三维模型"><b>${s.name}</b><small>${s.note}</small>`;b.onclick=()=>{setMode('plant',s.id);$('placementInfo').innerHTML=`<span>＋</span><div><b>${s.name} · ${s.note}</b><p>点击楼面自由种植，拖动空白处仍可旋转。</p></div>`;$('welcome').hidden=true;};$('plantCards').appendChild(b);thumbScene.remove(g);}renderer.shadowMap.enabled=true;renderer.setPixelRatio(oldRatio);}
buildCards();
function resize(){const r=$('viewport').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('viewport'));resize();
function setFloor(value){floor=value;upper.visible=value!=='0';state.plants.forEach(p=>applyTransform(p,plantMeshes.get(p.id)));selectedId=null;document.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',b.dataset.floor===value));if(ghost)ghost.visible=false;previewRing.visible=false;updateUI();}
document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>setFloor(b.dataset.floor));
document.querySelectorAll('.catalog-tabs [data-category]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.catalog-tabs [data-category]').forEach(t=>t.classList.toggle('active',t===b));document.querySelectorAll('.plant-card').forEach(c=>c.hidden=b.dataset.category!=='all'&&c.dataset.category!==b.dataset.category);});
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY};if(mode==='select'){let id=pickedPlant(e);if(id){select(id);const p=state.plants.find(p=>p.id===id);drag={id,startX:p.x,startZ:p.z,moved:false,level:p.level,offset:null};let pt=floorAtEvent(e,p.level);if(pt)drag.offset={x:p.x-pt.x,z:p.z-pt.z};controls.enabled=false;canvas.setPointerCapture(e.pointerId);}}},true);
canvas.addEventListener('pointermove',e=>{if(drag){let p=state.plants.find(p=>p.id===drag.id),pt=floorAtEvent(e,drag.level);if(pt&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>4){let x=pt.x+(drag.offset?.x??0),z=pt.z+(drag.offset?.z??0);if(inFloor(x,z,p.level)){if(!drag.moved){checkpoint();drag.moved=true;}p.x=x;p.z=z;applyTransform(p,plantMeshes.get(p.id));updateUI();}}return;}if(mode==='plant'){let pt=floorAtEvent(e);if(pt&&ghost){ghost.position.set(pt.x,pt.level*3.1+.015,pt.z);ghost.visible=true;previewRing.position.set(pt.x,pt.level*3.1+.035,pt.z);previewRing.visible=true;}else{if(ghost)ghost.visible=false;previewRing.visible=false;}}});
canvas.addEventListener('pointerup',e=>{if(e.button!==0)return;if(drag){if(drag.moved)finish();drag=null;controls.enabled=true;down=null;return;}if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){if(mode==='plant'){let pt=floorAtEvent(e);if(pt){addPlant(plantingId,pt);toast(`${speciesMap[plantingId].name}已种下，可继续自由布置`);}else toast('请点击楼面；一层被挡住时可以切换「一层庭院」');}else if(mode==='select'){const id=pickedPlant(e);select(id);}}down=null;});
canvas.addEventListener('pointercancel',()=>{if(drag?.moved)finish();drag=null;down=null;controls.enabled=true;});canvas.addEventListener('pointerleave',()=>{if(ghost)ghost.visible=false;previewRing.visible=false;});
$('selectTool').onclick=()=>setMode('select');$('viewTool').onclick=()=>setMode('view');$('deselect').onclick=()=>select(null);
$('closeWelcome').onclick=()=>{$('welcome').hidden=true;save();};
for(const [id,prop] of [['plantScale','scale'],['plantRotation','rotation']]){let startValue;$(id).addEventListener('pointerdown',()=>{startValue=null;});$(id).addEventListener('input',()=>{const p=state.plants.find(p=>p.id===selectedId);if(!p)return;if(startValue===undefined||startValue===null){checkpoint();startValue=p[prop];}p[prop]=prop==='scale'?+$(id).value:+$(id).value/360*TAU;applyTransform(p,plantMeshes.get(p.id));updateUI();});$(id).addEventListener('change',()=>{startValue=null;finish();});}
function removeSelected(){if(!selectedId)return;checkpoint();state.plants=state.plants.filter(p=>p.id!==selectedId);selectedId=null;renderPlants();finish();}
$('deletePlant').onclick=removeSelected;
$('duplicate').onclick=()=>{let p=state.plants.find(p=>p.id===selectedId);if(!p)return;if(state.plants.length>=110){toast('请先移除一些植物');return;}checkpoint();let copy={...p,id:uid(),x:Math.min(4.9,p.x+.4),z:Math.min(3,p.z+.25)};if(!inFloor(copy.x,copy.z,copy.level)){copy.x=p.x;copy.z=p.z;}state.plants.push(copy);selectedId=copy.id;renderPlants();finish();toast('已复制，拖动它选择新的位置');};
function undo(){if(!history.length)return;future.push(JSON.stringify(state));state=JSON.parse(history.pop());selectedId=null;renderPlants();setLight(state.light);finish();toast('已撤销');}
function redo(){if(!future.length)return;history.push(JSON.stringify(state));state=JSON.parse(future.pop());selectedId=null;renderPlants();setLight(state.light);finish();toast('已重做');}
$('undo').onclick=undo;$('redo').onclick=redo;
$('clearGarden').onclick=()=>{checkpoint();state.plants=[];selectedId=null;renderPlants();finish();toast('空建筑准备好了 · 可点击撤销恢复');};
$('restoreGarden').onclick=()=>{checkpoint();demo();selectedId=null;renderPlants();setLight('day');finish();toast('示范花园已恢复 · 可继续自由修改');};
function rotateView(angle){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(up,angle);camera.position.copy(controls.target.clone().add(offset));controls.update();}
$('rotateLeft').onclick=()=>rotateView(-Math.PI/6);$('rotateRight').onclick=()=>rotateView(Math.PI/6);
$('homeView').onclick=()=>{camera.position.set(15,12,17);controls.target.set(0,1.9,0);controls.update();};
function zoom(f){let off=camera.position.clone().sub(controls.target).multiplyScalar(f);off.setLength(THREE.MathUtils.clamp(off.length(),8,34));camera.position.copy(controls.target.clone().add(off));controls.update();}
$('zoomIn').onclick=()=>zoom(.85);$('zoomOut').onclick=()=>zoom(1.18);
function setLight(type){const dusk=type==='dusk';state.light=type;sun.color.setHex(dusk?0xffcc91:0xfff5d5);sun.intensity=dusk?2.4:3.6;sun.position.set(dusk?-12:-8,dusk?7:15,8);ambient.intensity=dusk?1.3:2.1;ambient.color.setHex(dusk?0xc3cddd:0xffffec);ground.material.color.setHex(dusk?0xd7d6c8:0xe5e8d9);$('light').innerHTML=dusk?'☾ <span>暮色</span>':'☀ <span>午后</span>';}
setLight(state.light);
$('light').onclick=()=>{setLight(state.light==='day'?'dusk':'day');save();};
$('grow').onclick=()=>{if(state.growth>=1.3){toast('枝叶已充分舒展；仍可单独调整每株大小');return;}checkpoint();state.growth=Math.min(1.3,state.growth+.08);state.season++;state.plants.forEach(p=>applyTransform(p,plantMeshes.get(p.id)));finish();toast('枝叶又舒展了一点');};
const rainN=500,rainPositions=new Float32Array(rainN*6);for(let i=0;i<rainN;i++){let x=range(-8,8),y=range(0,12),z=range(-6,6);rainPositions.set([x,y,z,x-.035,y-.23,z],i*6);}const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rainLines=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0x90aba7,transparent:true,opacity:.45,depthWrite:false}));rainLines.visible=false;scene.add(rainLines);
$('rain').onclick=()=>{rainingUntil=performance.now()+7000;$('rain').classList.add('active');toast('一场雨经过，让花园慢下来');};
$('about').onclick=()=>$('aboutDialog').showModal();$('closeAbout').onclick=()=>$('aboutDialog').close();$('aboutDialog').addEventListener('click',e=>{if(e.target===$('aboutDialog')){let r=$('aboutDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('aboutDialog').close();}});
$('capture').onclick=()=>{let wasRing=ring.visible,wasGhost=ghost?.visible;ring.visible=false;previewRing.visible=false;if(ghost)ghost.visible=false;renderer.render(scene,camera);const c=document.createElement('canvas');c.width=renderer.domElement.width;c.height=renderer.domElement.height+110;let ctx=c.getContext('2d');ctx.fillStyle=state.light==='dusk'?'#dfe1d5':'#e8ecdf';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(renderer.domElement,0,0);ctx.fillStyle='#344a3b';ctx.font='28px SimSun,serif';ctx.fillText('未完之境 · 我的自由花园',35,c.height-60);ctx.font='13px sans-serif';ctx.fillStyle='#7d8972';ctx.fillText(`${state.plants.length} 株植物 / ${new Set(state.plants.map(p=>p.species)).size} 种生机    人停下的地方，自然继续。`,35,c.height-30);const a=document.createElement('a');a.download='未完之境-我的花园.png';a.href=c.toDataURL('image/png');a.click();ring.visible=wasRing;if(ghost)ghost.visible=wasGhost;toast('风景已保存为 PNG 图片');};
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||$('aboutDialog').open)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(e.key==='Escape')setMode('view');else if(e.key.toLowerCase()==='v')setMode('select');else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();}});
let last=performance.now();function animate(now){requestAnimationFrame(animate);let dt=Math.min((now-last)/1000,.05);last=now;controls.update();rainLines.visible=now<rainingUntil;if(rainLines.visible){for(let i=0;i<rainN;i++){let n=i*6;rainPositions[n+1]-=dt*6;rainPositions[n+4]-=dt*6;if(rainPositions[n+1]<-.2){rainPositions[n+1]=12;rainPositions[n+4]=11.77;}}rainGeo.attributes.position.needsUpdate=true;}else $('rain').classList.remove('active');renderer.render(scene,camera);}
requestAnimationFrame(animate);$('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,650);save();updateUI();
