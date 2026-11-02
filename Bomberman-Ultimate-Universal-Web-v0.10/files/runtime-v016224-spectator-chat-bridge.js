(function(){
'use strict';
var VERSION='v0.16.2.24',registry=[],boundPeer=null,lastKey='',lastAt=0,MARK='\u2063BM16224\u2063';
function S(){return window.B115||null}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||160)}
function remove(c){var i=registry.indexOf(c);if(i>=0)registry.splice(i,1)}
function add(c){var s=S(),md=c&&c.metadata||{};if(!c||!c.open||c===s?.conn||!md.presence)return;if(registry.indexOf(c)<0)registry.push(c)}
function bindPeer(){var s=S(),p=s&&s.peer;if(!p||p===boundPeer)return;boundPeer=p;registry=[];try{p.on('connection',function(c){var md=c&&c.metadata||{};if(!md.presence)return;c.on('open',function(){add(c)});c.on('close',function(){remove(c)});c.on('error',function(){remove(c)});if(c.open)add(c)})}catch(e){};try{var m=p.connections||{};Object.keys(m).forEach(function(k){(m[k]||[]).forEach(add)})}catch(e){}}
function conns(){bindPeer();var s=S();for(var i=registry.length-1;i>=0;i--)if(!registry[i]||!registry[i].open||registry[i]===s?.conn)registry.splice(i,1);return registry.slice()}
function pack(name,text){if(window.BomberFix16224&&BomberFix16224.packChat)return BomberFix16224.packChat(name,text);return MARK+clean(name,14)+MARK+clean(text,160)}
function marked(text){return String(text||'').indexOf(MARK)===0}
function relay(name,text){var s=S();name=clean(name,14);text=clean(text,160);if(!s||s.kind!=='public'||(s.role!=='host'&&s.role!=='simulated')||!name||!text||marked(text))return false;var cs=conns();if(!cs.length)return false;var oldCount=0;try{oldCount=window.BomberFix16224&&BomberFix16224.spectatorConnections?BomberFix16224.spectatorConnections():0}catch(e){}if(oldCount>0)return false;var key=name+'\n'+text,now=Date.now();if(key===lastKey&&now-lastAt<220)return false;lastKey=key;lastAt=now;var payload=pack(name,text),sent=0;cs.forEach(function(c){try{c.send({type:'chat',text:payload});sent++}catch(e){}});return sent>0}
function hookAppend(){var s=S();if(!s||!s.appendChat||s.appendChat.__v16224Bridge)return false;var old=s.appendChat;var w=function(name,text,self){var r=old.apply(s,arguments);relay(name||s.localName,text);return r};w.__v16224Bridge=true;s.appendChat=w;return true}
function hookDirect(){var f=window.BomberChatFix1544&&BomberChatFix1544.debug;if(!f||!f.directAppend||f.directAppend.__v16224Bridge)return false;var old=f.directAppend;var w=function(name,text,self){var r=old.apply(f,arguments);relay(name,text);return r};w.__v16224Bridge=true;f.directAppend=w;return true}
function install(){bindPeer();hookAppend();hookDirect();window.BomberChatBridge16224={version:VERSION,connections:function(){return conns().length},relay:relay};if(document.body)document.body.setAttribute('data-v016224-chat-bridge','1')}
var tries=0,t=setInterval(function(){if(S()&&window.BomberFix16224){install();if(++tries>80)clearInterval(t)}},25);setInterval(install,70);
})();