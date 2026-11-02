(function(){
'use strict';
var VERSION='v0.16.2.25',KICK_PACKET='v16225KickDir2',seen=typeof WeakSet==='function'?new WeakSet():null,throwBase=null,throwWrap=null;
function S(){return window.B115||null}
function F(){return window.BomberFriends16225||null}
function attach(c){if(!c)return c;if(seen&&seen.has(c))return c;if(seen)seen.add(c);else if(c.__v16225GameRoute)return c;c.__v16225GameRoute=true;c.on('data',function(d){var s=S();if(d&&d.type===KICK_PACKET&&s&&s.host&&s.host()&&s.conn===c&&throwBase){try{throwBase(1,d.dir,true)}catch(e){}}});return c}
function patchDirectional(){var f=F();if(!f||typeof f.throwDirectionIndex!=='function')return false;var cur=f.throwDirectionIndex;if(cur===throwWrap||cur.__v16225GameRouteThrow)return true;throwBase=cur;throwWrap=function(idx,d,authoritative){var ss=S();if(!authoritative&&Number(idx)===0&&ss&&ss.guest&&ss.guest()){try{return!!ss.send({type:KICK_PACKET,dir:d,version:VERSION})}catch(e){return false}}return throwBase.apply(f,arguments)};throwWrap.__v16225GameRouteThrow=true;f.throwDirectionIndex=throwWrap;return true}
function scan(){var s=S(),p=s&&s.peer;if(s&&s.conn)attach(s.conn);if(p&&p.connections)Object.keys(p.connections).forEach(function(k){(p.connections[k]||[]).forEach(attach)})}
function install(){var s=S(),f=F();if(!s||!f)return false;patchDirectional();scan();if(!window.BomberFriendsGameRoute16225){window.BomberFriendsGameRoute16225={version:VERSION,attach:attach,install:install,kickPacket:KICK_PACKET};if(document.body)document.body.setAttribute('data-v016225-friends-game-route','1')}return true}
var n=0,t=setInterval(function(){if(install()||++n>1800)clearInterval(t)},25);setInterval(function(){patchDirectional();scan()},80);
})();
