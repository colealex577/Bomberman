(function(){
'use strict';
var installed=false;
function G(){return window.gGameEngine||null}
function simActors(){var g=G(),out=[];if(!g)return out;function add(b){if(b&&b.simulatedHuman&&out.indexOf(b)<0)out.push(b)};(g.__v130RoundBots||[]).forEach(add);(g.bots||[]).forEach(add);add(g.simulatedOpponent);return out}
function displayName(b){return String(b&&b.displayName||b&&b.__v152Profile&&b.__v152Profile.name||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Player'}
function lockNames(){var a=simActors(),locked=[];for(var i=0;i<a.length;i++){var b=a[i],name=displayName(b),g=G(),round=g&&g.__v130RoundBots||[],idx=round.indexOf(b);if(!b.__v130AiKey&&idx>=0)b.__v130AiKey='ai'+idx;try{Object.defineProperty(b,'__v130AiName',{configurable:true,enumerable:true,get:(function(n){return function(){return n}})(name),set:function(){}});locked.push({b:b,name:name})}catch(e){b.__v130AiName=name}}return function(){for(var j=0;j<locked.length;j++){var x=locked[j];try{Object.defineProperty(x.b,'__v130AiName',{configurable:true,enumerable:true,writable:true,value:x.name})}catch(e){x.b.__v130AiName=x.name}}}}
function install(){if(installed||!window.Bot)return installed;if(!window.BomberPolish156)return false;installed=true;var old=Bot.prototype.die;Bot.prototype.die=function(){if(!this.simulatedHuman)return old.apply(this,arguments);var restore=lockNames();try{return old.apply(this,arguments)}finally{restore()}};window.BomberKillNames156={version:'v0.15.6',sync:function(){var restore=lockNames();restore()}};return true}
var tries=0,t=setInterval(function(){if(install()||++tries>1200)clearInterval(t)},25);setInterval(function(){if(window.BomberKillNames156)BomberKillNames156.sync()},120);
})();
