(function(){
'use strict';
var S=window.B115,Q=window.BomberQOL;
if(!S||!Q||!window.GameEngine||!window.Player||!window.Bot)return;

/* Keep touch controls hidden unless a round is actually live. */
var styleId='qol-v0120-mobile-visibility-fix';
var st=document.getElementById(styleId);
if(!st){st=document.createElement('style');st.id=styleId;document.head.appendChild(st)}
st.textContent=`
body.touch-ui:not(.qol_round_live) .mobile_controls,
body:not(.desktop-ui):not(.qol_round_live) .mobile_controls{display:none!important}
.qol_stat_values{display:flex!important;align-items:center;gap:5px!important;line-height:1}
.qol_stat_item{display:inline-flex;align-items:center;gap:1px;white-space:nowrap;min-width:22px}
.qol_stat_icon{display:block;width:13px;height:13px;image-rendering:pixelated;image-rendering:crisp-edges}
.qol_stat_count{font:700 8px/1 Arial,sans-serif;color:#fff}
@media(max-width:640px){.qol_stat_values{gap:3px!important}.qol_stat_icon{width:12px;height:12px}.qol_stat_count{font-size:7px}.qol_stat_item{min-width:20px}}
`;

function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function hide(el){if(el)el.hidden=true}
function show(el){if(el)el.hidden=false}

/* ---------- restore the actual pickup graphics in the outside HUD ---------- */
function drawHeart(ctx){
  ctx.clearRect(0,0,16,16);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#5c0523';
  [[3,3,4,2],[9,3,4,2],[2,5,12,4],[3,9,10,2],[5,11,6,2],[7,13,2,1]].forEach(function(r){ctx.fillRect(r[0],r[1],r[2],r[3])});
  ctx.fillStyle='#ff3158';
  [[4,4,3,2],[9,4,3,2],[3,6,10,3],[4,9,8,2],[6,11,4,2],[7,13,2,1]].forEach(function(r){ctx.fillRect(r[0],r[1],r[2],r[3])});
  ctx.fillStyle='#ff8aa1';ctx.fillRect(4,5,2,2);ctx.fillRect(6,4,1,1)
}
function drawPickupIcon(canvas,type){
  if(!canvas)return;var ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,16,16);ctx.imageSmoothingEnabled=false;
  if(type==='heart'){drawHeart(ctx);return}
  var g=G(),img=g&&g.bonusesImg,index={speed:0,bomb:1,fire:2}[type];
  if(img&&img.width&&index!==undefined){try{ctx.drawImage(img,index*32,0,32,32,0,0,16,16)}catch(e){}}
}
function ensureGraphicHud(){
  var hud=$('qolStatHud');if(!hud)return;
  var boxes=hud.querySelectorAll('.qol_stat_box');
  for(var i=0;i<boxes.length;i++){
    var vals=boxes[i].querySelector('.qol_stat_values');if(!vals||vals.getAttribute('data-graphic-hud')==='1')continue;
    vals.setAttribute('data-graphic-hud','1');vals.textContent='';
    ['heart','speed','bomb','fire'].forEach(function(type){
      var item=document.createElement('span');item.className='qol_stat_item';item.setAttribute('data-qol-stat',type);
      var icon=document.createElement('canvas');icon.className='qol_stat_icon';icon.width=16;icon.height=16;icon.setAttribute('aria-hidden','true');
      var count=document.createElement('span');count.className='qol_stat_count';count.textContent='×0';
      item.appendChild(icon);item.appendChild(count);vals.appendChild(item);drawPickupIcon(icon,type)
    })
  }
}
function updateGraphicHud(){
  ensureGraphicHud();var g=G(),hud=$('qolStatHud');if(!g||!hud)return;
  var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[];
  for(var i=0;i<4;i++){
    var box=hud.querySelector('.qol_stat_box[data-slot="'+i+'"]'),e=slots[i];if(!box||!e||box.hidden)continue;
    var n=e.bonusCounts||{},values={heart:Number(e.hearts)||0,speed:Number(n.speed)||0,bomb:Number(n.bomb)||0,fire:Number(n.fire)||0};
    ['heart','speed','bomb','fire'].forEach(function(type){var item=box.querySelector('[data-qol-stat="'+type+'"]');if(!item)return;var count=item.querySelector('.qol_stat_count');if(count)count.textContent='×'+values[type];drawPickupIcon(item.querySelector('canvas'),type)})
  }
}
setInterval(updateGraphicHud,120);

/* ---------- Player 2 / human-like opponent always owns the bottom-right corner ---------- */
function slotPos(g,slot){
  if(g.getSpawnSlotPosition)return g.getSpawnSlotPosition(slot);
  var a=[{x:1,y:1},{x:1,y:g.tilesY-2},{x:g.tilesX-2,y:1},{x:g.tilesX-2,y:g.tilesY-2}];return{x:a[slot].x,y:a[slot].y}
}
function installBottomRightSpawn(){
  if(Q.__bottomRightSpawnInstalled)return;Q.__bottomRightSpawnInstalled=true;
  GameEngine.prototype.spawnBots=function(){
    this.bots=[];this.simulatedOpponent=null;var reserved={};
    if(this.playersCount>=1)reserved[0]=true;
    if(this.playersCount>=2)reserved[3]=true;
    if(this.simulatedOpponentMode&&window.SimulatedHumanBot){
      reserved[3]=true;var sim=new SimulatedHumanBot(slotPos(this,3));sim.id=3;sim.statSlot=3;sim.displayName=(this.playerNames&&this.playerNames[1])||'Player 2';this.simulatedOpponent=sim;this.bots.push(sim)
    }
    var avail=[];for(var s=0;s<4;s++)if(!reserved[s])avail.push(s);
    var count=Math.min(Number(this.botsCount)||0,avail.length);
    for(var i=0;i<count;i++){var slot=avail[i],bot=new Bot(slotPos(this,slot));bot.id=slot;bot.statSlot=slot;bot.displayName='AI '+(i+1);this.bots.push(bot)}
  };
  GameEngine.prototype.spawnPlayers=function(){
    this.players=[];
    if(this.playersCount>=1){var p1=new Player(slotPos(this,0),null,0);p1.statSlot=0;this.players.push(p1)}
    if(this.playersCount>=2){var ctr={up:'up2',left:'left2',down:'down2',right:'right2',bomb:'bomb2'},p2=new Player(slotPos(this,3),ctr,1);p2.statSlot=3;this.players.push(p2)}
  };
  Q.bottomRightOpponent=true
}

/* ---------- two-second elimination card, then decision; spectating itself is clean ---------- */
var eliminationTimer=null;
function clearEliminationTimer(){if(eliminationTimer){clearTimeout(eliminationTimer);eliminationTimer=null}}
function cleanSpectateScreen(){hide($('spectatorBanner'));hide($('remoteSpectatorBanner'))}
function stageElimination(label){
  clearEliminationTimer();Q.eliminatedOpen=true;
  var modal=$('qolEliminated'),banner=$('spectatorBanner'),title=$('spectatorTitle'),sub=$('spectatorSubtitle');
  hide(modal);if(title)title.textContent='GAME OVER';if(sub)sub.textContent='YOU’RE OUT';show(banner);document.body.classList.remove('qol_round_live');
  eliminationTimer=setTimeout(function(){
    eliminationTimer=null;var g=G(),post=$('qolPostMatch');
    cleanSpectateScreen();
    if((g&&g.matchFinished)||(post&&!post.hidden))return;
    if(modal){var mt=modal.querySelector('.qol_title'),mc=modal.querySelector('.qol_copy');if(mt)mt.textContent=label||'You’re out';if(mc)mc.textContent='Keep watching the round or return to the menu.';show(modal)}
  },2000)
}
function fixSpectateButton(){
  var b=$('qolSpectateBtn');if(!b||b.__cleanSpectate)return;b.__cleanSpectate=true;
  b.onclick=function(){clearEliminationTimer();Q.eliminatedOpen=false;hide($('qolEliminated'));cleanSpectateScreen();document.body.classList.remove('qol_round_live')}
}
setInterval(function(){fixSpectateButton();updateGraphicHud()},250);

function installStagedElimination(){
  if(Q.__stagedEliminationInstalled)return;Q.__stagedEliminationInstalled=true;
  var currentMultiSpec=GameEngine.prototype.beginMultiplayerSpectating;
  if(currentMultiSpec)GameEngine.prototype.beginMultiplayerSpectating=function(playerIndex){var r=currentMultiSpec.apply(this,arguments);var localIndex=S.role==='guest'?1:0;if(playerIndex===localIndex)stageElimination('You’re out');return r};
  var currentSpec=GameEngine.prototype.beginSpectating;
  if(currentSpec)GameEngine.prototype.beginSpectating=function(){var r=currentSpec.apply(this,arguments);if(S.role==='simulated')stageElimination('You’re out');return r};
  var currentFinish=GameEngine.prototype.finishCompetitiveMatch;
  if(currentFinish)GameEngine.prototype.finishCompetitiveMatch=function(){clearEliminationTimer();cleanSpectateScreen();return currentFinish.apply(this,arguments)};
  var currentFinishSpec=GameEngine.prototype.finishSpectating;
  if(currentFinishSpec)GameEngine.prototype.finishSpectating=function(){clearEliminationTimer();cleanSpectateScreen();return currentFinishSpec.apply(this,arguments)};
  var currentGameOver=GameEngine.prototype.gameOver;
  if(currentGameOver)GameEngine.prototype.gameOver=function(){clearEliminationTimer();cleanSpectateScreen();return currentGameOver.apply(this,arguments)};
  var currentGuestData=S.guestData;
  if(currentGuestData)S.guestData=function(d){var r=currentGuestData.apply(S,arguments);if(d&&d.type==='spectate'&&window.BomberDataSync&&BomberDataSync.active&&BomberDataSync.role==='guest')stageElimination(d.title||'You’re out');if(d&&d.type==='matchEnd'){clearEliminationTimer();cleanSpectateScreen()}return r};
  fixSpectateButton();Q.stagedElimination=true
}

/* QoL's main installer is asynchronous. Install these final overrides only after it
   has finished, otherwise its older spawn/death wrappers overwrite them. */
Q.hudGraphicsFixed=true;Q.bottomRightOpponent=false;Q.stagedElimination=false;
function finishInstall(){if(!Q.installed)return false;installBottomRightSpawn();installStagedElimination();updateGraphicHud();return true}
if(!finishInstall()){
  var installTries=0,installTimer=setInterval(function(){if(finishInstall()||++installTries>500)clearInterval(installTimer)},40)
}
})();