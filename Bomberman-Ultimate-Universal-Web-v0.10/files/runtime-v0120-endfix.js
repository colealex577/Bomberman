(function(){
'use strict';
var done=false;
function patch(){
 if(done||!window.GameEngine||!window.BomberOnline)return false;
 done=true;
 var oldGameOver=GameEngine.prototype.gameOver;
 GameEngine.prototype.gameOver=function(status){
  var sim=BomberOnline.isSimulated&&BomberOnline.isSimulated();
  var r=oldGameOver.apply(this,arguments);
  if(sim&&BomberOnline.onRoundEnded)setTimeout(function(){BomberOnline.onRoundEnded(status==='win'?'You won!':'Game Over')},0);
  return r;
 };
 var oldFinishSpectating=GameEngine.prototype.finishSpectating;
 GameEngine.prototype.finishSpectating=function(text){
  var sim=BomberOnline.isSimulated&&BomberOnline.isSimulated();
  var r=oldFinishSpectating.apply(this,arguments);
  if(sim&&BomberOnline.onRoundEnded)setTimeout(function(){BomberOnline.onRoundEnded(text||'Round over')},0);
  return r;
 };
 return true;
}
var n=0,t=setInterval(function(){if(patch()||++n>200)clearInterval(t)},40);
})();