import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RequestGuard} from '../src/lib/request-guard';
test('request limits survive concurrency and release without resetting request budgets',()=>{
 let now=0;
 const gate=new RequestGuard({perMinute:2,concurrent:1,hourly:5,now:()=>now});
 const a=gate.acquire('a');assert.equal(a.ok,true);
 assert.equal(gate.acquire('b').ok,false);
 a.release();a.release();
 const b=gate.acquire('a');assert.equal(b.ok,true);b.release();
 assert.equal(gate.acquire('a').ok,false);
 now=60001;const c=gate.acquire('a');assert.equal(c.ok,true);c.release();
});
test('hourly budget cannot be bypassed by rotating client identities',()=>{
 let now=0;const gate=new RequestGuard({perMinute:20,concurrent:2,hourly:2,now:()=>now});
 const a=gate.acquire('a');a.release();const b=gate.acquire('b');b.release();
 assert.equal(gate.acquire('c').ok,false);now=3600001;assert.equal(gate.acquire('c').ok,true);
});
