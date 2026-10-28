(function(){
'use strict';
var VERSION='v0.11.6';
function version(){
  var v=document.getElementById('buildVersion');
  if(!v){v=document.createElement('div');v.id='buildVersion';v.className='build_version';(document.body||document.documentElement).appendChild(v)}
  v.textContent=VERSION;v.setAttribute('aria-label','Game version');
  var s=v.style;
  function imp(k,val){try{s.setProperty(k,val,'important')}catch(e){s[k]=val}}
  imp('position','fixed');imp('top','calc(env(safe-area-inset-top, 0px) + 5px)');imp('left','calc(env(safe-area-inset-left, 0px) + 6px)');imp('right','auto');imp('bottom','auto');imp('z-index','2147483647');imp('display','block');imp('visibility','visible');imp('opacity','1');imp('transform','none');imp('margin','0');imp('padding','2px 5px');imp('border-radius','4px');imp('background','rgba(0,0,0,.62)');imp('color','rgba(255,255,255,.92)');imp('font','700 9px/1.25 Arial,sans-serif');imp('pointer-events','none');
}
function ready(){
  if(!window.Player||!window.Bot||!window.Bonus||!window.GameEngine)return false;
  var t=Bonus.prototype&&Bonus.prototype.types;
  return !!(t&&t.indexOf&&t.indexOf('heart')!==-1&&typeof GameEngine.prototype.updateStatHud==='function');
}
function patch(){
  version();
  if(!ready())return false;
  if(!Bot.prototype.__v0116PickupFix){
    Bot.prototype.__v0116PickupFix=true;
    Bot.prototype.applyBonus=function(bonus){return Player.prototype.applyBonus.call(this,bonus)};
  }
  return true;
}
version();
var tries=0,timer=setInterval(function(){if(patch()||++tries>240)clearInterval(timer)},50);
setInterval(version,1200);
['pageshow','focus','visibilitychange'].forEach(function(ev){window.addEventListener(ev,version,{passive:true})});
})();
