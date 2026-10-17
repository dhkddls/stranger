import test from 'node:test';
import assert from 'node:assert/strict';
import {initial, scenes, choose, ending, restore} from './story.js';
test('Every branch reaches a complete ending and preserves one record per choice',()=>{
 let paths=0;const ends=new Set();
 function visit(s){
  assert.equal(s.records.length,s.scene);
  if(s.scene===scenes.length){const e=ending(s);ends.add(e.number);assert.ok(e.paragraphs.length>=5);assert.ok(e.paragraphs.every(p=>typeof p==='string'&&p.length>10));paths++;return;}
  const scene=scenes[s.scene];const p=typeof scene.paragraphs==='function'?scene.paragraphs(s):scene.paragraphs;
  assert.ok(p.every(t=>typeof t==='string'&&t.length>0));
  scene.choices.forEach((_,i)=>{const before=JSON.stringify(s);const next=choose(s,i);assert.equal(JSON.stringify(s),before);visit(next);});
 }
 visit(initial());assert.equal(paths,576);assert.equal(ends.size,3);
});
test('Earlier decisions change testimony and epilogue',()=>{
 let a=initial(),b=initial();for(let i=0;i<scenes.length;i++){if(i===3)assert.notDeepEqual(scenes[i].paragraphs(a),scenes[i].paragraphs(b));a=choose(a,0);b=choose(b,i===8?0:Math.min(1,scenes[i].choices.length-1));}assert.notDeepEqual(ending(a).paragraphs,ending(b).paragraphs);
});
test('Invalid choices are rejected',()=>{assert.throws(()=>choose(initial(),99));});

test('Restoring saves rejects impossible histories and rebuilds derived records',()=>{
 let s=initial();for(let i=0;i<scenes.length;i++){s=choose(s,0);assert.deepEqual(restore(JSON.parse(JSON.stringify(s))),s);}
 assert.equal(restore({scene:3,records:[],choices:{}}),null);
 assert.equal(restore({scene:1,records:[{}],choices:{0:'unknown'}}),null);
 assert.equal(restore(null),null);
 const altered=structuredClone(s);altered.records[0].text='forged';altered.mercy=999;
 assert.deepEqual(restore(altered),s);
});
