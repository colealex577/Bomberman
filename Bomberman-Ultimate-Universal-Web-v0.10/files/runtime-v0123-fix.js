(function(){
'use strict';
var tries=0,menuTries=0;
function installCoreFixes(){
  if(!window.GameEngine||!window.Utils||!window.BomberQOL||!BomberQOL.bottomRightOpponent||!window.Bot)return false;
  /* Older simulated-opening code calls this unconditionally, while the current
     Bot class no longer renders attack markers. Keep the legacy hook harmless. */
  if(typeof Bot.prototype.setAttackMarkerVisible!=='function')Bot.prototype.setAttackMarkerVisible=function(){};
  if(GameEngine.prototype.__v123FinalSimCorner)return true;
  GameEngine.prototype.__v123FinalSimCorner=true;
  var old=GameEngine.prototype.spawnBots;
  GameEngine.prototype.spawnBots=function(){
    var r=old.apply(this,arguments),sim=this.simulatedOpponent;
    if(this.simulatedOpponentMode&&sim){
      var pos=this.getSpawnSlotPosition?this.getSpawnSlotPosition(3):{x:this.tilesX-2,y:this.tilesY-2};
      sim.id=3;sim.statSlot=3;sim.position={x:pos.x,y:pos.y};
      var bp=Utils.convertToBitmapPosition(pos);
      if(sim.bmp){sim.bmp.x=bp.x;sim.bmp.y=bp.y}
      sim.targetPosition={x:pos.x,y:pos.y};sim.targetBitmapPosition={x:bp.x,y:bp.y};
      if(sim.updatePosition)sim.updatePosition();
      if(window.BomberCharacter){
        var rr=Number(this.simulatedRating||window.B115&&B115.simulatedRating);
        if(isFinite(rr))sim.rating=Math.max(0,Math.min(1000,Math.round(rr)));
      }
    }
    return r
  };
  return true
}
function clickableMenuShapes(menu){
  var out=[];if(!menu||!menu.views||!window.createjs)return out;
  for(var i=0;i<menu.views.length;i++){
    var v=menu.views[i],clicks=v&&v._listeners&&v._listeners.click;
    if(v instanceof createjs.Shape&&clicks&&clicks.length)out.push(v)
  }
  return out
}
function alignMenuHitAreas(menu){
  var shapes=clickableMenuShapes(menu);
  /* Menu.js draws the Single/Online rectangles at absolute graphics coords,
     so moving their labels did not move the clickable Shape itself. Translate
     those Shapes by the same 50px used for their labels/icons. */
  if(shapes.length>=2){shapes[0].x=-50;shapes[1].x=50}
}
function installMenuHitFix(){
  if(!window.Menu||!window.createjs||!Menu.prototype.__v123Character)return false;
  if(Menu.prototype.__v123HitAreaFix){if(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible)alignMenuHitAreas(gGameEngine.menu);return true}
  Menu.prototype.__v123HitAreaFix=true;
  var oldDraw=Menu.prototype.draw;
  Menu.prototype.draw=function(){var r=oldDraw.apply(this,arguments);alignMenuHitAreas(this);return r};
  if(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible)alignMenuHitAreas(gGameEngine.menu);
  return true
}
if(!installCoreFixes())var t=setInterval(function(){if(installCoreFixes()||++tries>500)clearInterval(t)},40);
if(!installMenuHitFix())var mt=setInterval(function(){if(installMenuHitFix()||++menuTries>500)clearInterval(mt)},40);
})();
