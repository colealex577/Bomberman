(function(){
'use strict';
if(window.__v16225DirectionalInputHotfix)return;
window.__v16225DirectionalInputHotfix=true;
/* Disable the older preload chord listener before preload-v0150 installs it. */
window.__v16225PreloadChordCapture=true;
var CHORD_MS=350,seq=0;
var states=[{down:false,used:false,timer:null},{down:false,used:false,timer:null}];
var held=[{},{}],swallowed={};
function editable(t){var q=String(t&&t.tagName||'').toLowerCase();return q==='input'||q==='textarea'||q==='select'||!!(t&&t.isContentEditable)}
function defaultThrow(idx){var code=idx===1?'KeyQ':'KeyE';try{if(window.BomberFix16222&&BomberFix16222.directKey)return BomberFix16222.directKey(code,true)}catch(e){}var g=window.gGameEngine,p=g&&g.players&&g.players[idx];if(p&&p.throwBombNow){p.throwBombNow();return true}return false}
function explicitThrow(idx,d){try{if(window.BomberFriends16225&&BomberFriends16225.throwDirectionIndex)return BomberFriends16225.throwDirectionIndex(idx,d)}catch(e){}var g=window.gGameEngine,p=g&&g.players&&g.players[idx];if(!p||!p.throwBombNow)return false;var old=p.getBombKickDirection,had=!!p.lastMoveDirection,last=had?{x:p.lastMoveDirection.x,y:p.lastMoveDirection.y}:null;p.getBombKickDirection=function(){return{x:d.x,y:d.y}};p.lastMoveDirection={x:d.x,y:d.y};try{return p.throwBombNow()}finally{if(old)p.getBombKickDirection=old;else try{delete p.getBombKickDirection}catch(x){}if(had)p.lastMoveDirection=last;else try{delete p.lastMoveDirection}catch(x){}}}
function dirFor(idx,code){var m=idx===0?{KeyW:{x:0,y:-1},KeyA:{x:-1,y:0},KeyS:{x:0,y:1},KeyD:{x:1,y:0}}:{ArrowUp:{x:0,y:-1},ArrowLeft:{x:-1,y:0},ArrowDown:{x:0,y:1},ArrowRight:{x:1,y:0}};return m[code]||null}
function stop(e){e.preventDefault();e.stopImmediatePropagation()}
function latestHeld(idx){var best=null,bestSeq=-1,o=held[idx];Object.keys(o).forEach(function(code){var h=o[code];if(h&&h.seq>bestSeq){bestSeq=h.seq;best=h.dir}});return best}
function finishDefault(idx){var st=states[idx];if(st.timer){clearTimeout(st.timer);st.timer=null}if(st.down&&!st.used){st.used=true;defaultThrow(idx)}}
function modDown(e,idx){stop(e);if(e.repeat)return;var st=states[idx];if(st.timer){clearTimeout(st.timer);st.timer=null}st.down=true;st.used=false;var d=latestHeld(idx);if(d){st.used=true;explicitThrow(idx,d);return}st.timer=setTimeout(function(){st.timer=null;if(st.down&&!st.used){st.used=true;defaultThrow(idx)}},CHORD_MS)}
function modUp(e,idx){stop(e);var st=states[idx];if(st.timer){clearTimeout(st.timer);st.timer=null}if(st.down&&!st.used)defaultThrow(idx);st.down=false;st.used=false}
window.addEventListener('keydown',function(e){
 if(editable(e.target))return;
 if(e.code==='KeyE'){modDown(e,0);return}
 if(e.code==='KeyQ'){modDown(e,1);return}
 for(var i=0;i<2;i++){
  var d=dirFor(i,e.code);if(!d)continue;var st=states[i];
  if(st.down&&!st.used){stop(e);if(e.repeat)return;swallowed[e.code]=i;if(st.timer){clearTimeout(st.timer);st.timer=null}st.used=true;explicitThrow(i,d);return}
  if(!e.repeat)held[i][e.code]={dir:d,seq:++seq};
 }
},true);
window.addEventListener('keyup',function(e){
 if(editable(e.target))return;
 if(e.code==='KeyE'){modUp(e,0);return}
 if(e.code==='KeyQ'){modUp(e,1);return}
 if(swallowed[e.code]!==undefined){stop(e);delete swallowed[e.code];return}
 for(var i=0;i<2;i++)if(dirFor(i,e.code))delete held[i][e.code];
},true);
window.BomberDirectionalInputHotfix16225={version:'v0.16.2.25-hotfix1',chordMs:CHORD_MS};
})();
