import test from 'node:test';
import assert from 'node:assert/strict';
import {vineLayout} from '../dist/vine-layout.js';

const solidSlab=(x,z)=>Math.abs(x)<=5.2&&Math.abs(z)<=3.25&&!(Math.abs(x)<1.4&&Math.abs(z)<.95);
const points=layout=>layout.paths.flat();
test('ground-floor and interior vines spread above the planting surface',()=>{
 for(const level of [0,1])for(const rotation of [0,1.5,3.2,5.4]){
  const layout=vineLayout({x:3,z:0,level,scale:1.8,rotation});
  assert.equal(layout.mode,'地面铺展');assert.ok(points(layout).every(p=>p.y>=.06));
 }
});
test('trailing stems cross the real slab edge before descending, on every edge and growth stage',()=>{
 const roots=[{x:4.9,z:0},{x:-4.9,z:0},{x:0,z:3},{x:0,z:-3},{x:1.5,z:.55},{x:-1.5,z:-.55},{x:.9,z:1.05},{x:-.9,z:-1.05}];
 for(const species of ['ivy','pothos'])for(const root of roots)for(const scale of [.45,1,1.8])for(const time of [0,.25,.6,1])for(const rotation of [0,1.5,3.2]){
  const p={...root,species,scale,rotation,level:1},layout=vineLayout(p,{time,growth:1.3});
  for(const path of layout.paths)for(let i=1;i<path.length;i++)for(let k=0;k<=5;k++){
   const t=k/5,a=path[i-1],b=path[i],x=p.x+a.x+(b.x-a.x)*t,z=p.z+a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t;
   assert.ok(y+3.115>.1,'vine stays above ground');
   if(y<0)assert.equal(solidSlab(x,z),false,`stem entered slab: ${JSON.stringify({p,x,z,y,time})}`);
  }
 }
});
test('small seedlings reach the edge gradually; moving and rewinding restore deterministic layouts',()=>{
 const p={x:0,z:2.6,level:1,scale:1,rotation:1};
 assert.ok(points(vineLayout(p,{time:0})).every(q=>q.y>=0));
 assert.ok(points(vineLayout(p,{time:1})).some(q=>q.y<-.4));
 const mature=vineLayout(p);vineLayout({...p,z:0,level:0});vineLayout(p,{time:.2});assert.deepEqual(vineLayout(p),mature);
});
