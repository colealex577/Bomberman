const LOCAL_MESSAGES={Player1:'Player 1',Player2:'Player 2',move:'move',bomb:'plant the bomb',mute:'mute / unmute sound',restart:'restart',menu:'menu'};
let getLocalsMessage=(name)=>LOCAL_MESSAGES[name]||name;
function GUILocalization(){
 document.querySelector('#player1').textContent=getLocalsMessage('Player1');document.querySelector('#player2').textContent=getLocalsMessage('Player2');document.querySelector('#movement1').textContent=getLocalsMessage('move');document.querySelector('#bomb1').textContent=getLocalsMessage('bomb');document.querySelector('#movement2').textContent=getLocalsMessage('move');document.querySelector('#bomb2').textContent=getLocalsMessage('bomb');document.querySelector('#mute').textContent=getLocalsMessage('mute');document.querySelector('#restart').textContent=getLocalsMessage('restart');document.querySelector('#menu').textContent=getLocalsMessage('menu');
}
let Storage={setValue:(key,value)=>{localStorage[key]=JSON.stringify(value)},getValue:(key)=>{let result;try{if(localStorage[key])result=JSON.parse(localStorage[key])}catch(e){throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`)}return result}};
class StorageError extends Error{constructor(msg){super();this.name='StorageError';this.message=msg||'Storage Error';this.stack=(new Error()).stack}}
function loadScript(id,src,cb){if(document.getElementById(id)){if(cb)cb();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>{if(cb)cb()};document.head.appendChild(s)}
function dataDiagnosticsDisabled(){try{return new URLSearchParams(location.search).get('nodata')==='1'}catch(e){return false}}
function loadCompatibility(){
 loadScript('runtime-v0118-fix-loader','./files/runtime-v0116-fix.js?v=0118',function(){
  loadScript('runtime-v0119-loader','./files/runtime-v0119.js?v=0119',function(){
   if(dataDiagnosticsDisabled())return;
   loadScript('net-v0120-data-loader','./files/multiplayer-v0129.js?v=0129',function(){
    loadScript('runtime-v0120-qol-loader','./files/runtime-v0120-qol.js?v=0120',function(){
     loadScript('runtime-v0120-qol-fix-loader','./files/runtime-v0120-qol-fix.js?v=0120c',function(){
      loadScript('runtime-v0123-loader','./files/runtime-v0123.js?v=0123',function(){
       loadScript('runtime-v0123-fix-loader','./files/runtime-v0123-fix.js?v=0123b',function(){
        loadScript('runtime-v0123-final-loader','./files/runtime-v0123-final.js?v=0123c',function(){
         loadScript('runtime-v0123-polish-loader','./files/runtime-v0123-polish.js?v=0123d',function(){
          loadScript('runtime-v0124-loader','./files/runtime-v0124.js?v=0124',function(){
           loadScript('runtime-v0125-core-loader','./files/runtime-v0125-core.js?v=0125',function(){
            (function(){
             loadScript('runtime-v0125-connect-loader','./files/runtime-v0125-connect.js?v=0125',function(){
              loadScript('runtime-v0126-ai-loader','./files/runtime-v0126-ai.js?v=0126',function(){
               loadScript('runtime-v0127-loader','./files/runtime-v0127.js?v=0127',function(){
                loadScript('runtime-v0127-fix-loader','./files/runtime-v0127-fix.js?v=0127b',function(){
                 loadScript('runtime-v0127-leaderboard-loader','./files/runtime-v0127-leaderboard.js?v=0128',function(){
                  loadScript('runtime-v0127-menu-fix-loader','./files/runtime-v0127-menu-fix.js?v=0127d',function(){
                   loadScript('runtime-v0130-social-loader','./files/runtime-v0130-social.js?v=0130',function(){
                    loadScript('runtime-v0130-fix-loader','./files/runtime-v0130-fix.js?v=0130b');
                   });
                  });
                 });
                });
               });
              });
             });
            })();
           });
          });
         });
        });
       });
      });
     });
    });
   });
  });
 });
}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=0130b').catch(()=>{}))}
document.addEventListener('DOMContentLoaded',()=>{loadCompatibility();GUILocalization();gGameEngine.load()});
