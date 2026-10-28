(function(){
'use strict';
var VERSION='v0.12.1';
var patched=false;
var allowAuthoritativeWoodRemove=false;
var smoothRaf=0;
var lastSmoothTime=0;
var simIntroToken=0;
var suppressLegacyIntroUntil=0;

function isGuestDataMatch(){
  return !!(window.BomberOnline&&BomberOnline.isDataMatch&&BomberOnline.isDataMatch()&&BomberOnline.isGuest&&BomberOnline.isGuest()&&window.gGameEngine&&gGameEngine.networkRole==='guest');
}

function setVersion(){
  var v=document.getElementById('buildVersion119')||document.getElementById('buildVersion120')||document.getElementById('buildVersion121')||document.getElementById('buildVersion');
  if(!v){v=document.createElement('div');v.id='buildVersion121';(document.body||document.documentElement).appendChild(v)}
  if(v.textContent!==VERSION)v.textContent=VERSION;
}

function installDpadImages(){
  var base=document.getElementById('mobileDpad');
  if(!base)return;
  base.style.webkitUserSelect='none';
  base.style.userSelect='none';
  base.style.webkitTouchCallout='none';
  base.style.webkitTapHighlightColor='transparent';
  if(!base.__v121SelectGuard){
    base.__v121SelectGuard=true;
    base.addEventListener('selectstart',function(e){e.preventDefault()});
    base.addEventListener('contextmenu',function(e){e.preventDefault()});
  }
  var svg='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="white" d="M24 7 8 25h10v16h12V25h10z"/></svg>');
  document.querySelectorAll('#mobileDpad .dpad_key').forEach(function(key){
    if(key.querySelector('img.v121_dpad_arrow'))return;
    key.textContent='';
    key.style.webkitUserSelect='none';key.style.userSelect='none';key.style.webkitTouchCallout='none';
    var img=document.createElement('img');
    img.className='v121_dpad_arrow';img.alt='';img.setAttribute('aria-hidden','true');img.draggable=false;img.src=svg;
    img.style.width='26px';img.style.height='26px';img.style.display='block';img.style.pointerEvents='none';img.style.webkitUserDrag='none';
    if(key.classList.contains('down'))img.style.transform='rotate(180deg)';
    else if(key.classList.contains('left'))img.style.transform='rotate(-90deg)';
    else if(key.classList.contains('right'))img.style.transform='rotate(90deg)';
    key.appendChild(img);
  });
}

function smoothRemoteEntities(now){
  if(!lastSmoothTime)lastSmoothTime=now||performance.now();
  var current=now||performance.now();
  var dt=Math.max(4,Math.min(50,current-lastSmoothTime));
  lastSmoothTime=current;
  if(isGuestDataMatch()&&gGameEngine&&gGameEngine.getPlayersAndBots){
    var all=gGameEngine.getPlayersAndBots();
    for(var i=0;i<all.length;i++){
      var e=all[i];
      if(!e||!e.bmp||!e.__v121NetTarget||!e.isBot||e.simulatedHuman)continue;
      var tx=e.__v121NetTarget.x,ty=e.__v121NetTarget.y;
      var dx=tx-e.bmp.x,dy=ty-e.bmp.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>96){e.bmp.x=tx;e.bmp.y=ty}
      else if(dist>.15){
        var alpha=1-Math.pow(0.72,dt/16.667);
        e.bmp.x+=dx*alpha;e.bmp.y+=dy*alpha;
      }else{e.bmp.x=tx;e.bmp.y=ty}
      if(e.alive){
        if(dist>.55&&e.__v121NetDir){try{e.animate(e.__v121NetDir)}catch(x){}}
        else if(current-(e.__v121NetTargetAt||0)>115){try{e.animate('idle')}catch(x){}}
      }
      if(e.updatePosition)e.updatePosition();
    }
  }
  smoothRaf=requestAnimationFrame(smoothRemoteEntities);
}

function patchNetworkSmoothing(){
  if(!window.GameEngine||!GameEngine.prototype.applyEntityNetworkState||!GameEngine.prototype.applyNetworkSnapshot||!window.Tile)return false;
  if(GameEngine.prototype.__v0121Smooth)return true;
  GameEngine.prototype.__v0121Smooth=true;

  var oldApplyEntity=GameEngine.prototype.applyEntityNetworkState;
  GameEngine.prototype.applyEntityNetworkState=function(e,s,pred){
    if(!isGuestDataMatch()||!e||!e.bmp||!s||!e.isBot||e.simulatedHuman){return oldApplyEntity.apply(this,arguments)}
    var ox=e.bmp.x,oy=e.bmp.y;
    var hadTarget=!!e.__v121NetTarget;
    var prev=hadTarget?e.__v121NetTarget:{x:Number(s.x),y:Number(s.y)};
    oldApplyEntity.call(this,e,s,true);
    var tx=Number(s.x),ty=Number(s.y);
    if(!isFinite(tx)||!isFinite(ty))return;
    var mdx=tx-prev.x,mdy=ty-prev.y;
    if(Math.abs(mdx)>=Math.abs(mdy)&&Math.abs(mdx)>.1)e.__v121NetDir=mdx>0?'right':'left';
    else if(Math.abs(mdy)>.1)e.__v121NetDir=mdy>0?'down':'up';
    e.__v121NetTarget={x:tx,y:ty};
    e.__v121NetTargetAt=performance.now();
    var dx=tx-ox,dy=ty-oy,dist=Math.sqrt(dx*dx+dy*dy);
    if(!hadTarget||dist>96){e.bmp.x=tx;e.bmp.y=ty}
    else{e.bmp.x=ox;e.bmp.y=oy}
    if(e.updatePosition)e.updatePosition();
  };

  var oldTileRemove=Tile.prototype.remove;
  Tile.prototype.remove=function(){
    if(isGuestDataMatch()&&this.material==='wood'&&!allowAuthoritativeWoodRemove)return;
    return oldTileRemove.apply(this,arguments);
  };

  var oldApplySnapshot=GameEngine.prototype.applyNetworkSnapshot;
  GameEngine.prototype.applyNetworkSnapshot=function(snap){
    if(!isGuestDataMatch())return oldApplySnapshot.apply(this,arguments);
    allowAuthoritativeWoodRemove=true;
    try{return oldApplySnapshot.apply(this,arguments)}
    finally{allowAuthoritativeWoodRemove=false}
  };

  if(!smoothRaf)smoothRaf=requestAnimationFrame(smoothRemoteEntities);
  return true;
}

function patchSimulatedOpening(){
  var S=window.B115;
  if(!S||!S.startSimulated||!S.simSay||S.__v0121Opening)return false;
  S.__v0121Opening=true;
  var oldStartSim=S.startSimulated;
  var oldSimSay=S.simSay;
  S.simSay=function(lines){
    if(lines===S.SIM_START&&Date.now()<suppressLegacyIntroUntil)return;
    return oldSimSay.apply(S,arguments);
  };
  S.startSimulated=function(){
    var token=++simIntroToken;
    var r=oldStartSim.apply(S,arguments);
    if(S.role==='simulated'&&window.gGameEngine){
      gGameEngine.__v0118OpeningHold=false;
      var sim=gGameEngine.simulatedOpponent;
      if(sim)sim.__v0118OpeningHold=true;
      setTimeout(function(){
        if(token!==simIntroToken||S.role!=='simulated'||!window.gGameEngine)return;
        gGameEngine.__v0118OpeningHold=false;
        var current=gGameEngine.simulatedOpponent;
        if(current){current.__v0118OpeningHold=false;current.started=true;current.startTimer=current.startTimerMax||0}
        suppressLegacyIntroUntil=Date.now()+6000;
        if(S.SIM_START)oldSimSay.call(S,S.SIM_START);
      },1000);
    }
    return r;
  };
  return true;
}

function patch(){
  if(patched)return true;
  if(!window.GameEngine||!window.gGameEngine||!window.BomberOnline||!window.B115||!window.Tile)return false;
  if(!patchNetworkSmoothing())return false;
  if(!patchSimulatedOpening())return false;
  patched=true;
  installDpadImages();
  setVersion();
  var mo=new MutationObserver(function(){installDpadImages();setVersion()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  return true;
}

setVersion();
var tries=0,t=setInterval(function(){setVersion();installDpadImages();if(patch()||++tries>300)clearInterval(t)},40);
setInterval(function(){setVersion();installDpadImages()},500);
})();
