(function(){
'use strict';
var S=window.B115,V=window.BomberV125;if(!S||!V)return;var installed=false,baseConnect=null,aux=null,target='',lastProbe=0,attempts=[];
function rid(id){return String(id||'')+'-v125-reverse'}function close(c){try{if(c)c.close()}catch(e){}}function clear(){target='';lastProbe=0;for(var i=0;i<attempts.length;i++)close(attempts[i]);attempts=[];try{if(aux)aux.destroy()}catch(e){}aux=null}
function auxReady(cb){if(aux&&aux.open)return cb(aux);if(aux&&!aux.destroyed){var n=0,t=setInterval(function(){if(aux&&aux.open){clearInterval(t);cb(aux)}else if(++n>20)clearInterval(t)},100);return}try{aux=new Peer(S.ICE);aux.on('open',function(){cb(aux)});aux.on('error',function(){})}catch(e){}}
// The guest chooses one channel by sending guestReady. Both host connection
// directions commit only that channel, avoiding crossed direct/reverse winners.
function hostCandidate(c,reverse){
 if(!c)return;attempts.push(c);
 c.on('data',function(d){
  if(d&&d.type==='guestReady'&&!S.started){
   if(S.conn&&S.conn!==c)close(S.conn);S.conn=c;
   V.connectionPath=reverse===false?'direct-host':'reverse-host';
   S.hostData(d);return;
  }
  if(S.conn===c)S.hostData(d);
 });
 c.on('open',function(){
  if(!S.host()||S.started){if(S.conn!==c)close(c);return}
  try{c.send({type:'hostHello',name:S.localName,ultimate:S.ultimate,dropRate:S.dropRate,kind:S.kind,code:S.code})}catch(e){}
 });
 c.on('close',function(){if(S.conn===c){S.conn=null;if(S.started&&S.els.matchStatus)S.els.matchStatus.textContent='PLAYER 2 DISCONNECTED'}});
 c.on('error',function(){});
}
function probe(){var now=Date.now();if(now-lastProbe<650||!window.Peer||!S.host||!S.host()||S.started||!S.peer||!S.peer.open||S.conn&&S.conn.open)return;var id=String(S.peer.id||'');if(!id||id.indexOf('bomberman-')!==0)return;lastProbe=now;target=rid(id);var wanted=target;auxReady(function(p){if(!S.host()||S.started||S.conn&&S.conn.open||wanted!==target)return;try{hostCandidate(p.connect(wanted,{serialization:'json',reliable:true,metadata:{kind:S.kind,code:S.code,reverse:true}}))}catch(e){}})}
function guestCandidate(c,finish){if(!c)return;c.on('data',function(d){if(S.conn===c)S.guestData(d)});c.on('open',function(){V.connectionPath=c.metadata&&c.metadata.reverse?'reverse-guest':'direct-guest';finish(c)});c.on('close',function(){if(S.conn===c&&S.started&&S.els.matchStatus)S.els.matchStatus.textContent='DISCONNECTED FROM HOST'});c.on('error',function(){})}
function symmetric(id,generation,done){
 if(generation!==S.generation)return done(false);try{if(S.peer)S.peer.destroy()}catch(e){}S.peer=S.conn=null;var reverse=rid(id),p,finished=false,timer=null,opened=false;
 function complete(c){if(finished){if(S.conn!==c)close(c);return}finished=true;if(timer)clearTimeout(timer);S.conn=c;S.status('Host found • connecting…','good');try{c.send({type:'guestReady',name:S.localName,kind:S.kind,code:S.code,reverse:true})}catch(e){}done(true)}
 function fail(){if(finished)return;finished=true;if(timer)clearTimeout(timer);try{p&&p.destroy()}catch(e){}if(S.peer===p)S.peer=null;done(false)}
 try{p=new Peer(reverse,S.ICE)}catch(e){if(baseConnect)return baseConnect.call(S,id,generation,done);return done(false)}S.peer=p;S.recover(p);p.on('connection',function(c){guestCandidate(c,complete)});p.on('open',function(){opened=true;if(V.forceReverseForTest)return;try{guestCandidate(p.connect(id,{serialization:'json',reliable:true,metadata:{kind:S.kind,code:S.code,name:S.localName,reverseListener:reverse}}),complete)}catch(e){}});p.on('error',function(e){var t=e&&e.type;if(!opened&&t==='unavailable-id'){try{p.destroy()}catch(x){}if(S.peer===p)S.peer=null;if(baseConnect)return baseConnect.call(S,id,generation,done);return}if(t==='unavailable-id')fail()});timer=setTimeout(fail,S.kind==='private'?7000:3200)
}
function install(){if(installed)return true;if(!V.coreInstalled||!S.connectFresh||!S.destroyNetwork)return false;installed=true;baseConnect=S.connectFresh;S.connectFresh=symmetric;S.acceptHost=function(c){hostCandidate(c,false)};var od=S.destroyNetwork;S.destroyNetwork=function(){clear();V.connectionPath='';return od.apply(S,arguments)};V.reverseId=rid;V.connectInstalled=true;return true}
var n=0,t=setInterval(function(){if(install()||++n>700)clearInterval(t)},40);setInterval(function(){if(installed)probe()},100);
})();

