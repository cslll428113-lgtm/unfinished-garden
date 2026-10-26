import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorld,normalizeWorld,normalizeBuilding,WORLDS} from '../dist/worlds.js';

test('old saves retain their original architecture and migrate to white surroundings',()=>{
 assert.equal(normalizeWorld(undefined),'white');assert.equal(normalizeBuilding(undefined),'frame');
 assert.equal(normalizeWorld('coast'),'coast');assert.equal(normalizeBuilding('ruin'),'ruin');
 assert.equal(normalizeWorld('__proto__'),'white');
});
test('repeated environment changes replace finite geometry and release old resources',()=>{
 const scene=new THREE.Scene(),world=createWorld(scene),counts={};
 for(let round=0;round<3;round++)for(const id of Object.keys(WORLDS)){
  const old=[...world.root.children];let disposed=0;old.forEach(o=>o.geometry.addEventListener('dispose',()=>disposed++));
  world.set(id);assert.equal(disposed,old.length);assert.equal(scene.children.length,1);
  if(id==='white')assert.equal(world.root.children.length,0);else assert.ok(world.root.children.length>0);
  if(round===0)counts[id]=world.root.children.length;else assert.equal(world.root.children.length,counts[id]);
  for(const o of world.root.children)assert.ok([...o.geometry.attributes.position.array,...o.position.toArray(),...o.scale.toArray()].every(Number.isFinite));
 }
});
