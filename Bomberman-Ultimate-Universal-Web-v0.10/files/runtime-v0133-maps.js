(function(){
'use strict';
var VERSION='v0.13.3',S=window.B115,installed=false,wireInstalled=false,bypass=false;
var SINGLE_KEY='BombermanSingleMapV133',MULTI_KEY='BombermanMultiMapV133';
var activeMap='classic',remoteActive=null,remoteSelection=null,lastShuffle={single:null,multi:null};
var MAPS=[
 {id:'classic',label:'Classic Grid',desc:'The original balanced Bomberman layout.'},
 {id:'crossroads',label:'Crossroads',desc:'Open center lanes create earlier fights and long blast lines.'},
 {id:'fourforts',label:'Four Forts',desc:'Protected quadrants open into a large central fighting area.'},
 {id:'longlanes',label:'Long Lanes',desc:'Long horizontal and vertical corridors reward range and trapping.'},
 {id:'openarena',label:'Open Arena',desc:'Fewer permanent blocks and less wood make for fast aggressive rounds.'},
 {id:'densemaze',label:'Dense Maze',desc:'Extra hard cover creates tight routes and careful positional fights.'},
 {id:'ring',label:'The Ring',desc:'A gated inner ring creates rotation battles and central control.'},
 {id:'hourglass',label:'Hourglass',desc:'The arena narrows toward the middle before opening again.'},
 {id:'checkerplus',label:'Checkerboard+',desc:'A remixed checker pattern keeps the classic feel with unfamiliar routes.'},
 {id:'fortress',label:'Central Fortress',desc:'A fortified center offers shortcuts, cover, and dangerous entrances.'},
 {id:'zigzag',label:'Zigzag',desc:'Alternating hard-wall ribs create winding pursuit routes.'},
 {id:'splitcenter',label:'Split Center',desc:'A central divider forces players to commit to a few crossing points.'}
];
var IDS=MAPS.map(function(m){return m.id}),CHOICES=IDS.concat(['shuffle']);
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function valid(v){return CHOICES.indexOf(String(v||''))>=0?String(v):'classic'}
function read(key){try{return valid(localStorage.getItem(key)||'classic')}catch(e){return'classic'}}
function write(key,v){v=valid(v);try{localStorage.setItem(key,v)}catch(e){}return v}
function getSelection(ctx){return ctx==='multi'?read(MULTI_KEY):read(SINGLE_KEY)}
function setSelection(ctx,v,remote){v=write(ctx==='multi'?MULTI_KEY:SINGLE_KEY,v);if(ctx==='multi'&&!remote){remoteSelection=null;if(S&&S.role==='host'&&S.conn&&S.conn.open)try{S.send({type:'v133Map',selection:v,active:null})}catch(e){}}syncUI();return v}
function mapInfo(id){for(var i=0;i<MAPS.length;i++)if(MAPS[i].id===id)return MAPS[i];return MAPS[0]}
function mapLabel(id){return id==='shuffle'?'Random Shuffle':mapInfo(id).label}
function safeCorner(x,y,g){return(y<=2&&x<=2)||(y>=g.tilesY-3&&x>=g.tilesX-3)||(y<=2&&x>=g.tilesX-3)||(y>=g.tilesY-3&&x<=2)}
function border(x,y,g){return x===0||y===0||x===g.tilesX-1||y===g.tilesY-1}
function material(id,x,y,g){
 id=IDS.indexOf(id)>=0?id:'classic';if(border(x,y,g))return'wall';var safe=safeCorner(x,y,g),wall=false,wood=!safe;
 if(id==='classic'){wall=(x%2===0&&y%2===0)}
 else if(id==='crossroads'){wall=(x%2===0&&y%2===0&&x!==8&&y!==6);wood=!safe&&x!==8&&y!==6}
 else if(id==='fourforts'){
  wall=(x%2===0&&y%2===0);if(x>=6&&x<=10&&y>=4&&y<=8)wall=false;
  if((([5,11].indexOf(x)>=0)&&[3,5,7,9].indexOf(y)>=0)||(([4,8].indexOf(y)>=0)&&[3,5,11,13].indexOf(x)>=0))wall=true;
  wood=!safe&&!(x>=6&&x<=10&&y>=4&&y<=8)
 }
 else if(id==='longlanes'){wall=(x%2===0&&y%2===0&&[4,8].indexOf(y)<0&&x!==8);wood=!safe&&[4,8].indexOf(y)<0&&x!==8}
 else if(id==='openarena'){wall=(x%4===0&&y%4===0);wood=!safe&&((x*7+y*11)%5<=1)}
 else if(id==='densemaze'){wall=(x%2===0&&y%2===0)||(x%2===1&&y%2===1&&(x+2*y)%7===0&&!safe)}
 else if(id==='ring'){
  wall=(x%2===0&&y%2===0);if(x>=4&&x<=12&&y>=2&&y<=10)wall=false;
  if(([5,11].indexOf(x)>=0&&y>=3&&y<=9)||([3,9].indexOf(y)>=0&&x>=5&&x<=11))wall=true;
  if((x===8&&(y===3||y===9))||(y===6&&(x===5||x===11)))wall=false;
  wood=!safe&&!(x>=6&&x<=10&&y>=4&&y<=8)
 }
 else if(id==='hourglass'){
  wall=(x%2===0&&y%2===0);for(var hy=2;hy<=10;hy++){var left=3+Math.floor(Math.abs(6-hy)/2),right=13-Math.floor(Math.abs(6-hy)/2);if((x===left||x===right)&&y===hy&&[5,6,7].indexOf(y)<0)wall=true}
 }
 else if(id==='checkerplus'){wall=((x+y)%4===0&&x%2===0)||((x*y)%12===0&&y%2===0)}
 else if(id==='fortress'){
  wall=(x%2===0&&y%2===0);if(x>=5&&x<=11&&y>=2&&y<=10)wall=false;
  if(([6,10].indexOf(x)>=0&&y>=3&&y<=9)||([3,9].indexOf(y)>=0&&x>=6&&x<=10))wall=true;
  if((x===8&&(y===3||y===9))||(y===6&&(x===6||x===10)))wall=false;
  wood=!safe&&!(x>=7&&x<=9&&y>=4&&y<=8)
 }
 else if(id==='zigzag'){
  wall=(x%2===0&&y%2===0);if(x>=3&&x<=13&&y>=2&&y<=10)wall=false;
  if(y===3&&x>=3&&x<=13&&[5,12].indexOf(x)<0)wall=true;
  if(y===5&&x>=3&&x<=13&&[4,11].indexOf(x)<0)wall=true;
  if(y===7&&x>=3&&x<=13&&[6,13].indexOf(x)<0)wall=true;
  if(y===9&&x>=3&&x<=13&&[3,10].indexOf(x)<0)wall=true
 }
 else if(id==='splitcenter'){wall=(x%2===0&&y%2===0);if(x===8&&y>=2&&y<=10&&[3,6,9].indexOf(y)<0)wall=true;wood=!safe&&x!==8}
 if(safe)wall=false;if(wall)return'wall';return wood?'wood':'grass'
}
function context(){var g=G();if(!g||!g.playersCount)return'menu';if(S&&(S.role==='host'||S.role==='guest'||S.role==='simulated'))return'multi';return g.playersCount>=2?'multi':'single'}
function chooseShuffle(ctx){var pool=IDS.filter(function(id){return id!==lastShuffle[ctx]});var id=pool[Math.floor(Math.random()*pool.length)]||'classic';lastShuffle[ctx]=id;return id}
function chooseRoundMap(ctx){
 if(ctx==='menu')return'classic';if(ctx==='multi'&&S&&S.role==='guest'&&remoteActive&&IDS.indexOf(remoteActive)>=0){activeMap=remoteActive;return activeMap}
 var sel=ctx==='multi'?(remoteSelection||getSelection('multi')):getSelection('single');activeMap=sel==='shuffle'?chooseShuffle(ctx):sel;return activeMap
}
function drawCustom(g,id){
 for(var y=0;y<g.tilesY;y++)for(var x=0;x<g.tilesX;x++){
  var m=material(id,x,y,g);if(m==='wall'){var wall=new Tile('wall',{x:x,y:y});g.stage.addChild(wall.bmp);g.tiles.push(wall);continue}
  var grass=new Tile('grass',{x:x,y:y});g.stage.addChild(grass.bmp);if(m==='wood'){var wood=new Tile('wood',{x:x,y:y});g.stage.addChild(wood.bmp);g.tiles.push(wood)}
 }
}
function patchTiles(){if(!window.GameEngine||GameEngine.prototype.__v133Maps)return false;GameEngine.prototype.__v133Maps=true;var old=GameEngine.prototype.drawTiles;GameEngine.prototype.drawTiles=function(){var ctx=context(),id=chooseRoundMap(ctx);this.__v133Map=id;if(id==='classic')return old.apply(this,arguments);return drawCustom(this,id)};return true}
function optionHtml(){var h='<option value="shuffle">Random Shuffle — new map each round</option>';for(var i=0;i<MAPS.length;i++)h+='<option value="'+MAPS[i].id+'">'+MAPS[i].label+'</option>';return h}
function ensureStyle(){if($('v133Style'))return;var st=document.createElement('style');st.id='v133Style';st.textContent=`
#buildVersion132{display:none!important}#buildVersion133{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
#mainMapTile{position:fixed;z-index:6500;display:none;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:rgba(0,0,0,.56);color:#fff;font-family:Helvetica,Arial,sans-serif;cursor:pointer;padding:5px 7px;text-align:center}#mainMapTile strong{display:block;color:#74b9ff;font-size:11px}#mainMapTile small{display:block;margin-top:2px;font-size:8px;color:#dce7f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#mainMapTile:hover{background:rgba(0,0,0,.74)}
.v133_panel{position:fixed;inset:0;z-index:9300;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,5,8,.78);backdrop-filter:blur(4px)}.v133_panel[hidden]{display:none!important}.v133_card{width:min(480px,94vw);padding:16px;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:#21111a;color:#fff;font-family:Helvetica,Arial,sans-serif;box-shadow:0 22px 70px rgba(0,0,0,.55)}.v133_head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.v133_head h2{margin:0;font-size:21px}.v133_head p{margin:4px 0 0;color:#aaa;font-size:11px}.v133_close{border:0;background:transparent;color:#fff;font-size:25px}.v133_select{width:100%;margin-top:14px;box-sizing:border-box;padding:10px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:#301b27;color:#fff;font-weight:800}.v133_desc{min-height:34px;margin:8px 2px 2px;color:#c9c2c6;font-size:11px;line-height:1.4}.v133_shuffle_note{margin-top:8px;padding:8px;border-radius:7px;background:rgba(153,204,0,.08);color:#cfff91;font-size:10px}.v133_done{width:100%;margin-top:10px;padding:10px;border:1px solid #8fbd4a;border-radius:8px;background:#567b25;color:#fff;font-weight:900}
.v133_multi_maps{margin:10px 0;padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.035);color:#fff;font-family:Helvetica,Arial,sans-serif}.v133_multi_head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:7px}.v133_multi_head strong{font-size:13px}.v133_multi_head small{font-size:9px;color:rgba(255,255,255,.58)}.v133_multi_maps select{width:100%;box-sizing:border-box;padding:8px;border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#301b27;color:#fff;font-size:11px;font-weight:800}.v133_multi_maps p{margin:6px 0 0;color:rgba(255,255,255,.62);font-size:9px;line-height:1.3}
body.v127_lb_open #mainMapTile,body.v127_settings_open #mainMapTile{display:none!important}`;document.head.appendChild(st)}
function ensureSingleUI(){
 ensureStyle();var tile=$('mainMapTile');if(!tile){tile=document.createElement('button');tile.type='button';tile.id='mainMapTile';tile.innerHTML='<strong>Single Map</strong><small></small>';tile.onclick=openSinglePanel;document.body.appendChild(tile)}
 var panel=$('v133MapPanel');if(!panel){panel=document.createElement('div');panel.id='v133MapPanel';panel.className='v133_panel';panel.hidden=true;panel.innerHTML='<div class="v133_card"><div class="v133_head"><div><h2>Single Player Map</h2><p>Choose the arena used when you start Single Player.</p></div><button type="button" class="v133_close" aria-label="Close">×</button></div><select id="v133SingleSelect" class="v133_select">'+optionHtml()+'</select><div id="v133SingleDesc" class="v133_desc"></div><div class="v133_shuffle_note">Random Shuffle chooses a different map every round and avoids repeating the previous map.</div><button type="button" class="v133_done">Done</button></div>';document.body.appendChild(panel);panel.querySelector('.v133_close').onclick=closeSinglePanel;panel.querySelector('.v133_done').onclick=closeSinglePanel;var sel=$('v133SingleSelect');sel.onchange=function(){setSelection('single',this.value);updateSingleDesc()}}
 updateSingleDesc();return tile
}
function openSinglePanel(){ensureSingleUI();var p=$('v133MapPanel'),sel=$('v133SingleSelect');if(sel)sel.value=getSelection('single');updateSingleDesc();if(p)p.hidden=false;syncMainTile()}
function closeSinglePanel(){var p=$('v133MapPanel');if(p)p.hidden=true;syncMainTile()}
function updateSingleDesc(){var sel=$('v133SingleSelect'),d=$('v133SingleDesc');if(!sel||!d)return;var v=valid(sel.value);d.textContent=v==='shuffle'?'Every new round uses a different arena.':mapInfo(v).desc}
function syncMainTile(){
 var g=G(),tile=ensureSingleUI(),panel=$('v133MapPanel'),lb=$('v127LeaderboardPanel'),sp=$('v127SettingsPanel'),cp=$('characterPanel');if(!g||!g.menu||!tile)return;var show=!!(g.menu.visible&&!g.lobbyOpen&&(panel&&panel.hidden)&&(!lb||lb.hidden)&&(!sp||sp.hidden)&&(!cp||cp.hidden));tile.style.display=show?'block':'none';tile.querySelector('small').textContent=mapLabel(getSelection('single'));if(!show)return;var c=$('canvas'),r=c&&c.getBoundingClientRect();if(!r||!r.width)return;var scale=Math.max(.65,Math.min(1.2,r.width/(g.size&&g.size.w||544))),w=96*scale,h=52*scale;tile.style.width=w+'px';tile.style.height=h+'px';tile.style.left=(r.right-w-9*scale)+'px';tile.style.top=(r.bottom-h-7*scale)+'px'
}
function ensureMultiUI(){
 var lobby=$('multiplayerLobby'),card=lobby&&lobby.querySelector('.lobby_card');if(!card)return;var sec=$('v133MultiMaps');if(!sec){sec=document.createElement('div');sec.id='v133MultiMaps';sec.className='v133_multi_maps';sec.innerHTML='<div class="v133_multi_head"><strong>Map</strong><small>host choice</small></div><select id="v133MultiSelect">'+optionHtml()+'</select><p id="v133MultiNote"></p>';var anchor=$('v131RoundSets')||card.querySelector('#lobbyChoice,.lobby_choice');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(sec,anchor);else card.appendChild(sec);$('v133MultiSelect').onchange=function(){setSelection('multi',this.value,false)}}syncMultiUI()
}
function syncMultiUI(){var sel=$('v133MultiSelect'),note=$('v133MultiNote');if(!sel)return;var choice=(S&&S.role==='guest'&&remoteSelection)?remoteSelection:getSelection('multi');sel.value=valid(choice);sel.disabled=!!(S&&S.role==='guest');if(note)note.textContent=S&&S.role==='guest'?'The host controls the map for this match.':(sel.value==='shuffle'?'A different map will be chosen every round.':mapInfo(sel.value).desc)}
function syncVersion(){var v=$('buildVersion133');if(!v){v=document.createElement('div');v.id='buildVersion133';document.body.appendChild(v)}v.textContent=VERSION}
function patchWire(){
 if(wireInstalled||!S||!S.send||!S.guestData)return false;wireInstalled=true;var oldSend=S.send,oldGuest=S.guestData;
 S.send=function(d){if(d&&S.role==='host'&&(d.type==='start'||d.type==='v127RematchStart')){try{oldSend.call(S,{type:'v133Map',selection:getSelection('multi'),active:(G()&&G().__v133Map)||activeMap})}catch(e){}}return oldSend.apply(S,arguments)};
 S.guestData=function(d){if(d&&d.type==='v133Map'){remoteSelection=valid(d.selection||'classic');if(d.active&&IDS.indexOf(d.active)>=0)remoteActive=d.active;write(MULTI_KEY,remoteSelection);syncMultiUI();return}return oldGuest.apply(S,arguments)};return true
}
function signature(id){var g=G()||{tilesX:17,tilesY:13},s='';for(var y=0;y<g.tilesY;y++)for(var x=0;x<g.tilesX;x++)s+=material(id,x,y,g).charAt(0);return s}
function install(){if(installed)return true;if(!window.GameEngine||!window.Tile||!G()||!window.Menu)return false;ensureStyle();ensureSingleUI();ensureMultiUI();if(!patchTiles())return false;patchWire();installed=true;syncVersion();window.BomberMaps133={version:VERSION,maps:MAPS.slice(),choices:CHOICES.slice(),getSelection:getSelection,setSelection:setSelection,active:function(){return(G()&&G().__v133Map)||activeMap},material:function(id,x,y){return material(id,x,y,G()||{tilesX:17,tilesY:13})},signature:signature,mapLabel:mapLabel,openSinglePanel:openSinglePanel,closeSinglePanel:closeSinglePanel};if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberMaps133.debug={pickShuffle:function(ctx){return chooseShuffle(ctx==='multi'?'multi':'single')},setRemote:function(selection,active){remoteSelection=valid(selection);remoteActive=IDS.indexOf(active)>=0?active:null;syncMultiUI()}};return true}
ensureStyle();var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},40);setInterval(function(){if(installed){syncVersion();ensureSingleUI();ensureMultiUI();syncMainTile();syncMultiUI();patchWire()}},160);window.addEventListener('resize',syncMainTile,{passive:true});
})();
