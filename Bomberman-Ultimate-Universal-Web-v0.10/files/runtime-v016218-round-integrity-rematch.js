(function(){
'use strict';
/*
 * v0.16.2.18 shipped with a parse error, so none of its rematch overrides ever
 * executed in the live build. Keep that live behavior stable while exposing a
 * valid readiness marker for later runtimes and eliminating the page-level
 * SyntaxError that was poisoning multiplayer/browser diagnostics.
 */
var VERSION='v0.16.2.18';
if(window.BomberFix16218)return;
function currentContestants(){
  var g=window.gGameEngine;
  if(!g)return[];
  var out=[];
  (g.players||[]).concat(g.bots||[]).forEach(function(e){if(e&&out.indexOf(e)<0)out.push(e)});
  return out;
}
function winnerLabel(){
  var alive=currentContestants().filter(function(e){return e.alive!==false});
  if(alive.length!==1)return'NO SURVIVORS';
  var e=alive[0],g=window.gGameEngine,name=String(e.displayName||'').trim();
  if(name)return name+' WINS';
  var p=g&&g.players?g.players.indexOf(e):-1;
  return p>=0?'PLAYER '+(p+1)+' WINS':'AI SURVIVOR WINS';
}
window.BomberFix16218={
  version:VERSION,
  compatibilityOnly:true,
  winnerLabel:winnerLabel,
  captureAll:function(){return currentContestants()},
  repairContestants:function(){return true},
  showAutoRematch:function(){return false}
};
if(document.body)document.body.setAttribute('data-v016218-runtime','1');
})();