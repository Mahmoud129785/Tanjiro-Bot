const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isConnected}=require('../public/pairing-state.js');
test('confirm linking only when backend confirms connected true',()=>{
  assert.equal(isConnected({connected:true}),true);
  assert.equal(isConnected({ok:true,code:'1234-5678'}),false);
  assert.equal(isConnected({connected:false}),false);
  assert.equal(isConnected({connected:'true'}),false);
  assert.equal(isConnected(null),false);
});