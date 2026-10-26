import test from 'node:test';
import assert from 'node:assert/strict';
import {createVineLeaves} from '../dist/vine-leaves.js';

test('pothos is one connected smooth surface with a single boundary, without overlapping patch faces',()=>{
 const g=createVineLeaves().pothos,edges=new Map(),index=g.index.array;
 assert.ok(g.index,'shared vertices are required for continuous normals');
 for(let i=0;i<index.length;i+=3)for(let j=0;j<3;j++){
  const a=index[i+j],b=index[i+(j+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)||0)+1);
 }
 assert.equal([...edges.values()].filter(n=>n===1).length,g.userData.leafOutline.length);
 assert.ok([...edges.values()].every(n=>n===1||n===2));
 assert.equal(g.attributes.position.count-edges.size+index.length/3,1);
 assert.ok([...g.attributes.normal.array].every(Number.isFinite));
 assert.ok([...g.attributes.color.array].every(c=>c>=.8&&c<=1.35),'subtle integrated variegation, no bright yellow polygons');
});
