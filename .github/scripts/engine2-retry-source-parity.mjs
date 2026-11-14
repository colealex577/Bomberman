import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const old=JSON.parse(fs.readFileSync(path.join(root,'.github/fixtures/engine2-211-retry-baseline.json'),'utf8')).sha256;
const changed=new Set(JSON.parse(fs.readFileSync(path.join(root,'ENGINE2_212_CHANGED_FILES.json'),'utf8')));
let same=0;for(const [p,h] of Object.entries(old)){const bytes=fs.readFileSync(path.join(root,p));const actual=crypto.createHash('sha256').update(bytes).digest('hex');if(!changed.has(p)){assert.equal(actual,h,p);same++;}}
console.log('V2.1.2 RELEASE PARITY PASS (v2.1.1 baseline)',JSON.stringify({retained:Object.keys(old).length,byteIdentical:same,changed:Object.keys(old).length-same}));
