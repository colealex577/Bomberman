(function(){
'use strict';
var VERSION='v0.16.2.24',lastKey='',lastAt=0;
function S(){return window.B115||null}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||160)}
function render(name,text){var s=S(),box=s&&s.els&&s.els.chatMessages||document.getElementById('chatMessages');name=clean(name,14);text=clean(text,160);if(!box||!text)return false;var key=name+'\n'+text,now=Date.now();if(key===lastKey&&now-lastAt<300)return false;lastKey=key;lastAt=now;var row=document.createElement('div');row.className='chat_line';var who=document.createElement('strong'),body=document.createElement('span');who.textContent=name||'';body.textContent=text;if(name)row.appendChild(who);row.appendChild(body);box.appendChild(row);while(box.children.length>24)box.removeChild(box.firstChild);box.scrollTop=box.scrollHeight;return true}
function receive(d){var s=S();if(!s||s.role!=='spectator'||!d||typeof d!=='object'||d.type!=='spectatorChat')return;render(d.name||s.remoteName||'Player',d.text)}
function wire(c){if(!c||c.__v16224SpectatorChatWire)return;c.__v16224SpectatorChatWire=true;try{c.on('data',receive)}catch(e){}}
function scan(){var s=S(),m=s&&s.peer&&s.peer.connections;if(!s||s.role!=='spectator'||!m)return;Object.keys(m).forEach(function(k){(m[k]||[]).forEach(wire)})}
function install(){scan();window.BomberChatBridge16224={version:VERSION,render:render,scan:scan};if(document.body)document.body.setAttribute('data-v016224-chat-bridge','1')}
setInterval(install,70);install();
})();