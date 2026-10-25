import test from 'node:test';
import assert from 'node:assert/strict';
import {generateGarden} from '../dist/random-garden.js';
const treeIds=new Set(['banyan','maple','ginkgo','sakura','magnolia']);
const valid=new Set([...treeIds,'tulip','daisy','allium','bougain','salvia','hydrangea','fern','hosta','monstera','grass','muhly','echeveria','ivy','pothos','wisteria']);
test('a seed reproduces a garden; different seeds change the layout',()=>{
 const options=Object.freeze({seed:19615,season:'spring'});
 assert.deepEqual(generateGarden(options),generateGarden(options));
 assert.notDeepEqual(generateGarden(options).plants,generateGarden({...options,seed:19616}).plants);
});
test('random planting stays on slabs, under the plant limit, and spaces tall trees',()=>{
 for(const season of ['spring','summer','autumn','winter'])for(let i=0;i<100;i++){
  const garden=generateGarden({seed:(i*2654435761)>>>0,season}),plants=garden.plants;
  assert.equal(garden.season,season);assert.ok(plants.length>=40&&plants.length<=90,plants.length);
  assert.equal(new Set(plants.map(p=>p.id)).size,plants.length);
  for(const level of [0,1])assert.ok(plants.filter(p=>p.level===level).length>=12);
  for(const p of plants){
   assert.ok(valid.has(p.species));assert.ok([0,1].includes(p.level));
   assert.ok(Math.abs(p.x)<=4.72&&Math.abs(p.z)<=2.86);
   assert.ok(!(p.level===1&&Math.abs(p.x)<1.6&&Math.abs(p.z)<1.16));
   assert.ok(p.scale>=.5&&p.scale<=1.18&&Number.isFinite(p.rotation));
  }
  for(let a=0;a<plants.length;a++)for(let b=a+1;b<plants.length;b++){
   const p=plants[a],q=plants[b];if(p.level!==q.level)continue;
   const distance=Math.hypot(p.x-q.x,p.z-q.z);assert.ok(distance>.16);
   if(treeIds.has(p.species)&&treeIds.has(q.species))assert.ok(distance>=2.4);
  }
 }
});
test('each season can generate all 20 species, varied densities and unfixed tree positions',()=>{
 for(const season of ['spring','summer','autumn','winter']){
  const species=new Set(),counts=new Set(),treeCounts=new Set(),layouts=new Set(),treePositions=new Set();
  for(let i=0;i<120;i++){
   const garden=generateGarden({seed:(i*2654435761)>>>0,season});counts.add(garden.plants.length);
   const trees=garden.plants.filter(p=>treeIds.has(p.species));treeCounts.add(trees.length);
   for(const p of trees)treePositions.add([p.level,Math.floor(p.x),Math.floor(p.z)].join(','));
   layouts.add(JSON.stringify(garden.plants.map(({species,x,z,level})=>({species,x,z,level}))));
   garden.plants.forEach(p=>species.add(p.species));
  }
  assert.deepEqual(species,valid);assert.ok(counts.size>25);assert.ok(treeCounts.size>=4);
  assert.equal(layouts.size,120);assert.ok(treePositions.size>70);
 }
});
