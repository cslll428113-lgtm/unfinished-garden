import test from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, DECIDUOUS, normalizeSeason, seasonalLook } from '../dist/seasons.js';

test('legacy growth-stage saves migrate to summer, valid seasons survive reload',()=>{
 for(const value of [0,1,2,3,undefined,null,'bad'])assert.equal(normalizeSeason(value),'summer');
 for(const season of Object.keys(SEASONS))assert.equal(normalizeSeason(season),season);
});
test('spring blossoms disappear in winter and return on a spring revisit',()=>{
 for(const id of ['sakura','magnolia','tulip','wisteria']){
  const spring=seasonalLook(id,'flower','spring');assert.equal(spring.fraction,1);
  assert.equal(seasonalLook(id,'flower','winter').fraction,0);
  assert.deepEqual(seasonalLook(id,'flower','spring'),spring);
 }
});
test('winter distinguishes bare deciduous branches from evergreens and succulent leaves',()=>{
 for(const id of DECIDUOUS)assert.equal(seasonalLook(id,'leaf','winter').fraction,0);
 for(const id of ['banyan','monstera','ivy','pothos','echeveria'])assert.ok(seasonalLook(id,'leaf','winter').fraction>0);
 for(const id of DECIDUOUS)assert.equal(seasonalLook(id,'stem','winter').fraction,1);
});
test('autumn has distinct maple and ginkgo colors; all seasonal densities are bounded',()=>{
 assert.notEqual(seasonalLook('maple','leaf','autumn').tint,seasonalLook('ginkgo','leaf','autumn').tint);
 const ids=['banyan','maple','ginkgo','bougain','hydrangea','salvia','fern','monstera','hosta','grass','ivy','pothos','sakura','magnolia','tulip','daisy','allium','muhly','echeveria','wisteria'];
 for(const id of ids)for(const season of Object.keys(SEASONS))for(const part of ['stem','leaf','flower']){
  const look=seasonalLook(id,part,season);assert.ok(look.fraction>=0&&look.fraction<=1);assert.ok(look.height>0&&look.height<=1);
 }
});
