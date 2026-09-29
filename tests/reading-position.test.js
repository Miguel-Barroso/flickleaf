import test from 'node:test';
import assert from 'node:assert/strict';
import { createPositionStore, textFingerprint, normalizePosition, POSITION_KEY } from '../src/reading-position.js';
test('fingerprints match identical text and distinguish edits and headings', async () => {
  const a = [{text:'hello'}];
  assert.equal(await textFingerprint(a),await textFingerprint([{text:'hello'}]));
  assert.notEqual(await textFingerprint(a),await textFingerprint([{text:'Hello'}]));
  assert.notEqual(await textFingerprint(a),await textFingerprint([{text:'hello',heading:true}]));
});
test('bookmark writes only a fingerprint and index, clear preserves preferences', async () => {
  const data=new Map([['flickleaf.preferences.v1','keep']]);
  const store=createPositionStore({localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}});
  const fingerprint='a'.repeat(64);
  await store.save({version:1,fingerprint,index:12,text:'secret',url:'private'});
  assert.deepEqual(JSON.parse(data.get(POSITION_KEY)),{version:1,fingerprint,index:12});
  assert.equal((await store.load()).value.index,12);
  await store.clear();assert.equal(data.has(POSITION_KEY),false);assert.equal(data.get('flickleaf.preferences.v1'),'keep');
});
test('private extension sessions do not access saved bookmarks',async()=>{
  let calls=0;const store=createPositionStore({browser:{runtime:{id:'x'},extension:{inIncognitoContext:true},storage:{local:{get:()=>calls++,set:()=>calls++,remove:()=>calls++}}}});
  await store.load();await store.save({});await store.clear();assert.equal(calls,0);
});
test('malformed positions and failed storage are handled',async()=>{
  assert.equal(normalizePosition({version:1,fingerprint:'bad',index:1}),null);
  assert.equal(normalizePosition({version:1,fingerprint:'a'.repeat(64),index:-1}),null);
  assert.equal((await createPositionStore({}).load()).ok,false);
});

test('extension bookmarks use extension storage and serialize save before deletion',async()=>{
  const data={};const area={get:async key=>({[key]:data[key]}),set:async value=>{await new Promise(r=>setTimeout(r,5));Object.assign(data,value);},remove:async key=>{delete data[key];}};
  const store=createPositionStore({chrome:{runtime:{id:'x'},storage:{local:area}},get localStorage(){throw Error('Must not use page storage');}});
  const saved=store.save({version:1,fingerprint:'a'.repeat(64),index:5});const cleared=store.clear();await Promise.all([saved,cleared]);assert.deepEqual(data,{});
});
