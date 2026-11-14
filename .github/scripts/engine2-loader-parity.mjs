import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),external=process.env.BASELINE_DIR||path.resolve(root,'../baseline');
const base=fs.existsSync(path.join(external,'Bomberman-Ultimate-Universal-Web-v0.10/files/app.js'))?external:path.resolve(root,'.github/fixtures/engine2-baseline');
async function run(dir,nodata=false){
 const src=path.join(dir,'Bomberman-Ultimate-Universal-Web-v0.10/files');
 const appended=[],byId=new Map(),calls=[],packed=[],intervals=[];
 const document={
  getElementById(id){return byId.get(id)||null},
  createElement(tag){return{tag,id:null,src:null,dataset:{},handlers:{},setAttribute(){},addEventListener(event,fn){(this.handlers[event]??=[]).push(fn)}}},
  head:{appendChild(node){if(node.tag!=="script")return;appended.push({id:node.id,src:node.src});byId.set(node.id,node);setImmediate(()=>{if(node.onload)node.onload();for(const f of (node.handlers.load||[]))f()})}},
  documentElement:null,addEventListener(){},querySelector(){return {textContent:'', id:'dummy'}}
 };
 const storage={getItem(k){return this[k]||null},setItem(k,v){this[k]=v}};
 const ctx=vm.createContext({window:null,console,document,localStorage:storage,
  location:{protocol:'http:',hostname:'local.test',search:nodata?'?nodata=1':''},navigator:{},
  setTimeout(cb,delay){setImmediate(cb);return 1},setInterval(cb,ms){intervals.push(ms);return intervals.length},
  URLSearchParams,Promise,Date,Error,StorageError:Error
 });ctx.window=ctx;
 ctx.BomberPackedLoader={load(id,src,cb){packed.push({id,src});const p=Promise.resolve().then(()=>{if(cb)cb(null)});return p}};
 if(dir===root){vm.runInContext(fs.readFileSync(path.join(src,'engine2/runtime-loader.js'),'utf8'),ctx)}
 vm.runInContext(fs.readFileSync(path.join(src,'app.js'),'utf8'),ctx);
 const result=ctx.loadCompatibility();
 if(result&&typeof result.then==='function') await result;
 else for(let i=0;i<100;i++)await new Promise(setImmediate);
 return {appended,packed,intervals,manifest:ctx.BomberEngine2Loader?.manifest,
   status:ctx.BomberEngine2Loader?.status()};
}
for (const nodata of [false,true]){
 const old=await run(base,nodata),now=await run(root,nodata);
 for(const prop of ['appended','packed','intervals']){
   const normalized=x=>JSON.parse(JSON.stringify(x)).map(o=>({id:o.id,src:o.src?o.src.split('?')[0]:o.src}));
   assert.deepEqual(normalized(now[prop]),normalized(old[prop]),`Boot changed ${prop} (nodata=${nodata})`);
 }
 assert.equal(now.status.state,'ready');
 assert.equal(now.status.loaded.length,nodata?2:39);
 assert.equal(now.manifest.length,39);
 console.log('ENGINE2 LOADER PARITY PASS',JSON.stringify({nodata,ordinary:now.appended.length,packed:now.packed.length,order:now.status.loaded.length}));
}
