import test from 'node:test';
import assert from 'node:assert/strict';
import { routePosition } from '../src/playback.ts';

test('elapsed time uses segment duration rather than equal vertex spacing',()=>{
  assert.deepEqual(routePosition([[0,0],[10,0],[20,0]],[10,30],25).coordinates,[15,0]);
});
test('a shared clock lets the shorter route finish first',()=>{
  assert.equal(routePosition([[0,0],[10,0]],[10],12).finished,true);
  assert.equal(routePosition([[0,0],[10,0]],[20],12).finished,false);
  assert.deepEqual(routePosition([[0,0],[10,0]],[20],12).coordinates,[6,0]);
});
test('antimeridian playback takes the short longitude crossing',()=>{
  assert.deepEqual(routePosition([[179,20],[-179,30]],[10],5).coordinates,[180,25]);
});
test('clamps the clock and rejects malformed timing',()=>{
  assert.deepEqual(routePosition([[0,0],[10,0]],[10],-5).coordinates,[0,0]);
  assert.deepEqual(routePosition([[0,0],[10,0]],[10],50).coordinates,[10,0]);
  assert.throws(()=>routePosition([[0,0],[10,0]],[0],0));
});
