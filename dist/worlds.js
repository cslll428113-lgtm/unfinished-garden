import * as THREE from 'three';

export const WORLDS={
 white:{name:'纯白',note:'留白与树影，让建筑成为主角。',sky:'#ffffff',ground:'#fafafa',sound:'轻风'},
 snow:{name:'雪地',note:'雪坡与远山之间，一座安静的冬日花园。',sky:'#e4edf0',ground:'#edf2f2',sound:'雪原风声'},
 coast:{name:'海边',note:'沿着曲折的沙岸，听潮水走进花园。',sky:'#e3eff0',ground:'#e8ddc4',sound:'海浪与海风'},
 mountain:{name:'山里',note:'花园落在山谷里，远山与林丛渐隐于雾。',sky:'#e3ece8',ground:'#bcc9ad',sound:'山风与鸟鸣'}
};
export const BUILDINGS={frame:'未完框架',arcade:'回廊花园',ruin:'断墙遗址'};
export const normalizeWorld=value=>Object.hasOwn(WORLDS,value)?value:'white';
export const normalizeBuilding=value=>Object.hasOwn(BUILDINGS,value)?value:'frame';
const clamp=THREE.MathUtils.clamp;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const color=value=>new THREE.Color(value);
const blend=(a,b,t)=>color(a).lerp(color(b),clamp(t,0,1));
// Fixed seeds make an environment stable when revisiting it or undoing an edit.
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export const shoreAt=z=>8.4+.12*z+1.7*Math.sin(z*.12)+.65*Math.sin(z*.31+.8);
export function mountainHeight(x,z,snow=false){
 const r=Math.hypot(x,z),clear=smooth(8.5,18,r);
 const peaks=[[-35,-32,7.5,20,14],[0,-48,11,24,16],[42,-34,9,20,18],[-45,25,5,19,24],[45,37,5,22,21]];
 let h=0;for(const [px,pz,height,wx,wz] of peaks)h+=height*Math.exp(-(((x-px)/wx)**2+((z-pz)/wz)**2));
 const detail=(Math.sin(x*.19+z*.1)*.18+Math.sin(z*.23-x*.08)*.1)*smooth(10,25,r);
 return -.29+clear*Math.max(0,h*(snow?.72:1)*(1+.1*Math.sin(x*.12+z*.08)+.06*Math.sin(z*.18))+detail);
}
// A sampled surface with continuous normals and colour, rather than separate primitive hills.
function grid(xs,zs,point,paint){
 const pos=[],cols=[],indices=[];
 for(const z of zs)for(const x of xs){const p=point(x,z),c=paint(...p);pos.push(...p);cols.push(c.r,c.g,c.b);}
 const w=xs.length;for(let j=0;j<zs.length-1;j++)for(let i=0;i<w-1;i++){const a=j*w+i;indices.push(a,a+w,a+1,a+1,a+w,a+w+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const axis=(extent,steps,power=1)=>Array.from({length:steps+1},(_,i)=>{const t=i/steps*2-1;return Math.sign(t)*Math.pow(Math.abs(t),power)*extent;});

export function createWorld(scene){
 const root=new THREE.Group();root.name='surrounding-landscape';scene.add(root);
 const materials=new Set();let random=rng(83);
 function mesh(geometry,{tint=0xffffff,basic=false,order=-100,opacity=1,vertices=false}={}){
  const Type=basic?THREE.MeshBasicMaterial:THREE.MeshStandardMaterial;
  const material=new Type({color:tint,vertexColors:vertices,side:THREE.DoubleSide,transparent:opacity<1,opacity,...(basic?{}:{roughness:1})});
  materials.add(material);const m=new THREE.Mesh(geometry,material);m.renderOrder=order;m.receiveShadow=!basic;root.add(m);return m;
 }
 function ribbon(points,width,tint,opacity,order){
  const pos=[],indices=[];for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[2]-prev[2],len=Math.hypot(dx,dz)||1,w=width*Math.sin(Math.PI*i/(points.length-1))*.5;pos.push(p[0]-dz/len*w,p[1],p[2]+dx/len*w,p[0]+dz/len*w,p[1],p[2]-dx/len*w);if(i<points.length-1){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,{tint,basic:true,opacity,order});
 }
 // Batch small landscape objects into one mesh, keeping orbiting lightweight.
 function batch(){const p=[],c=[],n=[];return {
  add(g,position,scale,tint,rotation=0){const geo=g.index?g.toNonIndexed():g;const mat=new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),new THREE.Vector3(...scale)),norm=new THREE.Matrix3().getNormalMatrix(mat),v=new THREE.Vector3(),normal=new THREE.Vector3(),col=color(tint);for(let i=0;i<geo.attributes.position.count;i++){v.fromBufferAttribute(geo.attributes.position,i).applyMatrix4(mat);normal.fromBufferAttribute(geo.attributes.normal,i).applyNormalMatrix(norm);p.push(...v.toArray());n.push(...normal.toArray());c.push(col.r,col.g,col.b);}if(geo!==g)geo.dispose();},
  finish(order){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return mesh(g,{vertices:true,order});}
 };}
 function rockGeometry(){const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.15*Math.sin(x*5+z*3)+.09*Math.sin(y*6-z*4);p.setXYZ(i,x*k,(y+1)*.5*k,z*k);}g.computeVertexNormals();return g;}
 function grasses(centres,coast){const pos=[],cols=[];for(const [x,y,z,size] of centres)for(let j=0;j<14;j++){const a=random()*Math.PI*2,r=random()*.35*size,h=(.25+random()*.5)*size,bx=x+Math.cos(a)*r,bz=z+Math.sin(a)*r,lean=.15*size,w=.025*size;pos.push(bx-w,y,bz,bx+w,y,bz,bx+Math.cos(a)*lean,y+h,bz+Math.sin(a)*lean);const col=color(coast?(j%3?0x9d9f70:0xc0b994):(j%3?0x7d9877:0xa2b18a));for(let i=0;i<3;i++)cols.push(col.r,col.g,col.b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();mesh(g,{vertices:true,order:-40});
 }
 function coast(){
  const seaAxis=axis(210,38,1.5);
  mesh(grid(seaAxis,seaAxis,(x,z)=>[x,-.53,z],(x,y,z)=>{const depth=x-shoreAt(z);return blend('#a8d4cc','#558eaa',smooth(0,35,depth));}),{vertices:true,basic:true,order:-1000});
  const us=[0,.25,.6,1.2,2,3.5,5,8,12,18,27,40,65,100,160,300],zs=axis(210,80,1.55);
  mesh(grid(us,zs,(u,z)=>[shoreAt(z)-u,-.29-.22*Math.exp(-u*2),z],(x,y,z)=>{const u=shoreAt(z)-x,grain=.025*Math.sin(x*1.7+z*.9);return blend('#d8cdae','#f2e6cb',smooth(0,3,u)).lerp(color('#bac8a4'),smooth(18,36,u)*.83+grain);}),{vertices:true,order:-900});
  // Foam follows the shore in irregular, tapering fragments. No concentric rings.
  for(let band=0;band<4;band++)for(let j=0;j<7;j++){
   const start=-39+j*12+random()*5,length=5+random()*6,offset=.6+band*2.4,pts=[];
   for(let k=0;k<=28;k++){const z=start+k/28*length;pts.push([shoreAt(z)+offset+Math.sin(z*.7+band)*.18,-.515,z]);}
   ribbon(pts,band===0?.17:.07,0xf0f6e9,band===0?.78:.35,-800);
  }
  const rocks=batch(),rock=rockGeometry();for(const [cx,cz,count] of [[15,-17,5],[22,19,4],[10,-32,4]])for(let i=0;i<count;i++){const x=cx+(random()-.5)*3,z=cz+(random()-.5)*4,s=.35+random()*.95;rocks.add(rock,[x,-.52,z],[s, s*(.6+random()*.5),s*.8],i%2?0x899d97:0xa3aaa0,random()*6.28);}rocks.finish(-700);rock.dispose();
  const tufts=[];for(let i=0;i<36;i++){const z=-23+random()*46,x=shoreAt(z)-2.5-random()*3;if(Math.abs(x)<6.8&&Math.abs(z)<4.5)continue;tufts.push([x,-.29,z,.65+random()*.5]);}grasses(tufts,true);
 }
 function mountains(snow){
  const coords=axis(150,66,1.65);
  mesh(grid(coords,coords,(x,z)=>[x,mountainHeight(x,z,snow),z],(x,y,z)=>{
   const noise=(Math.sin(x*.12+z*.09)+Math.sin(z*.13-x*.08))*.012;
   if(snow)return blend('#edf2ed','#bcced0',clamp(y/16+noise,0,.6));
   return blend('#c3c9a7','#587a74',smooth(.3,8,y)*.95+noise).lerp(color('#99b3b1'),smooth(8,15,y)*.22);
  }),{vertices:true,order:-900});
  // A narrow, irregular path reaches the garden through the low valley.
  const path=[];for(let i=0;i<45;i++){const z=3.7+i*.42,x=-1.8+Math.sin(z*.22)*1.8;path.push([x,mountainHeight(x,z,snow)+.025,z]);}ribbon(path,.9,snow?0xd5e1e1:0xded8bd,.7,-850);
  const trees=batch(),trunk=new THREE.CylinderGeometry(.035,.065,1,5);
  const leaf=new THREE.BufferGeometry();leaf.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.4,.35,.08,-.32,.7,.07,0,1,0,.32,.7,.07,.4,.35,.08],3));leaf.setIndex([0,1,2,0,2,3,0,3,4,0,4,5]);leaf.computeVertexNormals();
  const groups=[[-14,-9,4],[-2,-21,4],[13,-17,4],[-25,10,3],[28,-9,3],[21,26,3]];
  for(const [cx,cz,count] of groups)for(let i=0;i<count;i++){
   const x=cx+(random()-.5)*7,z=cz+(random()-.5)*7,y=mountainHeight(x,z,snow),h=1.5+random()*1.6;
   trees.add(trunk,[x,y+h*.4,z],[.7,h*.8,.7],0x7c8270);
   for(let b=0;b<6;b++){const a=b*2.4,rr=b?.24*h:0,bh=h*(.52+random()*.38),bx=x+Math.cos(a)*rr,bz=z+Math.sin(a)*rr;
    trees.add(trunk,[bx,y+bh-.2,bz],[.25,.5,.25],0x86917a);
    for(let k=0;k<19;k++){const t=random()*Math.PI*2,r=Math.sqrt(random())*h*.28,scale=.18+random()*.18;trees.add(leaf,[bx+Math.cos(t)*r,y+bh+(random()-.4)*h*.18,bz+Math.sin(t)*r],[scale*1.3,scale,scale],snow?(k%2?0x9eb8ac:0xc9d9ce):(k%3?0x6e9074:0xa0b38b),t);}
   }
  }trees.finish(-700);trunk.dispose();leaf.dispose();
  if(!snow){const tufts=[];for(let i=0;i<50;i++){const a=random()*6.28,r=7.5+random()*13,x=Math.cos(a)*r,z=Math.sin(a)*r;if(x>4.5&&x<7&&z<4&&z>-5)continue;tufts.push([x,mountainHeight(x,z)+.02,z,.6+random()*.6]);}grasses(tufts,false);}
  const rocks=batch(),rock=rockGeometry();for(let i=0;i<15;i++){const a=random()*6.28,r=10+random()*17,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.25+random()*.65;rocks.add(rock,[x,mountainHeight(x,z,snow)-.04,z],[s,s*.6,s*.8],snow?0xc7d5d3:0x9da897,a);}rocks.finish(-650);rock.dispose();
 }
 return {root,set(value){
  for(const o of [...root.children]){root.remove(o);o.geometry.dispose();}for(const m of materials)m.dispose();materials.clear();random=rng(83);
  value=normalizeWorld(value);root.rotation.y=value==='coast'?Math.PI*.75:0;if(value==='coast')coast();else if(value==='mountain'||value==='snow')mountains(value==='snow');
 }};
}
