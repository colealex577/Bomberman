(function(){
'use strict';
var done=false;
function isCharacterCard(v){
  if(!v||!v.children)return false;
  for(var i=0;i<v.children.length;i++)if(v.children[i]&&v.children[i].text==='character')return true;
  return false;
}
function patch(){
  if(done||!window.Menu||!window.gGameEngine||!window.BomberCharacter)return false;
  done=true;
  var prior=Menu.prototype.draw;
  Menu.prototype.draw=function(){
    var r=prior.apply(this,arguments),w=gGameEngine.size.w;
    for(var i=0;i<this.views.length;i++){
      var v=this.views[i];
      if(isCharacterCard(v)){v.x=w/2-55;v.y=304;continue}
      if(!v||typeof v.x!=='number'||typeof v.y!=='number'||v.y<180||v.y>310)continue;
      if(v.x<w/2)v.x+=50;else if(v.x>w/2)v.x-=50;
    }
    return r;
  };
  return true;
}
var n=0,t=setInterval(function(){if(patch()||++n>150)clearInterval(t)},30);
})();
