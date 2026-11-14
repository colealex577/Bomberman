(function(){
'use strict';
/* Run each packed runtime exactly once. Local file:// pages cannot reliably
   fetch .gz.b64 resources, so use byte-identical expanded runtime scripts. */
var jobs=Object.create(null);
function decodeGzipBase64(text){
  var bin=atob(String(text||'').replace(/\s+/g,'')),bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  if(typeof DecompressionStream!=='function')throw new Error('This browser does not support DecompressionStream');
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
function offlineUrl(url){
  var next=String(url).replace(/\.js\.gz\.b64(?=\?|$)/,'.offline.js');
  if(next===url)throw new Error('No expanded runtime name for '+url);
  return next;
}
function expandedScript(url){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');
    s.src=offlineUrl(url);
    s.onload=function(){resolve(true)};
    s.onerror=function(){reject(new Error('Could not load expanded runtime '+s.src))};
    (document.head||document.documentElement).appendChild(s);
  });
}
function packedScript(url){
  return fetch(url,{cache:'no-store'})
    .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status+' loading '+url);return r.text()})
    .then(decodeGzipBase64)
    .then(function(source){(0,eval)(source+'\n//# sourceURL='+url.replace(/\.gz\.b64(?:\?.*)?$/,'.js'));return true});
}
function markLoaded(id){
  var marker=document.getElementById(id);
  if(!marker){marker=document.createElement('meta');marker.id=id;(document.head||document.documentElement).appendChild(marker)}
  marker.setAttribute('data-packed-runtime','loaded');
  return true;
}
function load(id,url,cb){
  if(!jobs[id]){
    var job=(location.protocol==='file:'?expandedScript(url):
      packedScript(url).catch(function(err){
        console.warn('[Bomberman packed runtime] loading expanded script:',id,err);
        return expandedScript(url);
      }));
    jobs[id]=job.then(function(){return markLoaded(id)}).catch(function(err){
      delete jobs[id];console.error('[Bomberman packed runtime]',id,err);throw err
    });
  }
  jobs[id].then(function(){if(cb)cb()}).catch(function(err){if(cb)cb(err)});
  return jobs[id];
}
window.BomberPackedLoader={load:load,jobs:jobs};
})();
