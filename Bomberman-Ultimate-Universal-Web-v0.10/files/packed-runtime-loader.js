(function(){
'use strict';
var jobs=Object.create(null);
function decodeGzipBase64(text){
  var bin=atob(String(text||'').replace(/\s+/g,'')),bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  if(typeof DecompressionStream!=='function')throw new Error('This browser does not support DecompressionStream');
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
function load(id,url,cb){
  if(!jobs[id]){
    jobs[id]=fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status+' loading '+url);return r.text()}).then(decodeGzipBase64).then(function(source){
      (0,eval)(source+'\n//# sourceURL='+url.replace(/\.gz\.b64(?:\?.*)?$/,'.js'));
      var marker=document.getElementById(id);if(!marker){marker=document.createElement('meta');marker.id=id;(document.head||document.documentElement).appendChild(marker)}
      marker.setAttribute('data-packed-runtime','loaded');return true;
    }).catch(function(err){delete jobs[id];console.error('[Bomberman packed runtime]',id,err);throw err});
  }
  jobs[id].then(function(){if(cb)cb()}).catch(function(err){if(cb)cb(err)});return jobs[id];
}
window.BomberPackedLoader={load:load,jobs:jobs};
})();
