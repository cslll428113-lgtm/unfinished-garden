import test from 'node:test';import assert from 'node:assert/strict';
import {PHOTO_LOOKS,normalizeLook,normalizeStrength,photoLook,paintPhoto} from '../dist/photo-looks.js';
test('old day/dusk saves migrate unchanged and invalid options recover',()=>{
 assert.equal(normalizeLook('day'),'day');assert.equal(normalizeLook('dusk'),'dusk');assert.equal(normalizeLook('invalid'),'day');
 assert.equal(normalizeStrength(undefined),1);assert.equal(normalizeStrength(NaN),1);assert.equal(normalizeStrength(-1),0);assert.equal(normalizeStrength(3),1);
});
test('all six looks remain finite across every season and strength',()=>{
 for(const season of ['spring','summer','autumn','winter'])for(const type of Object.keys(PHOTO_LOOKS))for(const strength of [0,.4,1]){
  const look=photoLook(season,type,strength);assert.match(look.top,/^#[0-9a-f]{6}$/);assert.match(look.bottom,/^#[0-9a-f]{6}$/);
  assert.ok(look.fogFar>look.fogNear);assert.ok(look.exposure>.8&&look.exposure<1.3);assert.ok(!/NaN|undefined/.test(look.filter));
  assert.ok(look.position.every(Number.isFinite));assert.equal(look.strength,strength);
 }
});
test('zero strength returns the neutral lighting; full moon differs from dusk',()=>{
 const a=photoLook('summer','day',0),b=photoLook('summer','moon',0);
 for(const key of ['filter','sun','sky','ground','exposure','position','cpuTint'])assert.deepEqual(a[key],b[key]);
 assert.notDeepEqual(photoLook('summer','moon').position,photoLook('summer','dusk').position);
 assert.notEqual(photoLook('summer','moon').bottom,photoLook('summer','dusk').bottom);
});
test('winter dusk preserves a blue snow-ground palette',()=>{
 const look=photoLook('winter','dusk'),n=parseInt(look.ground.slice(1),16);assert.ok((n&255)>(n>>16));
 assert.ok(look.cpuTint[2]>look.cpuTint[0]);
});
test('photo export grades the image, not the footer, then restores canvas settings',()=>{
 const events=[],gradient={addColorStop:(...a)=>events.push(['stop',...a])};
 const ctx={filter:'none',save(){events.push(['save']);},restore(){events.push(['restore']);},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;},fillRect(){events.push(['fill',this.filter]);},drawImage(){events.push(['image',this.filter]);}};
 const look=photoLook('spring','film');paintPhoto(ctx,{},800,500,look);
 assert.deepEqual(events.find(e=>e[0]==='image'),['image',look.filter]);assert.ok(events.filter(e=>e[0]==='fill').every(e=>e[1]==='none'));assert.deepEqual(events.at(-1),['restore']);
});
