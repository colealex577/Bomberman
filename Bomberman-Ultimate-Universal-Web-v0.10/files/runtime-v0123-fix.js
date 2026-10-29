(function(){
'use strict';
var tries=0;
function install(){
  if(!window.GameEngine||!window.Utils||!window.BomberQOL||!BomberQOL.bottomRightOpponent)return false;
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
if(!install())var t=setInterval(function(){if(install()||++tries>500)clearInterval(t)},40);
})();
