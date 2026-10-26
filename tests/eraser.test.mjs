import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
function harness(){
 const listeners={},nodes={},captures=new Set();
 const canvas={addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn)},getBoundingClientRect:()=>({left:0,top:0,right:200,bottom:200}),setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
 const context=vm.createContext({console,renderer:{domElement:canvas},window:{addEventListener:(t,f)=>{listeners['window:'+t]=[f]}},document:{addEventListener:(t,f)=>{listeners['document:'+t]=[f]}},$:id=>nodes[id]??=( {}),state:{plants:[{id:'a'},{id:'b'},{id:'c'}]},mode:'erase',eraseStroke:null,down:null,drag:null,ghost:null,previewRing:{visible:false},controls:{enabled:true},plantMeshes:new Map(['a','b','c'].map(id=>[id,{traverse:()=>{}}])),plantsRoot:{remove:()=>{}},history:[],future:[],saves:0,selectedId:null,
  pickedPlant:e=>e.clientY===20?(e.clientX<30?'a':e.clientX<60?'b':'c'):null,
  updateUI:()=>{},refreshLitter:()=>{},toast:()=>{},applySeason:()=>{}
 });
 vm.runInContext("function checkpoint(){history.push(JSON.stringify(state));future=[]}function finish(){saves++}",context);
 vm.runInContext(source.slice(source.indexOf('const canvas=renderer.domElement;'),source.indexOf("$('closeWelcome').onclick=")),context);
 vm.runInContext(source.slice(source.indexOf('function undo(){'),source.indexOf("$('undo').onclick=")),context);
 return {context,captures,send(type,extra={}){const e={button:0,buttons:1,pointerId:1,clientX:10,clientY:20,preventDefault(){},...extra};for(const fn of listeners[type]??[])fn(e)},run:s=>vm.runInContext(s,context)};
}
test('one drag deletes multiple plants, saves on release, and one undo restores all',()=>{
 const h=harness();h.send('pointerdown');h.send('pointermove',{clientX:80});
 assert.equal(h.context.state.plants.length,0);assert.equal(h.context.history.length,1);assert.equal(h.context.saves,0);assert.equal(h.context.controls.enabled,false);
 h.send('pointerup',{clientX:80,buttons:0});assert.equal(h.context.saves,1);assert.equal(h.context.controls.enabled,true);assert.equal(h.captures.size,0);
 h.run('undo()');assert.equal(h.context.state.plants.length,3);h.run('redo()');assert.equal(h.context.state.plants.length,0);
});
test('empty strokes and middle/right buttons do not delete or consume undo history',()=>{
 const h=harness();h.send('pointerdown',{button:1});h.send('pointerdown',{button:2});assert.equal(h.context.state.plants.length,3);
 h.send('pointerdown',{clientY:80});h.send('pointermove',{clientX:80,clientY:80});h.send('pointerup',{clientY:80});assert.equal(h.context.history.length,0);assert.equal(h.context.saves,0);
});
test('stationary moves do not peel overlapping plants; unrelated pointers are ignored',()=>{
 const h=harness();h.context.pickedPlant=()=>h.context.state.plants[0]?.id;
 h.send('pointerdown');h.send('pointermove');h.send('pointermove',{clientX:90,pointerId:2});h.send('pointerup',{pointerId:2});
 assert.equal(h.context.state.plants.length,2);assert.notEqual(h.context.eraseStroke,null);
 h.send('pointerup');assert.equal(h.context.eraseStroke,null);
});
test('cancel, lost capture, focus loss and undo during a stroke release the controls',()=>{
 for(const type of ['pointercancel','lostpointercapture','window:blur']){const h=harness();h.send('pointerdown');h.send(type);assert.equal(h.context.eraseStroke,null);assert.equal(h.context.saves,1);assert.equal(h.context.controls.enabled,true);h.send(type);assert.equal(h.context.saves,1);}
 const h=harness();h.send('pointerdown');h.run('undo()');assert.equal(h.context.state.plants.length,3);assert.equal(h.context.eraseStroke,null);
});
