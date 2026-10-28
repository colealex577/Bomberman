(function(){
'use strict';
var VERSION='v0.11.7', patched=false, duelPhase='', duelAttackAt=0, oldBotUpdate=null;
var FINAL_LINES=['ur dead','time to finish this','just you and me now','alright, no more hiding','this ends now','final round 😈'];

function version(){
  var v=document.getElementById('buildVersion');
  if(!v){v=document.createElement('div');v.id='buildVersion';v.className='build_version';(document.body||document.documentElement).appendChild(v)}
  if(v.textContent!==VERSION)v.textContent=VERSION;
  v.setAttribute('aria-label','Game version');
  var s=v.style;function imp(k,val){try{s.setProperty(k,val,'important')}catch(e){s[k]=val}}
  imp('position','fixed');imp('top','calc(env(safe-area-inset-top, 0px) + 5px)');imp('left','calc(env(safe-area-inset-left, 0px) + 6px)');imp('right','auto');imp('bottom','auto');imp('z-index','2147483647');imp('display','block');imp('visibility','visible');imp('opacity','1');imp('transform','none');imp('margin','0');imp('padding','2px 5px');imp('border-radius','4px');imp('background','rgba(0,0,0,.62)');imp('color','rgba(255,255,255,.92)');imp('font','700 9px/1.25 Arial,sans-serif');imp('pointer-events','none');
}
function watchVersion(){
  version();
  var v=document.getElementById('buildVersion');
  if(v&&window.MutationObserver){new MutationObserver(function(){if(v.textContent!==VERSION)version()}).observe(v,{childList:true,characterData:true,subtree:true})}
}
function mobile(){try{return document.body.classList.contains('touch-ui')||navigator.maxTouchPoints>0||matchMedia('(pointer: coarse)').matches||innerWidth<=700}catch(e){return innerWidth<=700}}
function style(){
  if(document.getElementById('v0117-runtime-style'))return;
  var st=document.createElement('style');st.id='v0117-runtime-style';st.textContent='.chat_panel.chat_docked{position:relative!important;top:auto!important;right:auto!important;left:auto!important;bottom:auto!important;z-index:1200!important;width:min(96vw,545px)!important;max-height:150px!important;margin:6px auto 0!important;border-radius:8px!important;box-shadow:none!important;backdrop-filter:none!important;background:rgba(25,11,19,.82)!important}.chat_panel.chat_docked .chat_header{padding:5px 8px}.chat_panel.chat_docked .chat_header button{display:none!important}.chat_panel.chat_docked .chat_messages{min-height:44px!important;max-height:70px!important;padding:6px 8px!important}.chat_panel.chat_docked .chat_form{padding:5px 6px!important}.chat_panel.chat_docked .chat_form input{padding:6px 8px!important}body.touch-ui .chat_toast{display:none!important}body.touch-ui #localStage,body.touch-ui #remoteStage{overflow:visible!important}@media(orientation:landscape){body.touch-ui .chat_panel.chat_docked{width:min(76vw,545px)!important;max-height:112px!important}body.touch-ui .chat_panel.chat_docked .chat_messages{max-height:44px!important;min-height:32px!important}}';
  document.head.appendChild(st);
}
function dockChat(){
  var S=window.B115;if(!S||!S.els||!S.els.chatPanel)return;
  var panel=S.els.chatPanel,toggle=S.els.chatToggle;
  if(mobile()){
    panel.classList.add('chat_docked');
    var active=(S.role==='guest'?(S.els.remoteStage||document.getElementById('remoteStage')):(S.els.localStage||document.getElementById('localStage')));
    if(active&&active.nextElementSibling!==panel)active.insertAdjacentElement('afterend',panel);
    if(S.role==='host'||S.role==='guest'||S.role==='simulated'){panel.hidden=false;if(toggle)toggle.hidden=true}
  }else{
    panel.classList.remove('chat_docked');
    if(panel.parentNode!==document.body)document.body.appendChild(panel);
  }
}
function ready(){
  var S=window.B115;
  return !!(S&&S.els&&S.startFallback&&S.startSimulated&&S.simSay&&window.Bot&&window.Player&&window.GameEngine&&window.gGameEngine&&window.Bonus&&Bonus.prototype.types&&Bonus.prototype.types.indexOf('heart')!==-1&&typeof GameEngine.prototype.updateStatHud==='function');
}
function resetDuel(){duelPhase='';duelAttackAt=0}
function patch(){
  if(patched||!ready())return false;patched=true;style();version();
  var S=window.B115;

  S.startFallback=function(){
    if(S.fallback)clearInterval(S.fallback);var end=Date.now()+5000;
    S.fallback=setInterval(function(){
      if(S.started||!S.online()){if(S.fallback)clearInterval(S.fallback);S.fallback=null;return}
      S.status(S.host()?'Waiting for public player…':'Searching public matches…','working');
      if(Date.now()>=end){clearInterval(S.fallback);S.fallback=null;S.startSimulated()}
    },250);
  };
  S.startSimulated=function(){
    if(S.kind!=='public'||!S.online())return;S.readName();S.remoteName=S.SIM_NAMES[Math.floor(Math.random()*S.SIM_NAMES.length)];S.destroyNetwork();S.kind='public';S.setRole('simulated');S.els.lobby.hidden=true;S.els.remoteStage.hidden=true;S.els.localStage.hidden=false;S.els.matchBar.hidden=false;S.els.matchStatus.textContent='PUBLIC • '+S.localName+' vs '+S.remoteName;resetDuel();
    if(window.gGameEngine){gGameEngine.playerNames=[S.localName,S.remoteName];gGameEngine.lobbyOpen=false;gGameEngine.simulatedOpponentMode=true;gGameEngine.menu.setMode('simulated');S.ensureMusic();S.chatVisibility();dockChat();setTimeout(function(){if(S.role==='simulated'){dockChat();S.simSay(S.SIM_START)}},2800+Math.random()*1900)}
  };

  var oldVis=S.chatVisibility;S.chatVisibility=function(){if(oldVis)oldVis.apply(S,arguments);dockChat()};
  var oldAppend=S.appendChat;S.appendChat=function(name,text,self,system){dockChat();if(mobile()&&S.els.chatPanel)S.els.chatPanel.hidden=false;return oldAppend.call(S,name,text,self,system)};
  if(S.els.chatClose)S.els.chatClose.onclick=function(){if(!mobile())S.els.chatPanel.hidden=true};
  window.addEventListener('resize',dockChat,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(dockChat,100)},{passive:true});

  if(!Bot.prototype.__v0117PickupFix){Bot.prototype.__v0117PickupFix=true;Bot.prototype.applyBonus=function(bonus){return Player.prototype.applyBonus.call(this,bonus)}}

  if(!Bot.prototype.__v0117PauseFix){
    Bot.prototype.__v0117PauseFix=true;oldBotUpdate=Bot.prototype.update;
    Bot.prototype.update=function(){
      if(this.simulatedHuman&&this.__v0117PauseUntil&&Date.now()<this.__v0117PauseUntil){this.setAttackMarkerVisible(false);this.animate('idle');if(this.handleFireDamage&&this.handleFireDamage())this.die();return}
      return oldBotUpdate.apply(this,arguments)
    };
  }

  var oldSpawn=GameEngine.prototype.spawnBots;
  if(!GameEngine.prototype.__v0117SpawnFix){
    GameEngine.prototype.__v0117SpawnFix=true;
    GameEngine.prototype.spawnBots=function(){var r=oldSpawn.apply(this,arguments);if(this.simulatedOpponentMode&&this.simulatedOpponent){var pos=this.getSpawnSlotPosition?this.getSpawnSlotPosition(1):{x:1,y:this.tilesY-2};this.simulatedOpponent.statSlot=1;this.simulatedOpponent.id=1;this.simulatedOpponent.position={x:pos.x,y:pos.y};var bp=Utils.convertToBitmapPosition(pos);this.simulatedOpponent.bmp.x=bp.x;this.simulatedOpponent.bmp.y=bp.y;this.simulatedOpponent.targetPosition={x:pos.x,y:pos.y};this.simulatedOpponent.targetBitmapPosition={x:bp.x,y:bp.y};if(this.simulatedOpponent.updatePosition)this.simulatedOpponent.updatePosition()}resetDuel();return r};
  }
  dockChat();return true;
}
function finalTick(){
  if(!patched||!window.B115||B115.role!=='simulated'||!window.gGameEngine||!gGameEngine.simulatedOpponentMode)return;
  var human=gGameEngine.players&&gGameEngine.players[0],sim=gGameEngine.simulatedOpponent;if(!human||!human.alive||!sim||!sim.alive){resetDuel();return}
  var living=[];for(var i=0;i<gGameEngine.bots.length;i++)if(gGameEngine.bots[i]&&gGameEngine.bots[i].alive)living.push(gGameEngine.bots[i]);
  if(living.length!==1||living[0]!==sim){resetDuel();return}
  var now=Date.now();
  if(!duelPhase){
    if((sim.isSafe&&!sim.isSafe(sim.position))||(sim.atTargetCenter&&!sim.atTargetCenter()))return;
    duelPhase='taunt';duelAttackAt=now+1250;sim.__v0117PauseUntil=duelAttackAt;gGameEngine.aiCombatState={attacker:null,target:null,until:0,nextRollAt:duelAttackAt,serial:1};dockChat();B115.simSay(FINAL_LINES);return;
  }
  if(duelPhase==='taunt'&&now>=duelAttackAt){duelPhase='attack';sim.__v0117PauseUntil=0;sim.hyperAggressive=true}
  if(duelPhase==='attack'){
    var serial=gGameEngine.aiCombatState&&gGameEngine.aiCombatState.serial||1;
    gGameEngine.aiCombatState={attacker:sim,target:human,until:9007199254740991,nextRollAt:9007199254740991,serial:serial+1,finalDuel:true};sim.combatTarget=human;sim.combatRole='attack';if(sim.setAttackMarkerVisible)sim.setAttackMarkerVisible(true)
  }
}
watchVersion();style();var tries=0,t=setInterval(function(){if(patch()||++tries>400)clearInterval(t)},50);setInterval(version,400);setInterval(finalTick,80);setInterval(dockChat,700);['pageshow','focus','visibilitychange'].forEach(function(ev){window.addEventListener(ev,function(){version();dockChat()},{passive:true})});
})();
