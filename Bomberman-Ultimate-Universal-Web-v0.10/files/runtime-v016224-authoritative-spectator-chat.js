(function(){
'use strict';
var VERSION='v0.16.2.24',oldAppend=null,oldDirect=null,lastKey='',lastAt=0;
function S(){return window.B115||null}
function P(){return window.BomberPublicPresence16223||null}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||160)}
function relay(name,text){var s=S(),p=P();name=clean(name||s&&s.localName||'Player',14);text=clean(text,160);if(!s||!p||!p.broadcastChat||s.kind!=='public'||(s.role!=='host'&&s.role!=='simulated')||!text)return false;var key=name+'\n'+text,now=Date.now();if(key===lastKey&&now-lastAt<220)return false;lastKey=key;lastAt=now;return !!p.broadcastChat(name,text)}
function hookAppend(){var s=S();if(!s||!s.appendChat||s.appendChat.__v16224AuthoritativeSpectatorChat)return false;oldAppend=s.appendChat;var w=function(name,text,self){var r=oldAppend.apply(s,arguments);relay(name,text);return r};w.__v16224AuthoritativeSpectatorChat=true;w.__v16224Relay=true;s.appendChat=w;return true}
function hookDirect(){var f=window.BomberChatFix1544&&BomberChatFix1544.debug;if(!f||!f.directAppend||f.directAppend.__v16224AuthoritativeSpectatorChat)return false;oldDirect=f.directAppend;var w=function(name,text,self){var r=oldDirect.apply(f,arguments);relay(name,text);return r};w.__v16224AuthoritativeSpectatorChat=true;w.__v16224Relay=true;f.directAppend=w;return true}
function install(){hookAppend();hookDirect();window.BomberAuthoritativeSpectatorChat16224={version:VERSION,relay:relay};if(document.body)document.body.setAttribute('data-v016224-authoritative-chat','1')}
var t=setInterval(function(){if(S()&&P()&&P().broadcastChat){install()}},50);setTimeout(function(){clearInterval(t)},120000);
})();