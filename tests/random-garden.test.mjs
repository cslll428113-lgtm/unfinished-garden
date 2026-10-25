import test from 'node:test';
import assert from 'node:assert/strict';
import {generateGarden,GARDEN_THEMES} from '../dist/random-garden.js';
const treeIds=new Set(['banyan','maple','ginkgo','sakura','magnolia']);
test('a seed reproduces its garden; another draw changes its layout',()=>{
 const options=Object.freeze({seed:19615,season:'spring'});
 assert.deepEqual(generateGarden(options),generateGarden(options));
 assert.notDeepEqual(generateGarden(options).plants,generateGarden({...options,seed:19616}).plants);
});
test('all seasons produce bounded gardens on solid floor with open courtyard',()=>{
 const valid=new Set(['banyan','maple','ginkgo','sakura','magnolia','tulip','daisy','allium','bougain','salvia','hydrangea','fern','hosta','monstera','grass','muhly','echeveria','ivy','pothos','wisteria']);
 for(const season of ['spring','summer','autumn','winter'])for(let i=0;i<100;i++){
  const draw=generateGarden({seed:(i*2654435761)>>>0,season});
  assert.ok(draw.theme.seasons.includes(season));
  assert.ok(draw.plants.length>=36&&draw.plants.length<=48,draw.plants.length);
  assert.equal(new Set(draw.plants.map(p=>p.id)).size,draw.plants.length);
  assert.equal(draw.plants.filter(p=>treeIds.has(p.species)).length,4);
  for(const p of draw.plants){
   assert.ok(valid.has(p.species));assert.ok([0,1].includes(p.level));
   assert.ok(Math.abs(p.x)<=4.75&&Math.abs(p.z)<=3);
   assert.ok(!(p.level===1&&Math.abs(p.x)<1.55&&Math.abs(p.z)<1.12));
   assert.ok(p.scale>=.6&&p.scale<=.98&&Number.isFinite(p.rotation));
  }
  const trees=draw.plants.filter(p=>treeIds.has(p.species));
  for(const a of trees)for(const b of trees)if(a!==b&&a.level===b.level)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>4);
 }
});
test('rerolls avoid the previous theme while keeping the current season',()=>{
 for(const theme of GARDEN_THEMES)for(const season of theme.seasons){
  const draw=generateGarden({seed:123,season,excludeTheme:theme.id});
  assert.notEqual(draw.theme.id,theme.id);assert.equal(draw.season,season);
 }
});
