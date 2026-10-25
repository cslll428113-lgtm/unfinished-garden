import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CanvasRenderer } from './canvas-renderer.js';
import { PHOTO_LOOKS, normalizeLook, normalizeStrength, photoLook, paintPhoto } from './photo-looks.js';
import { generateGarden } from './random-garden.js';
import { SEASONS, DECIDUOUS, normalizeSeason, seasonalLook } from './seasons.js';

const $ = id => document.getElementById(id);
const TAU=Math.PI*2, KEY='unfinished-garden-free-v2', MAX_PLANTS=110;
const PLANT_LIMIT_MESSAGE=`已达到 ${MAX_PLANTS} 株上限，请先移除一些植物再种植。`;
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
 {id:'pothos',name:'绿萝',latin:'Epipremnum',cat:'vine',note:'垂坠心叶',colors:[0x638042,0x97a84d,0x7f994d],kind:'pothos',height:1.6},
 {id:'sakura',name:'樱花',latin:'Prunus',cat:'tree',note:'淡粉花枝',colors:[0x87945c,0xabb67d,0x718454],flower:[0xf0c5d3,0xffe2e8,0xd998b0],kind:'sakura',height:2.9},
 {id:'magnolia',name:'白玉兰',latin:'Magnolia',cat:'tree',note:'枝头白瓷',colors:[0x62784c,0x8e9d67,0x7c8b5a],flower:[0xfff4e1,0xe7d9c7,0xf6e9dc],kind:'magnolia',height:2.6},
 {id:'tulip',name:'郁金香',latin:'Tulipa',cat:'flower',note:'杏粉杯盏',colors:[0x648569,0x8fa47e,0x749575],flower:[0xe8a68e,0xf6c1a3,0xd78b93],kind:'tulip',height:.9},
 {id:'daisy',name:'玛格丽特',latin:'Argyranthemum',cat:'flower',note:'奶白小星星',colors:[0x5f8154,0x8a9b69,0x73925d],flower:[0xfff9e6,0xf0e7cd,0xffefdc],kind:'daisy',height:.65},
 {id:'allium',name:'大花葱',latin:'Allium',cat:'flower',note:'紫色星球',colors:[0x6c8979,0x92a58b,0x7c9683],flower:[0xa89bc8,0xc0b1db,0x8e80b4],kind:'allium',height:1.2},
 {id:'muhly',name:'粉黛乱子草',latin:'Muhlenbergia',cat:'leaf',note:'一团玫瑰雾',colors:[0x87956b,0xa8ae86,0x70835f],flower:[0xcc9cae,0xe1b8c6,0xb9859c],kind:'muhly',height:1.2},
 {id:'echeveria',name:'蓝石莲',latin:'Echeveria',cat:'leaf',note:'雾蓝莲座',colors:[0x89a9a5,0xb3c8be,0x779995],kind:'echeveria',height:.35},
 {id:'wisteria',name:'紫藤',latin:'Wisteria',cat:'vine',note:'淡紫花穗瀑布',colors:[0x769253,0xa0af6f,0x607e49],flower:[0xb7a2cd,0xd8c9e7,0x9787b8],kind:'wisteria',height:1.8}
];
const speciesMap=Object.fromEntries(SPECIES.map(s=>[s.id,s]));
let state={plants:[],growth:1,season:'spring',light:'day'},selectedId=null,plantingId=null,mode='select',floor='all';
let history=[],future=[],plantMeshes=new Map(),templates={},ghost=null,drag=null,down=null,isRaining=false;
let seed=42;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}function range(a,b){return a+(b-a)*rand();}
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
let renderer;
try{const surface=document.createElement('canvas'),context=surface.getContext('webgl2',{antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer=context?new THREE.WebGLRenderer({canvas:surface,context,antialias:true,alpha:true,preserveDrawingBuffer:true}):new CanvasRenderer();}catch(e){renderer=new CanvasRenderer();}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
$('viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe9eddf,38,75);
const camera=new THREE.PerspectiveCamera(33,1,.1,100);camera.position.set(15,12,17);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.9,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=8;controls.maxDistance=34;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.485;controls.enablePan=true;controls.panSpeed=.6;controls.rotateSpeed=.7;controls.zoomSpeed=.7;
const ambient=new THREE.HemisphereLight(0xffffec,0x8f9f86,2.1);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xfff5d5,3.6);sun.position.set(-8,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:45});sun.shadow.normalBias=.02;sun.shadow.bias=-.00015;sun.shadow.radius=2.5;scene.add(sun);
const fill=new THREE.DirectionalLight(0xd9e9d7,.7);fill.position.set(8,6,-8);scene.add(fill);
function concreteTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#e2e3dd';ctx.fillRect(0,0,256,256);for(let i=0;i<14000;i++){const n=Math.floor(range(100,200));ctx.fillStyle=`rgba(${n},${n},${n-10},${range(.02,.1)})`;ctx.fillRect(rand()*256,rand()*256,rand()*2+.5,rand()*2+.5);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.SRGBColorSpace;return t;}
const concrete=new THREE.MeshStandardMaterial({color:0xe5e6de,map:concreteTexture(),roughness:1});
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
// Snow follows each existing slab, wall and stair; it never fills the courtyard opening.
const snowCaps=[],snowMaterial=new THREE.MeshStandardMaterial({color:0xf4f7f7,roughness:1});
const snowSurfaces=[];architecture.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry')snowSurfaces.push(o);});
for(const surface of snowSurfaces){const {width,height,depth}=surface.geometry.parameters;const cap=new THREE.Mesh(new THREE.BoxGeometry(width,.035,depth),snowMaterial);cap.position.copy(surface.position);cap.position.y+=height/2+.0175;cap.receiveShadow=true;cap.visible=false;surface.parent.add(cap);snowCaps.push(cap);}
const litterGround=new THREE.Group(),litterUpper=new THREE.Group();architecture.add(litterGround);upper.add(litterUpper);

// Botanical geometry. Each specimen is instanced to keep a dense garden light.
function leafGeometry(){const g=new THREE.BufferGeometry(),pos=[],norm=[],uv=[],idx=[];let n=10;for(let i=0;i<=n;i++){let t=i/n,w=Math.sin(t*Math.PI)*.48;for(let j=0;j<3;j++){let x=(j-1)*w;pos.push(x,t,.13*Math.sin(Math.PI*t)-Math.abs(x)*.16);uv.push(j/2,t);}}for(let i=0;i<n;i++)for(let j=0;j<2;j++){let a=i*3+j;idx.push(a,a+1,a+3,a+1,a+4,a+3);}g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
const leafGeo=leafGeometry(),stemGeo=new THREE.CylinderGeometry(1,1,1,5),ballGeo=new THREE.IcosahedronGeometry(1,1),flowerGeo=new THREE.IcosahedronGeometry(1,0);
const leafMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.86,side:THREE.DoubleSide});const stemMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});const bloomMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
const dummy=new THREE.Object3D(),up=v(0,1,0),tempColor=new THREE.Color();
const petalMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8,side:THREE.DoubleSide});
function buildPlant(s,index){seed=410+index*139;let group=new THREE.Group(),leaves=[],stems=[],blooms=[],petals=[];
 function leaf(p,dir,len,width=1,color){let q=new THREE.Quaternion().setFromUnitVectors(up,dir.clone().normalize());leaves.push({p,q,scale:v(len*width,len,len),color:color??s.colors[Math.floor(rand()*s.colors.length)]});}
 function stem(a,b,r=.018,color=0x7b7953){let d=b.clone().sub(a);stems.push({p:a.clone().add(b).multiplyScalar(.5),q:new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize()),scale:v(r,d.length(),r*.85),color});}
 function bloom(p,size,color){blooms.push({p,q:new THREE.Quaternion().setFromEuler(new THREE.Euler(rand()*3,rand()*3,rand()*3)),scale:v(size,size*.7,size),color:color??s.flower?.[Math.floor(rand()*s.flower.length)]??0xd7c497});}
 function petal(p,dir,len,width,color){petals.push({p:p.clone(),q:new THREE.Quaternion().setFromUnitVectors(up,dir.clone().normalize()),scale:v(len*width,len,len),color:color??s.flower[Math.floor(rand()*s.flower.length)]});}
 function blossom(p,r,count=5,tilt=.2){const offset=rand()*TAU;for(let k=0;k<count;k++){const a=offset+k*TAU/count;petal(p,v(Math.cos(a),tilt,Math.sin(a)),r,.85);}bloom(p.clone().add(v(0,.015,0)),r*.17,0xd9b66a);}
 const kind=s.kind;
 if(kind==='sakura'||kind==='magnolia'){
  const h=s.height;stem(v(),v(.06,h*.8,0),.06,0x8a776b);
  for(let b=0;b<8;b++){const a=b*2.399,base=v(.03,h*(.32+b*.06),0),tip=v(Math.cos(a)*range(.65,1.05),base.y+.5,Math.sin(a)*range(.65,1.05));stem(base,tip,.025,0x8a776b);
   for(let k=0;k<4;k++){const t=a+k*1.6,p=tip.clone().add(v(Math.cos(t)*.32,range(.03,.34),Math.sin(t)*.32));stem(tip,p,.008,0x9c8a7a);
    if(kind==='sakura'){for(let j=0;j<4;j++)blossom(p.clone().add(v(range(-.2,.2),range(-.08,.15),range(-.2,.2))),range(.09,.14));for(let j=0;j<9;j++){const a=t+j*2.4;leaf(p.clone().add(v(Math.cos(a)*.17,range(-.05,.18),Math.sin(a)*.17)),v(Math.cos(a),.3,Math.sin(a)),range(.2,.34),.6);}}
    else{blossom(p,.24,7,1.25);for(let j=0;j<5;j++){const a=t+j*2.4;leaf(p.clone().add(v(Math.cos(a)*.12,-.16,Math.sin(a)*.12)),v(Math.cos(a),.1,Math.sin(a)),.36,.7);}}
   }
  }
 }else if(kind==='tulip'||kind==='daisy'||kind==='allium'){
  const count=kind==='daisy'?14:kind==='tulip'?9:7;
  for(let j=0;j<count;j++){const a=j*2.399,r=Math.sqrt(rand())*.4,base=v(Math.cos(a)*r,0,Math.sin(a)*r),h=range(.55,1)*(kind==='daisy'?.65:kind==='allium'?1.2:1),tip=base.clone().add(v(Math.cos(a)*.07,h,Math.sin(a)*.07));stem(base,tip,.008,0x708760);
   for(let k=0;k<3;k++)leaf(base.clone().lerp(tip,.12+k*.16),v(Math.cos(a+k*2),.7,Math.sin(a+k*2)),kind==='daisy'?.18:.42,kind==='daisy'?.35:.2);
   if(kind==='tulip'){for(let k=0;k<6;k++){const t=k*TAU/6;petal(tip.clone().add(v(Math.cos(t)*.025,0,Math.sin(t)*.025)),v(Math.cos(t)*.36,1,Math.sin(t)*.36),.23,1.1,s.flower[j%s.flower.length]);}}
   else if(kind==='daisy')blossom(tip,.14,12,.05);
   else for(let k=0;k<42;k++){const y=1-2*(k+.5)/42,t=k*2.399,rr=Math.sqrt(1-y*y);bloom(tip.clone().add(v(Math.cos(t)*rr*.18,y*.18,Math.sin(t)*rr*.18)),.034);}
  }
 }else if(kind==='muhly'){
  for(let j=0;j<32;j++){const a=j*2.399,base=v(range(-.2,.2),0,range(-.2,.2)),tip=v(Math.cos(a)*range(.3,.65),range(.65,1.15),Math.sin(a)*range(.3,.65));stem(base,tip,.003,0xac999a);leaf(base,v(Math.cos(a),1,Math.sin(a)),range(.4,.7),.04);
   for(let k=0;k<6;k++){const t=a+k*1.2,p=tip.clone().add(v(Math.cos(t)*range(.05,.2),range(-.1,.2),Math.sin(t)*range(.05,.2)));stem(tip,p,.002,0xc7a5af);bloom(p,range(.025,.045));}
  }
 }else if(kind==='echeveria'){
  for(let c=0;c<4;c++){const a=c*2.399,center=v(c?Math.cos(a)*.3:0,c?.025:.055,c?Math.sin(a)*.3:0),size=c?.75:1;
   for(let layer=0;layer<4;layer++)for(let j=0;j<9-layer;j++){const t=j*TAU/(9-layer)+layer*.45;petal(center.clone().add(v(0,layer*.035,0)),v(Math.cos(t),.2+layer*.35,Math.sin(t)),(.34-layer*.055)*size,.95,s.colors[(j+layer)%s.colors.length]);}
  }
 }else if(kind==='wisteria'){
  for(let b=0;b<7;b++){const a=b*2.399,tip=v(Math.cos(a)*range(.4,.85),range(.08,.3),Math.sin(a)*range(.4,.85));stem(v(),tip,.012,0x827d60);
   for(let k=0;k<8;k++){const p=tip.clone().multiplyScalar(k/8);leaf(p,v(Math.cos(a+(k%2?1:-1)),.35,Math.sin(a+(k%2?1:-1))),.27,.45);}
   for(let c=0;c<2;c++){const start=tip.clone().add(v(c*.14,0,-c*.1)),len=range(.7,1.5);stem(start,start.clone().add(v(.04,-len,0)),.005,0x8e9879);
    for(let j=0;j<13;j++){const t=j/13,rr=.13*(1-t)+.02,p=start.clone().add(v(.04*t,-len*t,0));for(let k=0;k<3;k++){const angle=j*2.4+k*TAU/3;petal(p,v(Math.cos(angle)*.75,-.6,Math.sin(angle)*.75),rr,.9);}}
   }
  }
 }else if(['tree','maple','ginkgo'].includes(kind)){
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
 function batch(data,geo,mat,part){if(!data.length)return;let m=new THREE.InstancedMesh(geo,mat,data.length);m.userData.part=part;data.forEach((t,i)=>{dummy.position.copy(t.p);dummy.quaternion.copy(t.q);dummy.scale.copy(t.scale);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,tempColor.setHex(t.color));});m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;group.add(m);}
 batch(stems,stemGeo,stemMat,'stem');batch(leaves,leafGeo,leafMat,'leaf');batch(blooms,flowerGeo,bloomMat,'flower');batch(petals,leafGeo,petalMat,kind==='echeveria'?'leaf':'flower');group.userData.species=s.id;return group;
}
SPECIES.forEach((s,i)=>templates[s.id]=buildPlant(s,i));
const seasonalTemplates={};
function plantTemplate(id){
 const key=state.season+':'+id;if(seasonalTemplates[key])return seasonalTemplates[key];
 const template=templates[id].clone(true),matrix=new THREE.Matrix4(),color=new THREE.Color();
 template.children.forEach((mesh,i)=>{
  const original=templates[id].children[i],look=seasonalLook(id,mesh.userData.part,state.season);
  mesh.instanceMatrix=original.instanceMatrix.clone();mesh.instanceColor=original.instanceColor.clone();
  mesh.count=Math.round(original.count*look.fraction);mesh.scale.y=look.height;
  for(let n=0;n<mesh.count;n++){const source=Math.floor(n*original.count/mesh.count);original.getMatrixAt(source,matrix);original.getColorAt(source,color);if(look.tint!==null)color.lerp(new THREE.Color(look.tint),look.mix);mesh.setMatrixAt(n,matrix);mesh.setColorAt(n,color);}
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
 });
 seasonalTemplates[key]=template;return template;
}
function refreshLitter(){
 for(const group of [litterGround,litterUpper]){for(const child of [...group.children]){group.remove(child);child.dispose();}}
 if(!['spring','autumn'].includes(state.season))return;
 const perLevel=[[],[]];
 for(const p of state.plants){if(state.season==='autumn'?!DECIDUOUS.has(p.species):!['sakura','magnolia','wisteria'].includes(p.species))continue;
  const count=state.season==='autumn'?18:10;for(let j=0;j<count;j++){const a=j*2.399+p.rotation,r=(.25+(j%7)*.14)*p.scale,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(inFloor(x,z,p.level))perLevel[p.level].push({x,z,a,size:(state.season==='autumn'?.13:.08)*p.scale,color:state.season==='spring'?0xe6bcca:p.species==='ginkgo'?0xd7ae47:0xbf7945});}
 }
 perLevel.forEach((items,level)=>{if(!items.length)return;const mesh=new THREE.InstancedMesh(leafGeo,leafMat,items.length);items.forEach((p,i)=>{dummy.position.set(p.x,level*3.1+.015,p.z);dummy.rotation.set(-Math.PI/2,0,p.a);dummy.scale.set(p.size*.75,p.size,p.size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,tempColor.setHex(p.color));});mesh.instanceMatrix.needsUpdate=true;(level?litterUpper:litterGround).add(mesh);});
}
const plantsRoot=new THREE.Group();scene.add(plantsRoot);
const ring=new THREE.Mesh(new THREE.RingGeometry(.56,.58,64),new THREE.MeshBasicMaterial({color:0x769b58,transparent:true,opacity:.85,side:THREE.DoubleSide,depthTest:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;ring.renderOrder=10;scene.add(ring);
const previewRing=new THREE.Mesh(new THREE.RingGeometry(.3,.32,48),new THREE.MeshBasicMaterial({color:0x6b8b54,transparent:true,opacity:.6,side:THREE.DoubleSide,depthTest:false}));previewRing.rotation.x=-Math.PI/2;previewRing.visible=false;previewRing.renderOrder=10;scene.add(previewRing);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function inFloor(x,z,level){return Math.abs(x)<=4.98&&Math.abs(z)<=3.02&&!(level===1&&Math.abs(x)<1.4&&Math.abs(z)<.95);}
function floorAtEvent(e,forcedLevel){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const levels=forcedLevel!==undefined?[forcedLevel]:floor==='all'?[1,0]:[Number(floor)];for(const level of levels){const p=raycaster.ray.intersectPlane(new THREE.Plane(v(0,1,0),-level*3.1),v());if(p&&inFloor(p.x,p.z,level))return {x:p.x,z:p.z,level};}return null;}
function pickedPlant(e){floorAtEvent(e);let meshes=[];plantMeshes.forEach((g,id)=>{if(g.visible)g.children.forEach(m=>meshes.push(m));});const hits=raycaster.intersectObjects(meshes,false);return hits[0]?.object.parent.userData.id??null;}
function applyTransform(p,g){g.position.set(p.x,p.level*3.1+.015,p.z);g.rotation.y=p.rotation;g.scale.setScalar(p.scale*state.growth);g.visible=floor==='all'||p.level===Number(floor);}
function renderPlants(){for(const g of plantMeshes.values()){plantsRoot.remove(g);g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}plantMeshes.clear();for(const p of state.plants){let g=plantTemplate(p.species).clone(true);g.userData.id=p.id;applyTransform(p,g);plantsRoot.add(g);plantMeshes.set(p.id,g);}refreshLitter();updateUI();}
function updateUI(){const kinds=new Set(state.plants.map(p=>p.species)).size;$('gardenCount').textContent=`${state.plants.length} / ${MAX_PLANTS} 株植物 · ${kinds} 种生机`;$('growthLabel').textContent=SEASONS[state.season].title;$('undo').disabled=!history.length;$('redo').disabled=!future.length;const p=state.plants.find(p=>p.id===selectedId);$('inspector').hidden=!p;$('placementInfo').hidden=!!p;ring.visible=!!p;if(p){ring.position.set(p.x,p.level*3.1+.035,p.z);ring.scale.setScalar(p.scale*1.05);$('selectedName').textContent=speciesMap[p.species].name;$('plantScale').value=p.scale;$('scaleValue').value=Math.round(p.scale*100)+'%';$('plantRotation').value=Math.round(p.rotation/TAU*360)%360;$('rotationValue').value=Math.round(p.rotation/TAU*360)%360+'°';}document.querySelectorAll('.plant-card').forEach(b=>b.classList.toggle('selected',b.dataset.species===plantingId));$('selectTool').classList.toggle('active',mode==='select');$('viewTool').classList.toggle('active',mode==='view');$('hint').textContent=mode==='plant'?`正在种植 ${speciesMap[plantingId].name} · 点击楼面任意位置 · Esc 结束`:(p?'拖动选中的植物移动 · 右侧可调整大小与转向':'拖动空白处旋转视角 · 滚轮缩放 · 右键拖动平移');}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='已自动保存至本机';}catch(e){$('saveStatus').textContent='本机存储不可用，请保存风景';}}
function checkpoint(){history.push(JSON.stringify(state));if(history.length>35)history.shift();future=[];}
function finish(){refreshLitter();save();updateUI();}
function setMode(m,id=null){if(m!=='plant')$('placementInfo').innerHTML='<span>↖</span><div><b>自由布置，没有坑位</b><p>选择植物后点击楼面，可连续种植。</p></div>';mode=m;plantingId=id;selectedId=null;previewRing.visible=false;if(ghost){scene.remove(ghost);ghost.traverse(o=>{if(o.isMesh){o.material.dispose();if(o.isInstancedMesh)o.dispose();}});ghost=null;}if(m==='plant'){ghost=plantTemplate(id).clone(true);ghost.traverse(obj=>{if(obj.isMesh){obj.material=obj.material.clone();obj.material.transparent=true;obj.material.opacity=.38;obj.castShadow=false;obj.material.depthWrite=false;}});ghost.visible=false;scene.add(ghost);}updateUI();}
function select(id){setMode('select');selectedId=id;updateUI();}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function addPlant(species,pos,scale=1){if(state.plants.length>=MAX_PLANTS){toast(PLANT_LIMIT_MESSAGE);return false;}checkpoint();let p={id:uid(),species,...pos,scale,rotation:Math.random()*TAU};state.plants.push(p);renderPlants();finish();return true;}
function demo(){const data=[
 ['banyan',-3.7,-1.8,0,.85],['maple',3.4,-1.8,0,.87],['fern',-4.1,1.9,0,1.1],['fern',-3.1,2.1,0,.8],['hosta',-4.2,.6,0,1.1],['monstera',-2.7,-1.7,0,.9],['hydrangea',-3.9,2.7,0,.8],['fern',-2.2,2.65,0,.8],['grass',3.6,2.15,0,1.1],['grass',4.3,2.3,0,.8],['salvia',2.9,2.8,0,.9],['hosta',3.5,.7,0,1.2],['fern',3.6,-.4,0,.8],['monstera',.7,-2.4,0,.85],['hosta',1.6,-2.5,0,.9],
 ['sakura',-3.6,-1.9,1,.85],['magnolia',2.7,-1.9,1,.85],['bougain',4.2,-2.4,1,.9],['bougain',4.1,2.4,1,.8],['hydrangea',-3.5,1.8,1,.8],['hydrangea',-2.6,2.4,1,.7],['allium',-3.6,-.1,1,.8],['salvia',-4.3,-.35,1,.65],['fern',-4.2,-2.2,1,.85],['hosta',-2.4,-2.55,1,.9],['muhly',1.2,-2.5,1,.9],['fern',3.6,-1.4,1,.75],['monstera',2.6,1.65,1,.65],['hosta',3.25,2.5,1,.85],['ivy',-4.5,2.95,1,.95],['wisteria',-3.65,3,1,.75],['pothos',-.6,3.0,1,.95],['ivy',.1,3,1,.8],['pothos',4.8,.5,1,.8],['ivy',-4.95,-.35,1,.8],['tulip',.5,2.3,1,.9],['daisy',-.2,2.1,1,.9],['echeveria',2.1,2.7,1,.95]
 ];state={plants:data.map((d,i)=>({id:uid()+i,species:d[0],x:d[1],z:d[2],level:d[3],scale:d[4],rotation:i*2.399})),growth:1,season:'spring',light:'day'};}
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Array.isArray(saved.plants)&&saved.plants.every(p=>speciesMap[p.species]&&Number.isFinite(p.x)&&Number.isFinite(p.z))){state=saved;}else{demo();$('welcome').hidden=false;}}catch(e){demo();$('welcome').hidden=false;}
state.season=normalizeSeason(state.season);state.light=normalizeLook(state.light);state.photoStrength=normalizeStrength(state.photoStrength);
renderPlants();

// A specimen portrait for each card, rendered from the very same 3D model.
function buildCards(){const thumbScene=new THREE.Scene();thumbScene.add(new THREE.HemisphereLight(0xffffed,0x849078,3));let light=new THREE.DirectionalLight(0xfff2d1,3);light.position.set(-4,8,6);thumbScene.add(light);const cam=new THREE.PerspectiveCamera(34,1,.1,30);const oldRatio=renderer.getPixelRatio();renderer.setPixelRatio(1);renderer.setSize(160,160,false);renderer.shadowMap.enabled=false;for(const s of [...SPECIES.slice(12),...SPECIES.slice(0,12)]){const g=templates[s.id].clone(true);thumbScene.add(g);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(v()),center=bounds.getCenter(v());const extent=Math.max(size.x,size.y,size.z);cam.position.copy(center.clone().add(v(extent*.95,extent*.6,extent*1.7)));cam.lookAt(center);renderer.render(thumbScene,cam);const b=document.createElement('button');b.className='plant-card';b.dataset.species=s.id;b.dataset.category=s.cat;b.setAttribute('aria-label',`种植${s.name}`);b.innerHTML=`<img src="${renderer.domElement.toDataURL()}" alt="${s.name}三维模型"><b>${s.name}</b><small>${s.note}</small>`;b.onclick=()=>{setMode('plant',s.id);$('placementInfo').innerHTML=`<span>＋</span><div><b>${s.name} · ${s.note}</b><p>点击楼面自由种植，拖动空白处仍可旋转。</p></div>`;$('welcome').hidden=true;};$('plantCards').appendChild(b);thumbScene.remove(g);}renderer.shadowMap.enabled=true;renderer.setPixelRatio(oldRatio);}
buildCards();
function resize(){const r=$('viewport').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('viewport'));resize();
function setFloor(value){floor=value;upper.visible=value!=='0';state.plants.forEach(p=>applyTransform(p,plantMeshes.get(p.id)));selectedId=null;document.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',b.dataset.floor===value));if(ghost)ghost.visible=false;previewRing.visible=false;updateUI();}
document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>setFloor(b.dataset.floor));
document.querySelectorAll('.catalog-tabs [data-category]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.catalog-tabs [data-category]').forEach(t=>t.classList.toggle('active',t===b));document.querySelectorAll('.plant-card').forEach(c=>c.hidden=b.dataset.category!=='all'&&c.dataset.category!==b.dataset.category);});
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY};if(mode==='select'){let id=pickedPlant(e);if(id){select(id);const p=state.plants.find(p=>p.id===id);drag={id,startX:p.x,startZ:p.z,moved:false,level:p.level,offset:null};let pt=floorAtEvent(e,p.level);if(pt)drag.offset={x:p.x-pt.x,z:p.z-pt.z};controls.enabled=false;canvas.setPointerCapture(e.pointerId);}}},true);
canvas.addEventListener('pointermove',e=>{if(drag){let p=state.plants.find(p=>p.id===drag.id),pt=floorAtEvent(e,drag.level);if(pt&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>4){let x=pt.x+(drag.offset?.x??0),z=pt.z+(drag.offset?.z??0);if(inFloor(x,z,p.level)){if(!drag.moved){checkpoint();drag.moved=true;}p.x=x;p.z=z;applyTransform(p,plantMeshes.get(p.id));updateUI();}}return;}if(mode==='plant'){let pt=floorAtEvent(e);if(pt&&ghost){ghost.position.set(pt.x,pt.level*3.1+.015,pt.z);ghost.visible=true;previewRing.position.set(pt.x,pt.level*3.1+.035,pt.z);previewRing.visible=true;}else{if(ghost)ghost.visible=false;previewRing.visible=false;}}});
canvas.addEventListener('pointerup',e=>{if(e.button!==0)return;if(drag){if(drag.moved)finish();drag=null;controls.enabled=true;down=null;return;}if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){if(mode==='plant'){let pt=floorAtEvent(e);if(pt){if(addPlant(plantingId,pt))toast(`${speciesMap[plantingId].name}已种下，可继续自由布置`);}else toast('请点击楼面；一层被挡住时可以切换「一层庭院」');}else if(mode==='select'){const id=pickedPlant(e);select(id);}}down=null;});
canvas.addEventListener('pointercancel',()=>{if(drag?.moved)finish();drag=null;down=null;controls.enabled=true;});canvas.addEventListener('pointerleave',()=>{if(ghost)ghost.visible=false;previewRing.visible=false;});
$('selectTool').onclick=()=>setMode('select');$('viewTool').onclick=()=>setMode('view');$('deselect').onclick=()=>select(null);
$('closeWelcome').onclick=()=>{$('welcome').hidden=true;save();};
for(const [id,prop] of [['plantScale','scale'],['plantRotation','rotation']]){let startValue;$(id).addEventListener('pointerdown',()=>{startValue=null;});$(id).addEventListener('input',()=>{const p=state.plants.find(p=>p.id===selectedId);if(!p)return;if(startValue===undefined||startValue===null){checkpoint();startValue=p[prop];}p[prop]=prop==='scale'?+$(id).value:+$(id).value/360*TAU;applyTransform(p,plantMeshes.get(p.id));updateUI();});$(id).addEventListener('change',()=>{startValue=null;finish();});}
function removeSelected(){if(!selectedId)return;checkpoint();state.plants=state.plants.filter(p=>p.id!==selectedId);selectedId=null;renderPlants();finish();}
$('deletePlant').onclick=removeSelected;
$('duplicate').onclick=()=>{let p=state.plants.find(p=>p.id===selectedId);if(!p)return;if(state.plants.length>=MAX_PLANTS){toast(PLANT_LIMIT_MESSAGE);return;}checkpoint();let copy={...p,id:uid(),x:Math.min(4.9,p.x+.4),z:Math.min(3,p.z+.25)};if(!inFloor(copy.x,copy.z,copy.level)){copy.x=p.x;copy.z=p.z;}state.plants.push(copy);selectedId=copy.id;renderPlants();finish();toast('已复制，拖动它选择新的位置');};
function undo(){if(!history.length)return;future.push(JSON.stringify(state));state=JSON.parse(history.pop());selectedId=null;applySeason();finish();toast('已撤销');}
function redo(){if(!future.length)return;history.push(JSON.stringify(state));state=JSON.parse(future.pop());selectedId=null;applySeason();finish();toast('已重做');}
$('undo').onclick=undo;$('redo').onclick=redo;
$('clearGarden').onclick=()=>{checkpoint();state.plants=[];selectedId=null;renderPlants();finish();toast('空建筑准备好了 · 可点击撤销恢复');};
$('restoreGarden').onclick=()=>{checkpoint();demo();setRain(false);selectedId=null;applySeason();finish();toast('示范花园已恢复 · 可继续自由修改');};
function rotateView(angle){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(up,angle);camera.position.copy(controls.target.clone().add(offset));controls.update();}
$('rotateLeft').onclick=()=>rotateView(-Math.PI/6);$('rotateRight').onclick=()=>rotateView(Math.PI/6);
$('homeView').onclick=()=>{camera.position.set(15,12,17);controls.target.set(0,1.9,0);controls.update();};
function zoom(f){let off=camera.position.clone().sub(controls.target).multiplyScalar(f);off.setLength(THREE.MathUtils.clamp(off.length(),8,34));camera.position.copy(controls.target.clone().add(off));controls.update();}
$('zoomIn').onclick=()=>zoom(.85);$('zoomOut').onclick=()=>zoom(1.18);
let currentLook;
function setLight(type){
 state.light=normalizeLook(type);state.photoStrength=state.light==='day'?1:normalizeStrength(state.photoStrength);
 currentLook=photoLook(state.season,state.light,state.photoStrength);const look=currentLook;
 document.body.dataset.light=state.light;
 scene.userData.photoLook=look;scene.userData.backdropColor=look.bottom;
 sun.color.set(look.sun);sun.intensity=look.sunPower;sun.position.set(...look.position);
 ambient.color.set(look.sky);ambient.intensity=look.ambient;ambient.groundColor.set(look.bounce);
 fill.color.set(look.fill);fill.intensity=look.fillPower;
 concrete.color.set(look.concrete);ground.material.color.set(look.ground);snowMaterial.color.setHex(0xf0f4f7);
 scene.fog.color.set(look.bottom);scene.fog.near=look.fogNear;scene.fog.far=look.fogFar;
 renderer.toneMappingExposure=look.exposure;
 renderer.domElement.style.filter=look.filter;
 $('viewport').style.background=`linear-gradient(180deg,${look.top},${look.bottom})`;
 $('photoVignette').style.background=`radial-gradient(circle farthest-corner at center,rgba(29,39,47,0) 55%,${look.vignetteColor} 100%)`;
 $('light').innerHTML=`◈ <span>${look.name}</span>`;
 $('photoStyleName').textContent=look.name;$('photoStyleNote').textContent=look.note;
 $('photoStrength').value=Math.round(state.photoStrength*100);$('photoStrengthValue').textContent=Math.round(state.photoStrength*100)+'%';
 $('photoStrength').disabled=state.light==='day';
 document.querySelectorAll('[data-photo-look]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoLook===state.light)));
}
for(const [id,look] of Object.entries(PHOTO_LOOKS)){
 const button=document.createElement('button');button.className='photo-look';button.dataset.photoLook=id;
 button.setAttribute('aria-label',look.name+'滤镜');button.setAttribute('aria-pressed','false');
 button.innerHTML=`<span class="look-swatch" style="--swatch-top:${look.swatch[0]};--swatch-bottom:${look.swatch[1]}"><i>${look.icon}</i><span></span></span><b>${look.name}</b>`;
 button.onclick=()=>{if(state.light===id)return;checkpoint();setLight(id);save();updateUI();};$('photoLooks').appendChild(button);
}
function photoPanel(open){$('photoPanel').hidden=!open;$('light').setAttribute('aria-expanded',String(open));}
$('light').onclick=()=>photoPanel($('photoPanel').hidden);
$('closePhoto').onclick=()=>photoPanel(false);
let strengthCheckpoint=false;
$('photoStrength').addEventListener('input',()=>{if(!strengthCheckpoint){checkpoint();strengthCheckpoint=true;}state.photoStrength=+$('photoStrength').value/100;setLight(state.light);updateUI();});
$('photoStrength').addEventListener('change',()=>{strengthCheckpoint=false;save();});
$('resetPhoto').onclick=()=>{checkpoint();state.photoStrength=1;setLight('day');save();updateUI();toast('已恢复晴日原色');};
setLight(state.light);
$('grow').onclick=()=>{if(state.growth>=1.3){toast('枝叶已充分舒展；仍可单独调整每株大小');return;}checkpoint();state.growth=Math.min(1.3,state.growth+.08);state.plants.forEach(p=>applyTransform(p,plantMeshes.get(p.id)));finish();toast('枝叶又舒展了一点');};
const rainN=500,rainPositions=new Float32Array(rainN*6);for(let i=0;i<rainN;i++){let x=range(-8,8),y=range(0,12),z=range(-6,6);rainPositions.set([x,y,z,x-.035,y-.23,z],i*6);}const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rainLines=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0x90aba7,transparent:true,opacity:.45,depthWrite:false}));rainLines.visible=false;scene.add(rainLines);
// Weather is an explicit toggle, independent of frame rate and garden undo.
function setRain(enabled){
 isRaining=enabled;
 rainLines.visible=enabled;
 $('rain').classList.toggle('active',enabled);
 $('rain').setAttribute('aria-pressed',String(enabled));
  const snow=state.season==='winter',word=snow?'雪':'雨';
 $('rain').title=enabled?'停止下'+word:'开始下'+word;
 $('rain').innerHTML=(snow?'❄':'☂')+' <span>'+(enabled?'停止下'+word:'下一场'+word)+'</span>';
 rainLines.material.color.setHex(snow?0xffffff:0x90aba7);
 rainLines.material.opacity=snow?.9:.45;
 rainLines.material.linewidth=snow?2:1;
 rainGeo.setDrawRange(0,(snow?300:rainN)*2);
 for(let i=0;i<rainN;i++){const n=i*6;rainPositions[n+3]=rainPositions[n]+(snow?.035:-.035);rainPositions[n+4]=rainPositions[n+1]-(snow?.035:.23);rainPositions[n+5]=rainPositions[n+2];}
 rainGeo.attributes.position.needsUpdate=true;
}
rainLines.frustumCulled=false;
setRain(false);
$('rain').onclick=()=>{setRain(!isRaining);const word=state.season==='winter'?'雪':'雨';toast(isRaining?word+'落下了 · 再点一次即可停止':word+'停了，继续布置你的花园吧');};
function applySeason(){
 state.season=normalizeSeason(state.season);
 const palette=SEASONS[state.season],winter=state.season==='winter';
 document.body.dataset.season=state.season;
 $('seasonTitle').textContent=palette.title;
 $('seasonDescription').textContent=palette.note;
 document.querySelectorAll('[data-season-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.seasonChoice===state.season)));
 snowCaps.forEach(cap=>cap.visible=winter);
 pondMaterial.color.setHex(winter?0xc0d4df:0x9bb6a7);
 pondMaterial.opacity=winter?.3:.72;
 scene.fog.color.set(palette.paper);
 setLight(state.light);setRain(isRaining);renderPlants();
 // Recreate any planting preview so its foliage matches the chosen season.
 if(plantingId)setMode('plant',plantingId);
 document.querySelectorAll('.plant-card').forEach(card=>{
  const s=speciesMap[card.dataset.species],leaf=seasonalLook(s.id,'leaf',state.season),flower=seasonalLook(s.id,'flower',state.season);
  card.querySelector('small').textContent=winter&&leaf.fraction===0?'落叶休眠':s.flower&&flower.fraction===0?'本季无花':s.note;
 });
}
document.querySelectorAll('[data-season-choice]').forEach(button=>button.onclick=()=>{
 const next=button.dataset.seasonChoice;if(next===state.season)return;
 checkpoint();state.season=next;applySeason();finish();toast(SEASONS[next].title+' · '+SEASONS[next].note);
});
applySeason();
// A draw is a draft. Only accepting it changes state, history or local storage.
let gardenDraw=null,lastDrawTheme=null;
function gardenPortrait(plants){
 const draft=new THREE.Group();
 for(const p of plants){const g=plantTemplate(p.species).clone(true);g.userData.id=p.id;g.position.set(p.x,p.level*3.1+.015,p.z);g.rotation.y=p.rotation;g.scale.setScalar(p.scale);draft.add(g);}
 const hidden=[plantsRoot,litterGround,litterUpper,ring,previewRing,rainLines,...(ghost?[ghost]:[])];
 const visibility=hidden.map(o=>o.visible),upperVisible=upper.visible,ratio=renderer.getPixelRatio();
 const cam=new THREE.PerspectiveCamera(33,1.6,.1,100);cam.position.set(15,12,17);cam.lookAt(0,1.9,0);
 scene.add(draft);
 try{
  hidden.forEach(o=>o.visible=false);upper.visible=true;
  renderer.setPixelRatio(1);renderer.setSize(800,500,false);renderer.render(scene,cam);
  const image=document.createElement('canvas');image.width=800;image.height=500;const ctx=image.getContext('2d');
  paintPhoto(ctx,renderer.domElement,800,500,currentLook);
  return image.toDataURL('image/jpeg',.9);
 }finally{
  scene.remove(draft);draft.traverse(o=>{if(o.isInstancedMesh)o.dispose();});
  hidden.forEach((o,i)=>o.visible=visibility[i]);upper.visible=upperVisible;
  renderer.setPixelRatio(ratio);resize();renderer.render(scene,camera);
 }
}
function drawGarden(){
 const next=generateGarden({seed:crypto.getRandomValues(new Uint32Array(1))[0],season:state.season,excludeTheme:lastDrawTheme});
 const preview=gardenPortrait(next.plants);gardenDraw=next;lastDrawTheme=next.theme.id;
 $('drawPreview').src=preview;$('drawTitle').textContent=next.theme.name;$('drawNote').textContent=next.theme.note;
 $('drawSerial').textContent='NO. '+next.serial;$('drawSeason').textContent=SEASONS[state.season].title;
 $('drawCount').textContent=`${next.plants.length} 株植物 · ${new Set(next.plants.map(p=>p.species)).size} 种生机 · 双层自由花园`;
 const names=[...new Set(next.plants.map(p=>p.species))].slice(0,5);
 $('drawPlants').replaceChildren(...names.map(id=>{const tag=document.createElement('span');tag.textContent=speciesMap[id].name;return tag;}));
 $('drawCard').style.setProperty('--draw-accent',next.theme.color);
 $('drawCard').classList.remove('revealed');void $('drawCard').offsetWidth;$('drawCard').classList.add('revealed');
 if(!$('drawDialog').open)$('drawDialog').showModal();
}
function tryDrawGarden(){try{drawGarden();}catch(error){console.error('Garden preview failed',error);toast('花园签暂时没能展开，请再试一次；原花园已保留。');}}
$('drawGarden').onclick=tryDrawGarden;$('rerollGarden').onclick=tryDrawGarden;
$('closeDraw').onclick=()=>$('drawDialog').close();
$('drawDialog').addEventListener('close',()=>{gardenDraw=null;});
$('keepGarden').onclick=()=>{
 if(!gardenDraw)return;const chosen=gardenDraw;checkpoint();
 setMode('view');state.plants=chosen.plants;state.growth=1;renderPlants();setFloor('all');finish();
 $('welcome').hidden=true;$('drawDialog').close();toast('已收下「'+chosen.theme.name+'」· 可继续编辑或撤销');
};
$('about').onclick=()=>$('aboutDialog').showModal();$('closeAbout').onclick=()=>$('aboutDialog').close();$('aboutDialog').addEventListener('click',e=>{if(e.target===$('aboutDialog')){let r=$('aboutDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('aboutDialog').close();}});
$('capture').onclick=()=>{
 const wasRing=ring.visible,wasPreview=previewRing.visible,wasGhost=ghost?.visible;
 try{
  ring.visible=false;previewRing.visible=false;if(ghost)ghost.visible=false;renderer.render(scene,camera);
  const c=document.createElement('canvas'),w=renderer.domElement.width,h=renderer.domElement.height;
  c.width=w;c.height=h+110;const ctx=c.getContext('2d');paintPhoto(ctx,renderer.domElement,w,h,currentLook);
  ctx.fillStyle='#f5f4ed';ctx.fillRect(0,h,w,110);ctx.fillStyle='#344a3b';ctx.font='28px SimSun,serif';
  ctx.fillText('未完之境 · '+SEASONS[state.season].title+' / '+currentLook.name,35,h+50);
  ctx.font='13px sans-serif';ctx.fillStyle='#7d8972';ctx.fillText(`${state.plants.length} 株植物 / ${new Set(state.plants.map(p=>p.species)).size} 种生机    人停下的地方，自然继续。`,35,h+80);
  const a=document.createElement('a');a.download=`未完之境-${SEASONS[state.season].name}日花园-${currentLook.name}.png`;a.href=c.toDataURL('image/png');a.click();
  toast('已保存 PNG · '+currentLook.name+'光影已保留');
 }finally{ring.visible=wasRing;previewRing.visible=wasPreview;if(ghost)ghost.visible=wasGhost;}
};
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||$('aboutDialog').open||$('drawDialog').open)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(e.key==='Escape'){photoPanel(false);setMode('view');}else if(e.key.toLowerCase()==='v')setMode('select');else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();}});
let last=performance.now();function animate(now){requestAnimationFrame(animate);let dt=Math.min((now-last)/1000,.05);last=now;controls.update();if(isRaining){for(let i=0;i<rainN;i++){let n=i*6,snow=state.season==='winter',speed=snow?.8:6;rainPositions[n+1]-=dt*speed;rainPositions[n+4]-=dt*speed;if(snow){const drift=Math.sin(now*.001+i)*dt*.18;rainPositions[n]+=drift;rainPositions[n+3]+=drift;}if(rainPositions[n+1]<-.2){rainPositions[n+1]=12;rainPositions[n+4]=12-(snow?.035:.23);}}rainGeo.attributes.position.needsUpdate=true;}renderer.render(scene,camera);}
requestAnimationFrame(animate);$('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,650);save();updateUI();
