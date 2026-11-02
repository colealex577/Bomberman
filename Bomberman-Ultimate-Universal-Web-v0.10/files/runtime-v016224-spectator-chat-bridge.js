(function(){
'use strict';
var VERSION='v0.16.2.24',registry=[],boundPeer=null,lastKey='',lastAt=0,lastSeenKey='',lastSeenAt=0,MARK='\u2063BM16224\u2063';
function S(){return window.B115||null}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||160)}
function remove(c){var i=registry.indexOf(c);if(i>=0)registry.splice(i,1)}
function unpack(text){text=String(text||'');if(text.indexOf(MARK)!==0)return null;var rest=text.slice(MARK.length),i=rest.indexOf(MARK);if(i<0)return null;return{name:clean(rest.slice(0,i),14),text:clean(rest.slice(i+MARK.length),160)}}
function marked(text){return String(text||'').indexOf(MARK)===0}
function receive(d){var s=S(),p;if(!s||s.role!=='spectator'||!d||d.type!=='chat'||!(p=unpack(d.text)))return;var key=p.name+'\n'+p.text,now=Date.now();if(key===lastSeenKey&&now-lastSeenAt<300)return;lastSeenKey=key;lastSeenAt=now;if(s.appendChat)s.appendChat(p.name,p.text,false)}
function wire(c){if(!c||c.__v16224BridgeWired)return;c.__v16224BridgeWired=true;try{c.on('data',receive)}catch(e){};try{c.on('close',function(){remove(c)})}catch(e){};try{c.on('error',function(){remove(c)})}catch(e){}}
function add(c){var s=S(),md=c&&c.metadata||{};if(!c||!md.presence)return;wire(c);if(c.open&&c!==s?.conn&&registry.indexOf(c)<0)registry.push(c)}
function hookPeerConnect(){var C=window.Peer&&Peer.prototype;if(!C||!C.connect||C.connect.__v16224Bridge)return false;var old=C.connect;var wrapped=function(){var c=old.apply(this,arguments),opts=arguments[1]||{},md=opts.metadata||{};if(md.presence){wire(c);try{c.on('open',function(){add(c)})}catch(e){};if(c.open)add(c)}return c};wrapped.__v16224Bridge=true;C.connect=wrapped;return true}
function scanPeer(p){try{var m=p&&p.connections||{};Object.keys(m).forEach(function(k){(m[k]||[]).forEach(add)})}catch(e){}}
function bindPeer(){hookPeerConnect();var s=S(),p=s&&s.peer;if(!p)return;if(p!==boundPeer){boundPeer=p;registry=[];try{p.on('connection',function(c){var md=c&&c.metadata||{};if(!md.presence)return;wire(c);c.on('open',function(){add(c)});if(c.open)add(c)})}catch(e){}}scanPeer(p)}
function conns(){bindPeer();var s=S();for(var i=registry.length-1;i>=0;i--)if(!registry[i]||!registry[i].open||registry[i]===s?.conn)registry.splice(i,1);return registry.slice()}
function pack(name,text){if(window.BomberFix16224&&BomberFix16224.packChat)return BomberFix16224.packChat(name,text);return MARK+clean(name,14)+MARK+clean(text,160)}
function relay(name,text){var s=S();name=clean(name,14);text=clean(text,160);if(!s||s.kind!=='public'||(s.role!=='host'&&s.role!=='simulated')||!name||!text||marked(text))return false;var cs=conns();if(!cs.length)return false;var key=name+'\n'+text,now=Date.now();if(key===lastKey&&now-lastAt<220)return false;lastKey=key;lastAt=now;var payload=pack(name,text),sent=0;cs.forEach(function(c){try{c.send({type:'chat',text:payload});sent++}catch(e){}});return sent>0}
function hookAppend(){var s=S();if(!s||!s.appendChat||s.appendChat.__v16224Bridge)return false;var old=s.appendChat;var w=function(name,text,self){var p=unpack(text),shownName=p?p.name:name,shownText=p?p.text:text,key=clean(shownName,14)+'\n'+clean(shownText,160),now=Date.now();if(s.role==='spectator'&&!self&&key===lastSeenKey&&now-lastSeenAt<300)return false;if(s.role==='spectator'&&!self){lastSeenKey=key;lastSeenAt=now}var r=old.apply(s,arguments);relay(name||s.localName,text);return r};w.__v16224Bridge=true;s.appendChat=w;return true}
function hookDirect(){var f=window.BomberChatFix1544&&BomberChatFix1544.debug;if(!f||!f.directAppend||f.directAppend.__v16224Bridge)return false;var old=f.directAppend;var w=function(name,text,self){var r=old.apply(f,arguments);relay(name,text);return r};w.__v16224Bridge=true;f.directAppend=w;return true}
function install(){hookPeerConnect();bindPeer();hookAppend();hookDirect();window.BomberChatBridge16224={version:VERSION,connections:function(){return conns().length},relay:relay};if(document.body)document.body.setAttribute('data-v016224-chat-bridge','1')}
var tries=0,t=setInterval(function(){if(S()&&window.BomberFix16224){install();if(++tries>80)clearInterval(t)}},25);setInterval(install,70);
})();