(function(){
'use strict';
var VERSION='v0.15.1',active=false,searchGeneration=0,publicIndex=0,lastStart=0;
function S(){return window.B115||null}
function button(){return document.getElementById('publicMatchBtn')}
function live(){var s=S();return!!(s&&(s.started||s.role==='simulated'||(s.kind==='public'&&(s.role==='host'||s.role==='guest'))))}
function closeAttempt(){var s=S();if(!s)return;try{if(s.conn)s.conn.close()}catch(e){}try{if(s.peer)s.peer.destroy()}catch(e){}s.conn=s.peer=null}
function claimOrJoin(i,g){
 var s=S();if(!s||!active||g!==searchGeneration||g!==s.generation||s.started||s.kind!=='public')return;
 if(i>=s.PUBLIC.length){publicIndex=0;setTimeout(function(){claimOrJoin(0,g)},350);return}
 publicIndex=i+1;closeAttempt();s.setRole('host');s.status('Searching public matches…','working');
 var id=s.PUBLIC[i],p;
 try{p=new Peer(id,s.ICE)}catch(e){setTimeout(function(){claimOrJoin(i+1,g)},80);return}
 s.peer=p;s.recover(p);
 p.on('open',function(){if(active&&g===searchGeneration&&s.peer===p&&!s.started){s.setRole('host');s.status('Waiting for public player…','working')}});
 p.on('connection',function(c){if(active&&g===searchGeneration&&s.peer===p&&s.host()&&!s.started)s.acceptHost(c);else try{c.close()}catch(e){}});
 p.on('error',function(e){
  if(s.peer!==p)return;var type=e&&e.type;
  if(type==='unavailable-id'){
   try{p.destroy()}catch(x){}if(s.peer===p)s.peer=null;
   s.setRole('guest');s.status('Player found • connecting…','good');
   s.connectFresh(id,g,function(ok){if(!ok&&active&&g===searchGeneration&&g===s.generation&&!s.started){s.setRole('host');claimOrJoin(i+1,g)}})
  }else{
   try{p.destroy()}catch(x){}if(s.peer===p)s.peer=null;
   if(active&&g===searchGeneration&&g===s.generation&&!s.started)claimOrJoin(i+1,g)
  }
 })
}
function startPublic(){
 var s=S(),now=Date.now();if(!s)return false;if(live())return true;if(now-lastStart<80)return live();lastStart=now;
 if(!s.PUBLIC||!s.PUBLIC.length||typeof s.connectFresh!=='function'||typeof s.acceptHost!=='function'||typeof s.loadPeer!=='function')return false;
 s.destroyNetwork();s.readName();active=true;publicIndex=0;s.kind='public';s.code='';s.setRole('host');
 if(typeof s.waiting==='function')s.waiting('Searching for a public match','Looking for an available opponent…');
 s.status('Searching public matches…','working');if(typeof s.startFallback==='function')s.startFallback();
 searchGeneration=s.generation;var g=searchGeneration;
 s.loadPeer(function(){if(active&&g===searchGeneration&&g===s.generation&&!s.started)claimOrJoin(0,g)});
 return true
}
function cancelIfNeeded(){var s=S();if(!s||s.kind!=='public'||s.started)return;if(s.role==='offline'){active=false}}
function install(){
 window.BomberMatchmaking151={version:VERSION,ready:function(){var s=S();return!!(s&&s.PUBLIC&&s.connectFresh&&s.acceptHost&&s.loadPeer)},ensureStarted:startPublic,startPublic:startPublic,isLive:live};
 if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberMatchmaking151.debug={captured:function(){return!!button()},dropHandler:function(){var b=button();if(b)b.onclick=null;return!!b},restoreHandler:function(){return!!button()},repair:startPublic,ownerSource:function(){return'v0.15.1 automatic public owner'},active:function(){return active},index:function(){return publicIndex}};
 return true
}
// Own Search Public in the capture phase. Older UI layers may install an
// intermediate "Choose Host or Join" onclick on the button; prevent that
// handler from turning the first click into a dead-end panel transition.
document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#publicMatchBtn');if(!b)return;if(live())return;e.preventDefault();e.stopImmediatePropagation();startPublic()},true);
var t=setInterval(function(){install();cancelIfNeeded()},50);install();
})();
