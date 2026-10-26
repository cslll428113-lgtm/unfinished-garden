import test from 'node:test';
import assert from 'node:assert/strict';
import {PlantFeedback} from '../dist/plant-feedback.js';
import {PLANT_INFO} from '../dist/plant-info.js';
import {readFileSync} from 'node:fs';

function setup(saved){
 const calls={created:0,notes:0,resumes:0,suspends:0};
 const parameter={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 const node=()=>({frequency:parameter,gain:parameter,connect(next){return next;},disconnect(){},start(){calls.notes++;},stop(){}});
 class Audio {constructor(){calls.created++;this.currentTime=0;this.destination={};}resume(){calls.resumes++;return Promise.resolve();}suspend(){calls.suspends++;return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}}
 const storage={getItem(){return saved;},setItem(k,v){saved=v;}};
 const page={hidden:false,addEventListener(){}};
 return {sound:new PlantFeedback({Audio,storage,page}),calls,storage,page};
}
test('first successful planting starts feedback without ambient audio or startup autoplay',async()=>{
 const {sound,calls}=setup();assert.equal(calls.created,0);assert.equal(await sound.play(),true);assert.equal(calls.created,1);assert.equal(calls.resumes,1);assert.equal(calls.notes,2);
});
test('mute persists, hidden pages are silent, and pending resume cannot bypass mute',async()=>{
 const {sound,calls,storage,page}=setup('off');assert.equal(await sound.play(),false);assert.equal(calls.created,0);
 sound.setEnabled(true);page.hidden=true;assert.equal(await sound.play(),false);page.hidden=false;
 const pending=sound.play();sound.setEnabled(false);assert.equal(await pending,false);assert.equal(calls.notes,0);assert.equal(storage.getItem(),'off');
 sound.setEnabled(true);assert.equal(await sound.play(),true);assert.equal(calls.notes,2);
});
test('every catalog species has scoped botanical information and an institutional source',()=>{
 const source=readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
 const catalog=source.split('const SPECIES=[')[1].split('];')[0];
 const ids=[...catalog.matchAll(/id:'([^']+)'/g)].map(m=>m[1]);
 assert.deepEqual(Object.keys(PLANT_INFO).sort(),ids.sort());
 for(const info of Object.values(PLANT_INFO)){
  for(const key of ['latin','scope','season','light','water','fact'])assert.ok(info[key]?.trim().length>0);
  for(const {url} of info.sources)assert.match(new URL(url).hostname,/^(plants\.ces\.ncsu\.edu|www\.nparks\.gov\.sg|www\.rhs\.org\.uk|ask\.ifas\.ufl\.edu)$/);
 }
});
