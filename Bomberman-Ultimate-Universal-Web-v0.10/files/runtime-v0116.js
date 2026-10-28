(function(){
'use strict';
var VERSION='v0.11.6';
if(!window.Player||!window.Bot||!window.GameEngine||!window.gGameEngine||!window.Bonus)return;

/* ---------- fixed version badge ---------- */
function ensureVersionBadge(){
  var v=document.getElementById('buildVersion');
  if(!v){v=document.createElement('div');v.id='buildVersion';v.className='build_version';document.body.appendChild(v)}
  v.textContent=VERSION;v.setAttribute('aria-label','Game version');
  var s=v.style;s.position='fixed';s.top='calc(env(safe-area-inset-top, 0px) + 5px)';s.left='calc(env(safe-area-inset-left, 0px) + 6px)';s.right='auto';s.bottom='auto';s.zIndex='2147483647';s.display='block';s.visibility='visible';s.opacity='1';s.transform='none';s.margin='0';s.padding='2px 5px';s.borderRadius='4px';s.background='rgba(0,0,0,.62)';s.color='rgba(255,255,255,.9)';s.font='700 9px/1.25 Arial,sans-serif';s.pointerEvents='none';
}
ensureVersionBadge();setInterval(ensureVersionBadge,1200);

/* ---------- no public-facing fallback label + human-ish chat timing ---------- */
var S=window.B115;
if(S){
  var oldWaiting=S.waiting,oldStatus=S.status;
  function scrub(t){t=String(t||'');if(!/simulated/i.test(t))return t;if(/private/i.test(t))return'Looking for your friend. Private rooms wait only for the matching access code.';if(/host/i.test(t)||/waiting/i.test(t))return'Waiting for public player…';if(/search/i.test(t)||/join/i.test(t))return'Searching public matches…';return'Public matchmaking…'}
  S.waiting=function(t,b){return oldWaiting.call(S,t,scrub(b))};
  S.status=function(t,k){return oldStatus.call(S,scrub(t),k)};
  S.startFallback=function(){if(S.fallback)clearInterval(S.fallback);var end=Date.now()+17000;S.fallback=setInterval(function(){if(S.started||!S.online()){if(S.fallback)clearInterval(S.fallback);S.fallback=null;return}S.status(S.host()?'Waiting for public player…':'Searching public matches…','working');if(Date.now()>=end){clearInterval(S.fallback);S.fallback=null;S.startSimulated()}},1000)};
  S.startSimulated=function(){
    if(S.kind!=='public'||!S.online())return;S.readName();S.remoteName=S.SIM_NAMES[Math.floor(Math.random()*S.SIM_NAMES.length)];S.destroyNetwork();S.kind='public';S.setRole('simulated');S.els.lobby.hidden=true;S.els.remoteStage.hidden=true;S.els.localStage.hidden=false;S.els.matchBar.hidden=false;S.els.matchStatus.textContent='PUBLIC • '+S.localName+' vs '+S.remoteName;
    if(window.gGameEngine){gGameEngine.playerNames=[S.localName,S.remoteName];gGameEngine.lobbyOpen=false;gGameEngine.simulatedOpponentMode=true;gGameEngine.menu.setMode('simulated');S.ensureMusic();S.chatVisibility();setTimeout(function(){S.simSay(S.SIM_START)},2400+Math.random()*1900)}
  };
  if(S.els&&S.els.publicBtn){
    var small=S.els.publicBtn.querySelector('small');if(small)small.textContent='Play with anyone • automatic public matchmaking';
    S.els.publicBtn.onclick=function(){S.readName();S.panel('public');S.status('Choose Host or Join. Public matchmaking will start a match automatically.','')};
  }
  var pub=document.getElementById('publicMatchPanel');if(pub){var pp=pub.querySelector('p');if(pp)pp.textContent='Host a public lobby or search for one. Matchmaking starts automatically when an opponent is ready.'}
  if(window.BomberOnline){
    BomberOnline.onSimulatedOpponentDeath=function(e){if(S.role==='simulated'&&e&&e.simulatedHuman)setTimeout(function(){S.simSay(S.SIM_DEATH)},450+Math.random()*500)};
    BomberOnline.onHumanKilled=function(p,k){if(S.role==='simulated'&&window.gGameEngine&&p===gGameEngine.players[0]&&k&&k.simulatedHuman)setTimeout(function(){S.simSay(S.SIM_KILL)},350+Math.random()*450)};
  }
}

/* ---------- fourth power-up: pixel-art heart ---------- */
var heartCanvas=null;
function makeHeartCanvas(){
  if(heartCanvas)return heartCanvas;
  var c=document.createElement('canvas');c.width=32;c.height=32;var x=c.getContext('2d');x.imageSmoothingEnabled=false;
  x.fillStyle='#c02666';x.fillRect(0,0,32,32);x.fillStyle='#92124f';x.fillRect(2,2,28,28);x.fillStyle='#eb6f97';x.fillRect(4,4,24,24);
  x.fillStyle='#5c0523';
  [[8,10,2,7],[10,8,5,13],[15,10,3,14],[18,8,5,13],[23,10,3,7],[12,19,9,4],[15,23,3,3]].forEach(function(r){x.fillRect(r[0],r[1],r[2],r[3])});
  x.fillStyle='#ff2d54';
  [[9,11,2,5],[11,9,4,10],[15,12,3,10],[18,9,4,10],[22,11,3,5],[11,16,13,3],[13,19,7,3],[15,22,3,2]].forEach(function(r){x.fillRect(r[0],r[1],r[2],r[3])});
  x.fillStyle='#ff5271';x.fillRect(11,11,3,5);x.fillRect(13,10,2,8);x.fillStyle='#fff';x.fillRect(11,11,2,3);x.fillRect(13,11,1,1);
  heartCanvas=c;return c;
}
Bonus.prototype.types=['speed','bomb','fire','heart'];
var oldBonusInit=Bonus.prototype.init;
Bonus.prototype.init=function(position,typePosition){
  if(typePosition!==3)return oldBonusInit.apply(this,arguments);
  this.type='heart';this.position=position;this.bmp=new createjs.Bitmap(makeHeartCanvas());var px=Utils.convertToBitmapPosition(position);this.bmp.x=px.x;this.bmp.y=px.y;gGameEngine.stage.addChild(this.bmp);
};
GameEngine.prototype.drawBonuses=function(){
  var woods=[];for(var i=0;i<this.tiles.length;i++)if(this.tiles[i].material==='wood')woods.push(this.tiles[i]);woods.sort(function(){return.5-Math.random()});
  if(this.ultimateMode){for(var u=0;u<woods.length;u++){var b=new Bonus(woods[u].position,u%4);this.bonuses.push(b);this.moveToFront(woods[u].bmp)}return}
  var rate=Number(this.bonusesPercent);if(!isFinite(rate))rate=16;rate=Math.max(16,Math.min(100,rate));var type=0;
  for(var n=0;n<woods.length;n++)if(rate>=100||Math.random()*100<rate){var bonus=new Bonus(woods[n].position,type%4);this.bonuses.push(bonus);this.moveToFront(woods[n].bmp);type++}
};

/* ---------- hearts + pickup counters ---------- */
var oldPlayerInit=Player.prototype.init;
Player.prototype.init=function(){var r=oldPlayerInit.apply(this,arguments);this.alive=true;this.hearts=0;this.bonusCounts={speed:0,bomb:0,fire:0,heart:0};this.lastAbsorbedBomb=null;this.statSlot=Number(this.id)||0;if(this instanceof Bot&&!this.simulatedHuman)this.displayName='AI '+(this.statSlot+1);return r};
var oldApply=Player.prototype.applyBonus;
Player.prototype.applyBonus=function(b){
  if(!this.bonusCounts)this.bonusCounts={speed:0,bomb:0,fire:0,heart:0};
  if(b&&b.type==='heart'){this.hearts=(Number(this.hearts)||0)+1;this.bonusCounts.heart=this.hearts}
  else{oldApply.apply(this,arguments);if(b&&this.bonusCounts.hasOwnProperty(b.type))this.bonusCounts[b.type]++}
  if(gGameEngine.updateStatHud)gGameEngine.updateStatHud();
};
function heartPop(e){try{var t=new createjs.Text('♥','bold 18px Helvetica','#ff5f87');t.textAlign='center';t.shadow=new createjs.Shadow('rgba(0,0,0,.95)',0,1,2);t.x=e.bmp.x+14;t.y=e.bmp.y-15;gGameEngine.stage.addChild(t);var st=Date.now(),iv=setInterval(function(){var q=Date.now()-st;t.y-=.8;t.alpha=Math.max(0,1-q/700);if(q>=700){clearInterval(iv);try{gGameEngine.stage.removeChild(t)}catch(x){}}},30)}catch(x){}}
Player.prototype.detectFireCollision=function(){
  var bombs=gGameEngine.bombs;for(var i=0;i<bombs.length;i++){var bomb=bombs[i];if(!bomb||!bomb.exploded)continue;for(var j=0;j<bomb.fires.length;j++){var f=bomb.fires[j];if(f&&f.position.x===this.position.x&&f.position.y===this.position.y){if(this.lastAbsorbedBomb===bomb)continue;this.lastHitBy=bomb.owner||null;if((Number(this.hearts)||0)>0){this.hearts--;if(!this.bonusCounts)this.bonusCounts={speed:0,bomb:0,fire:0,heart:0};this.bonusCounts.heart=this.hearts;this.lastAbsorbedBomb=bomb;heartPop(this);if(gGameEngine.updateStatHud)gGameEngine.updateStatHud();return false}return true}}}return false
};

/* ---------- fixed contestant corners + four-corner HUD ---------- */
GameEngine.prototype.getSpawnSlotPosition=function(slot){var a=[{x:1,y:1},{x:1,y:this.tilesY-2},{x:this.tilesX-2,y:1},{x:this.tilesX-2,y:this.tilesY-2}];return{x:a[slot].x,y:a[slot].y}};
GameEngine.prototype.spawnBots=function(){
  this.bots=[];this.simulatedOpponent=null;var reserved={};if(this.playersCount>=1)reserved[0]=true;if(this.playersCount>=2)reserved[1]=true;
  if(this.simulatedOpponentMode){reserved[1]=true;var sim=new SimulatedHumanBot(this.getSpawnSlotPosition(1));sim.id=1;sim.statSlot=1;sim.displayName=(this.playerNames&&this.playerNames[1])||'Player 2';this.simulatedOpponent=sim;this.bots.push(sim)}
  var avail=[];for(var s=0;s<4;s++)if(!reserved[s])avail.push(s);var count=Math.min(Number(this.botsCount)||0,avail.length);for(var i=0;i<count;i++){var slot=avail[i],bot=new Bot(this.getSpawnSlotPosition(slot));bot.id=slot;bot.statSlot=slot;bot.displayName='AI '+(slot+1);this.bots.push(bot)}
};
GameEngine.prototype.spawnPlayers=function(){
  this.players=[];if(this.playersCount>=1){var p1=new Player(this.getSpawnSlotPosition(0),null,0);p1.statSlot=0;this.players.push(p1)}
  if(this.playersCount>=2){var ctr={up:'up2',left:'left2',down:'down2',right:'right2',bomb:'bomb2'},p2=new Player(this.getSpawnSlotPosition(1),ctr,1);p2.statSlot=1;this.players.push(p2)}
};
GameEngine.prototype.getContestantsByStatSlot=function(){var slots=[null,null,null,null],all=this.getPlayersAndBots();for(var i=0;i<all.length;i++){var e=all[i],s=e&&Number(e.statSlot);if(e&&s>=0&&s<4&&!slots[s])slots[s]=e}return slots};
GameEngine.prototype.createStatHud=function(){
  this.statHud=[];if(!this.stage)return;var w=118,h=36,p=4,pos=[{x:p,y:p},{x:p,y:this.size.h-h-p},{x:this.size.w-w-p,y:p},{x:this.size.w-w-p,y:this.size.h-h-p}];
  for(var slot=0;slot<4;slot++){var c=new createjs.Container();c.x=pos[slot].x;c.y=pos[slot].y;c.addChild(new createjs.Shape(new createjs.Graphics().beginFill('rgba(0,0,0,.56)').drawRoundRect(0,0,w,h,5)));var name=new createjs.Text('Player '+(slot+1),'bold 9px Helvetica','#fff');name.x=5;name.y=3;name.maxWidth=w-10;c.addChild(name);var vals=[],types=[3,0,1,2];for(var q=0;q<4;q++){var icon;if(types[q]===3)icon=new createjs.Bitmap(makeHeartCanvas());else{icon=new createjs.Bitmap(gGameEngine.bonusesImg);icon.sourceRect=new createjs.Rectangle(types[q]*32,0,32,32)}icon.scaleX=icon.scaleY=.39;icon.x=5+q*28;icon.y=19;c.addChild(icon);var v=new createjs.Text('x0','bold 8px Helvetica','#fff');v.x=icon.x+13;v.y=21;c.addChild(v);vals.push(v)}this.stage.addChild(c);this.statHud.push({container:c,name:name,values:vals,slot:slot})}this.updateStatHud()
};
GameEngine.prototype.updateStatHud=function(){if(!this.statHud||!this.statHud.length||!this.stage)return;var c=this.getContestantsByStatSlot();for(var i=0;i<this.statHud.length;i++){var h=this.statHud[i],e=c[h.slot];h.container.visible=!!(this.playing&&!this.menu.visible&&e);if(!e)continue;h.name.text=e.displayName||('Player '+(h.slot+1));h.name.color=e.alive?'#fff':'#aaa';var n=e.bonusCounts||{speed:0,bomb:0,fire:0,heart:0};h.values[0].text='x'+(Number(e.hearts)||0);h.values[1].text='x'+(Number(n.speed)||0);h.values[2].text='x'+(Number(n.bomb)||0);h.values[3].text='x'+(Number(n.fire)||0);h.container.alpha=e.alive?1:.58;try{this.moveToFront(h.container)}catch(x){}}};
var oldSetup=GameEngine.prototype.setup;
GameEngine.prototype.setup=function(){var r=oldSetup.apply(this,arguments);this.createStatHud();return r};
try{gGameEngine.createStatHud()}catch(e){}
setInterval(function(){try{gGameEngine.updateStatHud()}catch(e){}},90);
})();
