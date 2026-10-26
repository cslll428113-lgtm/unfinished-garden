import * as THREE from 'three';
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const normalizeTime=value=>typeof value==='number'&&Number.isFinite(value)?clamp(value):1;
export function growthProfile(value){
 const t=normalizeTime(value);
 return {time:t,height:.18+.82*ease(0,1,t),spread:.16+.84*ease(.03,.92,t),litter:ease(.82,1,t),label:t<.2?'幼苗':t<.48?'抽枝':t<.72?'展叶':t<.94?'初花':'繁盛'};
}
// Retain immutable mature poses: scrubbing backwards never accumulates deformation.
const bases=new WeakMap(),matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion(),closed=new THREE.Quaternion();
export function applySpecimenTime(group,value){
 const t=normalizeTime(value);
 for(const mesh of group.children){
  if(!mesh.isInstancedMesh||mesh.userData.part==='stem')continue;
  let base=bases.get(mesh);
  if(!base){
   base=[];for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();matrix.decompose(p,q,s);base.push({p,q,s,delay:Math.abs(Math.sin(Math.round(p.x*5)*12.9898+Math.round(p.y*5)*78.233+Math.round(p.z*5)*37.719))});}bases.set(mesh,base);
  }
  const flower=mesh.userData.part==='flower',petal=flower&&mesh.geometry.type==='BufferGeometry';
  mesh.visible=mesh.count>0&&(!flower||t>.48);
  for(let i=0;i<base.length;i++){
   const b=base[i],open=flower?ease(.48+b.delay*.18,.94+b.delay*.06,t):ease(b.delay*.28,.65+b.delay*.25,t);
   position.copy(b.p);scale.copy(b.s);
   if(flower)scale.multiplyScalar(open);
   else scale.set(b.s.x*(.12+.88*open),b.s.y*(.24+.76*open),b.s.z*(.24+.76*open));
   rotation.copy(b.q);
   if(!flower||petal)rotation.copy(closed).slerp(b.q,(flower?.08:.18)+(flower?.92:.82)*open);
   matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.boundingSphere=null;mesh.boundingBox=null;mesh.frustumCulled=false;
 }
}
