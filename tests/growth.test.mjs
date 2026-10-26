import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {normalizeTime,growthProfile,applySpecimenTime} from '../dist/growth.js';
function specimen(){
 const group=new THREE.Group();
 for(const part of ['leaf','flower']){const m=new THREE.InstancedMesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial(),3);m.userData.part=part;
 for(let i=0;i<3;i++)m.setMatrixAt(i,new THREE.Matrix4().compose(new THREE.Vector3(i*.1,1+i*.1,0),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),.7),new THREE.Vector3(.2,.4,.3)));
 group.add(m);}return group;
}
test('legacy gardens remain mature and timeline is bounded',()=>{
 for(const x of [undefined,null,NaN,Infinity,'0'])assert.equal(normalizeTime(x),1);
 assert.equal(normalizeTime(-2),0);assert.equal(normalizeTime(2),1);
 assert.equal(growthProfile(1).height,1);assert.equal(growthProfile(1).spread,1);
 let last=0;for(let i=0;i<=100;i++){const p=growthProfile(i/100);assert.ok(p.height>=last);last=p.height;}
});
test('scrubbing hides early flowers, unfolds leaves, and exactly restores mature poses',()=>{
 const g=specimen(),before=g.children.map(m=>Array.from(m.instanceMatrix.array));g.position.set(3,3.115,-2);g.rotation.y=.8;
 applySpecimenTime(g,0);const matrix=new THREE.Matrix4();g.children[1].getMatrixAt(0,matrix);assert.equal(matrix.determinant(),0);
 assert.notDeepEqual(Array.from(g.children[0].instanceMatrix.array),before[0]);
 for(const t of [.75,.2,.9,.1,1])applySpecimenTime(g,t);
 for(let j=0;j<g.children.length;j++)g.children[j].instanceMatrix.array.forEach((v,i)=>assert.ok(Math.abs(v-before[j][i])<1e-6));
 assert.deepEqual(g.position.toArray(),[3,3.115,-2]);assert.equal(g.rotation.y,.8);
});
test('seasonal dormancy and separate specimens are preserved',()=>{
 const g=specimen(),other=specimen(),before=Array.from(other.children[0].instanceMatrix.array);g.children[1].count=0;
 applySpecimenTime(g,.3);applySpecimenTime(g,1);assert.equal(g.children[1].count,0);
 assert.deepEqual(Array.from(other.children[0].instanceMatrix.array),before);
});
