(function(){
'use strict';
var VERSION='v0.12.2';
var STORAGE='BombermanCharacterV1';
var APPEAR_PREFIX='\u2063BMCHAR:';
var patched=false;
var cachedSheets={};
var remoteAppearance=null;
var dataMatchWasActive=false;
var syncSerial=0;

var SKINS=[
  {id:'light',label:'Light',color:'#f3cfb4'},
  {id:'fair',label:'Fair',color:'#deb08a'},
  {id:'medium',label:'Medium',color:'#bd7f58'},
  {id:'tan',label:'Tan',color:'#965c40'},
  {id:'deep',label:'Deep',color:'#654033'}
];
var SHOE_COLORS={original:null,black:'#25242a',white:'#ececf0',red:'#b93645',blue:'#345b9b'};

function $(id){return document.getElementById(id)}
function cleanName(v){v=String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return(v||'Player').slice(0,14)}
function savedName(){try{return cleanName(localStorage.getItem('BombermanPlayerName')||'Player')}catch(e){return'Player'}}
function clone(o){return JSON.parse(JSON.stringify(o))}
function defaultAppearance(){return{gender:'male',skin:'fair',glasses:false,hat:'none',shoes:'original'}}
function normalizeAppearance(a){
  a=a||{};var skinOk=false;for(var i=0;i<SKINS.length;i++)if(SKINS[i].id===a.skin)skinOk=true;
  return{gender:a.gender==='female'?'female':'male',skin:skinOk?a.skin:'fair',glasses:!!a.glasses,hat:(a.hat==='cap'||a.hat==='beanie')?a.hat:'none',shoes:SHOE_COLORS.hasOwnProperty(a.shoes)?a.shoes:'original'};
}
function loadAppearance(){try{var v=localStorage.getItem(STORAGE);return v?normalizeAppearance(JSON.parse(v)):defaultAppearance()}catch(e){return defaultAppearance()}}
function saveAppearance(a){a=normalizeAppearance(a);try{localStorage.setItem(STORAGE,JSON.stringify(a))}catch(e){}return a}
function randomAppearance(){
  return normalizeAppearance({
    gender:Math.random()<.5?'male':'female',
    skin:SKINS[Math.floor(Math.random()*SKINS.length)].id,
    glasses:Math.random()<.36,
    hat:(function(){var r=Math.random();return r<.52?'none':(r<.78?'cap':'beanie')})(),
    shoes:['original','black','white','red','blue'][Math.floor(Math.random()*5)]
  });
}
function skinHex(id){for(var i=0;i<SKINS.length;i++)if(SKINS[i].id===id)return SKINS[i].color;return SKINS[1].color}
function hexRgb(h){h=String(h||'#ffffff').replace('#','');return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}}
function baseImage(a){if(!window.gGameEngine)return null;return a.gender==='female'?(gGameEngine.playerGirl2Img||gGameEngine.playerGirlImg||gGameEngine.playerBoyImg):gGameEngine.playerBoyImg}
function cacheKey(a){return[a.gender,a.skin,a.glasses?1:0,a.hat,a.shoes].join('|')}

function recolorSkin(ctx,w,h,tone){
  try{
    var img=ctx.getImageData(0,0,w,h),d=img.data,t=hexRgb(tone);
    for(var i=0;i<d.length;i+=4){
      var r=d[i],g=d[i+1],b=d[i+2],alpha=d[i+3];if(!alpha)continue;
      var warm=r>=165&&g>=100&&b>=70&&r>g+28&&g>b+15;
      if(!warm)continue;
      var lum=(r+g+b)/765;
      var shade=.58+lum*.78;
      d[i]=Math.min(255,Math.round(t.r*shade));
      d[i+1]=Math.min(255,Math.round(t.g*shade));
      d[i+2]=Math.min(255,Math.round(t.b*shade));
    }
    ctx.putImageData(img,0,0);
  }catch(e){}
}
function pixelRect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function frameDirection(frame){if(frame<=3)return'down';if(frame<=7)return'left';if(frame<=11)return'up';if(frame<=15)return'right';return'dead'}
function drawHat(ctx,ox,oy,frame,type){
  if(type==='none'||frame===16)return;var dir=frameDirection(frame),bob=(frame%4===1||frame%4===3)?1:0;
  if(type==='cap'){
    var c='#41688f',dark='#294158';
    pixelRect(ctx,ox+14,oy+5+bob,20,5,c);pixelRect(ctx,ox+11,oy+9+bob,25,5,c);pixelRect(ctx,ox+13,oy+13+bob,21,2,dark);
    if(dir==='down')pixelRect(ctx,ox+30,oy+12+bob,8,3,c);
    else if(dir==='left')pixelRect(ctx,ox+8,oy+11+bob,8,3,c);
    else if(dir==='right')pixelRect(ctx,ox+32,oy+11+bob,8,3,c);
  }else if(type==='beanie'){
    var c2='#8d4058',dark2='#5d2839';
    pixelRect(ctx,ox+15,oy+4+bob,18,3,c2);pixelRect(ctx,ox+12,oy+7+bob,24,8,c2);pixelRect(ctx,ox+11,oy+13+bob,26,3,dark2);pixelRect(ctx,ox+21,oy+1+bob,6,5,c2);
  }
}
function drawGlasses(ctx,ox,oy,frame){
  if(frame===16)return;var dir=frameDirection(frame),bob=(frame%4===1||frame%4===3)?1:0,c='#17191f',shine='#6d91a5';
  if(dir==='down'){
    pixelRect(ctx,ox+13,oy+16+bob,9,4,c);pixelRect(ctx,ox+27,oy+16+bob,9,4,c);pixelRect(ctx,ox+22,oy+17+bob,5,2,c);pixelRect(ctx,ox+15,oy+16+bob,4,1,shine);pixelRect(ctx,ox+29,oy+16+bob,4,1,shine);
  }else if(dir==='left'){
    pixelRect(ctx,ox+11,oy+16+bob,15,4,c);pixelRect(ctx,ox+10,oy+17+bob,3,2,c);pixelRect(ctx,ox+13,oy+16+bob,5,1,shine);
  }else if(dir==='right'){
    pixelRect(ctx,ox+22,oy+16+bob,15,4,c);pixelRect(ctx,ox+35,oy+17+bob,3,2,c);pixelRect(ctx,ox+29,oy+16+bob,5,1,shine);
  }else if(dir==='up'){
    pixelRect(ctx,ox+14,oy+16+bob,20,2,c);
  }
}
function drawShoes(ctx,ox,oy,frame,color){
  if(!color||frame===16)return;var step=frame%4,dir=frameDirection(frame),dy=(step===1||step===3)?-1:0;
  if(dir==='left'||dir==='right'){
    var shift=dir==='left'?-2:2;pixelRect(ctx,ox+14+shift,oy+39+dy,8,4,color);pixelRect(ctx,ox+25+shift,oy+39-dy,8,4,color);
  }else{
    pixelRect(ctx,ox+13,oy+39+dy,8,4,color);pixelRect(ctx,ox+28,oy+39-dy,8,4,color);
  }
  pixelRect(ctx,ox+13,oy+42+dy,8,1,'rgba(0,0,0,.45)');pixelRect(ctx,ox+28,oy+42-dy,8,1,'rgba(0,0,0,.45)');
}
function makeCharacterSheet(a){
  a=normalizeAppearance(a);var key=cacheKey(a),cached=cachedSheets[key];if(cached)return cached;
  var base=baseImage(a);if(!base)return null;
  var c=document.createElement('canvas');c.width=base.width||816;c.height=base.height||48;var ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
  recolorSkin(ctx,c.width,c.height,skinHex(a.skin));
  var cols=Math.max(1,Math.floor(c.width/48)),rows=Math.max(1,Math.floor(c.height/48)),frames=Math.min(17,cols*rows),shoe=SHOE_COLORS[a.shoes];
  for(var f=0;f<frames;f++){
    var ox=(f%cols)*48,oy=Math.floor(f/cols)*48;
    if(shoe)drawShoes(ctx,ox,oy,f,shoe);
    if(a.glasses)drawGlasses(ctx,ox,oy,f);
    drawHat(ctx,ox,oy,f,a.hat);
  }
  cachedSheets[key]=c;return c;
}
function makeSpriteSheet(a){var c=makeCharacterSheet(a);if(!c)return null;return new createjs.SpriteSheet({images:[c],frames:{width:48,height:48,regX:10,regY:12},animations:{idle:[0,0,'idle'],down:[0,3,'down',.1],left:[4,7,'left',.1],up:[8,11,'up',.1],right:[12,15,'right',.1],dead:[16,16,'dead',.1]}})}
function applyAppearanceToEntity(e,a){
  if(!e||!e.bmp)return;a=normalizeAppearance(a);var key=cacheKey(a);if(e.__v0122AppearanceKey===key)return;var ss=makeSpriteSheet(a);if(!ss)return;
  var anim=e.bmp.currentAnimation||'idle';e.bmp.spriteSheet=ss;e.characterAppearance=clone(a);e.__v0122AppearanceKey=key;try{e.bmp.gotoAndPlay(anim)}catch(x){try{e.bmp.gotoAndPlay('idle')}catch(y){}}
}
function localSlot(){return window.gGameEngine&&gGameEngine.onlineNetworkMode&&gGameEngine.networkRole==='guest'?1:0}
function appearanceForEntity(e){
  if(!e)return null;
  if(e.simulatedHuman)return gGameEngine.simulatedAppearance||randomAppearance();
  if(e.isBot)return null;
  var slot=Number(e.statSlot!=null?e.statSlot:e.id)||0;
  if(gGameEngine.onlineNetworkMode){return slot===localSlot()?loadAppearance():(remoteAppearance||defaultAppearance())}
  if(slot===0)return loadAppearance();
  return defaultAppearance();
}
function updateLocalIdentity(e){
  if(!e||e.isBot)return;var slot=Number(e.statSlot!=null?e.statSlot:e.id)||0;
  if(!gGameEngine.onlineNetworkMode&&slot===0){e.displayName=savedName();if(e.nameLabel)e.nameLabel.text=e.displayName}
}
function applyRemoteNow(){
  if(!remoteAppearance||!window.gGameEngine)return;var slot=gGameEngine.networkRole==='guest'?0:1,e=null;
  if(gGameEngine.getContestantForNetworkSlot)e=gGameEngine.getContestantForNetworkSlot(slot);else if(gGameEngine.players)e=gGameEngine.players[slot];
  if(e)applyAppearanceToEntity(e,remoteAppearance);
}

function addCharacterPanel(){
  if($('characterPanel'))return;
  var wrap=document.createElement('div');wrap.id='characterPanel';wrap.className='character_panel';wrap.hidden=true;
  wrap.innerHTML='<div class="character_card"><div class="character_head"><div><h2>Character</h2><p>Customize your player and username.</p></div><button id="characterClose" type="button" aria-label="Close">×</button></div><div class="character_preview_wrap"><canvas id="characterPreview" width="96" height="96"></canvas><span id="characterPreviewName"></span></div><label class="character_label" for="characterName">Username</label><input id="characterName" class="character_name" type="text" maxlength="14" autocomplete="nickname" spellcheck="false"><div class="character_group"><strong>Gender</strong><div class="character_choices two"><button type="button" data-char-gender="male">Male</button><button type="button" data-char-gender="female">Female</button></div></div><div class="character_group"><strong>Skin tone</strong><div id="characterSkinChoices" class="skin_choices"></div></div><div class="character_group"><strong>Accessories</strong><div class="character_row"><span>Sunglasses</span><label class="character_toggle"><input id="characterGlasses" type="checkbox"><span></span></label></div><div class="character_subgroup"><span>Hat</span><div class="character_choices three"><button type="button" data-char-hat="none">None</button><button type="button" data-char-hat="cap">Cap</button><button type="button" data-char-hat="beanie">Beanie</button></div></div><div class="character_subgroup"><span>Shoes</span><div class="character_choices five"><button type="button" data-char-shoes="original">Original</button><button type="button" data-char-shoes="black">Black</button><button type="button" data-char-shoes="white">White</button><button type="button" data-char-shoes="red">Red</button><button type="button" data-char-shoes="blue">Blue</button></div></div></div><div id="characterStatus" class="character_status"></div><div class="character_actions"><button id="characterRandom" class="character_secondary" type="button">Randomize</button><button id="characterSave" class="character_primary" type="button">Save</button></div></div>';
  document.body.appendChild(wrap);
  var skins=$('characterSkinChoices');SKINS.forEach(function(s){var b=document.createElement('button');b.type='button';b.className='skin_swatch';b.setAttribute('data-char-skin',s.id);b.setAttribute('aria-label',s.label+' skin tone');b.title=s.label;b.style.background=s.color;skins.appendChild(b)});
  if(!$('v0122-style')){var st=document.createElement('style');st.id='v0122-style';st.textContent='.character_panel{position:fixed;inset:0;z-index:8200;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(10,6,9,.72);backdrop-filter:blur(4px)}.character_panel[hidden]{display:none!important}.character_card{width:min(430px,94vw);max-height:min(650px,94vh);overflow:auto;box-sizing:border-box;padding:16px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:#21111a;color:#fff;box-shadow:0 22px 70px rgba(0,0,0,.55);font-family:Helvetica,Arial,sans-serif}.character_head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.character_head h2{margin:0;font-size:22px}.character_head p{margin:4px 0 0;color:#aaa;font-size:12px}.character_head>button{border:0;background:transparent;color:#fff;font-size:26px;line-height:1}.character_preview_wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:8px 0 12px}.character_preview_wrap canvas{width:96px;height:96px;image-rendering:pixelated;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(0,0,0,.22)}.character_preview_wrap span{margin-top:5px;font-size:12px;font-weight:800;color:#99cc00}.character_label,.character_group>strong{display:block;margin:9px 0 6px;font-size:12px}.character_name{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:rgba(255,255,255,.07);color:#fff;padding:9px 10px;font-size:16px;outline:none}.character_choices{display:grid;gap:7px}.character_choices.two{grid-template-columns:repeat(2,1fr)}.character_choices.three{grid-template-columns:repeat(3,1fr)}.character_choices.five{grid-template-columns:repeat(5,1fr)}.character_choices button,.character_secondary,.character_primary{border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.055);color:#fff;padding:8px 7px;font-weight:700}.character_choices button.active{background:#99cc00;color:#162000;border-color:#99cc00}.skin_choices{display:flex;gap:10px;flex-wrap:wrap}.skin_swatch{width:35px;height:35px;border-radius:50%;border:3px solid transparent;box-shadow:0 0 0 1px rgba(255,255,255,.17)}.skin_swatch.active{border-color:#99cc00;box-shadow:0 0 0 2px #243200}.character_group{margin-top:9px}.character_row,.character_subgroup{margin-top:8px;padding:9px 10px;border-radius:9px;background:rgba(255,255,255,.035)}.character_row{display:flex;align-items:center;justify-content:space-between}.character_subgroup>span{display:block;margin-bottom:7px;font-size:11px;color:#bbb}.character_toggle input{position:absolute;opacity:0}.character_toggle span{display:block;width:42px;height:23px;border-radius:14px;background:#4a3b43;position:relative}.character_toggle span:after{content:"";position:absolute;left:3px;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:.14s}.character_toggle input:checked+span{background:#99cc00}.character_toggle input:checked+span:after{left:22px}.character_status{min-height:16px;margin-top:7px;font-size:11px;color:#ff8b8b}.character_actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:9px}.character_primary{background:#99cc00;color:#162000;border-color:#99cc00}.character_secondary{background:#3b2933}@media(max-width:560px){.character_card{padding:13px}.character_choices.five{grid-template-columns:repeat(3,1fr)}.character_panel{align-items:flex-start;padding-top:max(12px,env(safe-area-inset-top))}}';document.head.appendChild(st)}
  wireCharacterPanel();
}
var editingAppearance=null;
function updateChoiceStates(){
  if(!editingAppearance)return;
  document.querySelectorAll('[data-char-gender]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-gender')===editingAppearance.gender)});
  document.querySelectorAll('[data-char-hat]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-hat')===editingAppearance.hat)});
  document.querySelectorAll('[data-char-shoes]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-shoes')===editingAppearance.shoes)});
  document.querySelectorAll('[data-char-skin]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-skin')===editingAppearance.skin)});
  var g=$('characterGlasses');if(g)g.checked=!!editingAppearance.glasses;
}
function renderPreview(){
  if(!editingAppearance)return;var c=$('characterPreview');if(!c)return;var ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,c.width,c.height);var sheet=makeCharacterSheet(editingAppearance);if(sheet)ctx.drawImage(sheet,0,0,48,48,0,0,96,96);var n=$('characterPreviewName');if(n)n.textContent=cleanName((($('characterName')||{}).value)||savedName());updateChoiceStates();
}
function openCharacterPanel(){addCharacterPanel();editingAppearance=loadAppearance();var inp=$('characterName');if(inp)inp.value=savedName();var st=$('characterStatus');if(st)st.textContent='';$('characterPanel').hidden=false;renderPreview()}
function closeCharacterPanel(){var p=$('characterPanel');if(p)p.hidden=true;editingAppearance=null}
function wireCharacterPanel(){
  var close=$('characterClose'),save=$('characterSave'),rand=$('characterRandom'),name=$('characterName'),glasses=$('characterGlasses');
  if(close)close.onclick=closeCharacterPanel;
  document.querySelectorAll('[data-char-gender]').forEach(function(b){b.onclick=function(){editingAppearance.gender=this.getAttribute('data-char-gender');cachedSheets={};renderPreview()}});
  document.querySelectorAll('[data-char-hat]').forEach(function(b){b.onclick=function(){editingAppearance.hat=this.getAttribute('data-char-hat');cachedSheets={};renderPreview()}});
  document.querySelectorAll('[data-char-shoes]').forEach(function(b){b.onclick=function(){editingAppearance.shoes=this.getAttribute('data-char-shoes');cachedSheets={};renderPreview()}});
  document.querySelectorAll('[data-char-skin]').forEach(function(b){b.onclick=function(){editingAppearance.skin=this.getAttribute('data-char-skin');cachedSheets={};renderPreview()}});
  if(glasses)glasses.onchange=function(){editingAppearance.glasses=!!this.checked;cachedSheets={};renderPreview()};
  if(name)name.oninput=renderPreview;
  if(rand)rand.onclick=function(){editingAppearance=randomAppearance();cachedSheets={};renderPreview()};
  if(save)save.onclick=function(){
    var raw=String(name&&name.value||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();if(!raw){$('characterStatus').textContent='Enter a username.';return}
    var nm=cleanName(raw);try{localStorage.setItem('BombermanPlayerName',nm)}catch(e){}saveAppearance(editingAppearance);cachedSheets={};
    if(window.B115){B115.localName=nm;if(B115.els&&B115.els.name)B115.els.name.value=nm}
    if(window.gGameEngine){if(!gGameEngine.playerNames)gGameEngine.playerNames=[];gGameEngine.playerNames[0]=nm}
    closeCharacterPanel();if(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible){gGameEngine.menu.hide();gGameEngine.menu.show()}
  };
}

function patchMenu(){
  if(!window.Menu||Menu.prototype.__v0122Character)return;Menu.prototype.__v0122Character=true;var oldDraw=Menu.prototype.draw;
  Menu.prototype.draw=function(text){
    var r=oldDraw.apply(this,arguments),w=gGameEngine.size.w,modeSize=110,modesDistance=20,modesY=188;
    var singleX=w/2-modeSize-modesDistance,multiX=w/2+modesDistance;
    for(var i=0;i<this.views.length;i++){
      var v=this.views[i];if(!v||typeof v.x!=='number'||typeof v.y!=='number'||v.y<modesY-8||v.y>modesY+modeSize+15)continue;
      if(v.x>=singleX-15&&v.x<w/2)v.x-=50;else if(v.x>=multiX-15)v.x+=50;
    }
    var x=w/2-modeSize/2,card=new createjs.Container();card.x=x;card.y=modesY;var bg=new createjs.Shape(new createjs.Graphics().beginFill('rgba(0,0,0,.5)').drawRect(0,0,modeSize,modeSize));card.addChild(bg);
    var sheet=makeCharacterSheet(loadAppearance());if(sheet){var icon=new createjs.Bitmap(sheet);icon.sourceRect=new createjs.Rectangle(0,0,48,48);icon.x=(modeSize-48)/2;icon.y=12;card.addChild(icon)}
    var t=new createjs.Text('character','15px Helvetica','#74b9ff');t.x=(modeSize-t.getMeasuredWidth())/2;t.y=72;card.addChild(t);
    var nm=new createjs.Text(savedName(),'bold 9px Helvetica','#ffffff');nm.textAlign='center';nm.maxWidth=98;nm.x=modeSize/2;nm.y=92;card.addChild(nm);gGameEngine.stage.addChild(card);this.views.push(card);this.setHandCursor(card);card.addEventListener('click',openCharacterPanel);
    return r;
  };
}
function patchPlayers(){
  if(!window.Player||Player.prototype.__v0122Character)return;Player.prototype.__v0122Character=true;var oldInit=Player.prototype.init;
  Player.prototype.init=function(){var r=oldInit.apply(this,arguments);var a=appearanceForEntity(this);if(a)applyAppearanceToEntity(this,a);updateLocalIdentity(this);return r};
}
function patchSimulated(){
  var S=window.B115;if(!S||!S.startSimulated||S.__v0122Character)return;S.__v0122Character=true;var old=S.startSimulated;
  S.startSimulated=function(){remoteAppearance=randomAppearance();if(window.gGameEngine)gGameEngine.simulatedAppearance=clone(remoteAppearance);var r=old.apply(S,arguments);setTimeout(function(){if(window.gGameEngine&&gGameEngine.simulatedOpponent)applyAppearanceToEntity(gGameEngine.simulatedOpponent,remoteAppearance)},50);return r};
  var oldAppend=S.appendChat;if(oldAppend)S.appendChat=function(name,text,self,system){
    var raw=String(text||'');if(!self&&raw.indexOf(APPEAR_PREFIX)===0){try{remoteAppearance=normalizeAppearance(JSON.parse(decodeURIComponent(raw.slice(APPEAR_PREFIX.length))));applyRemoteNow()}catch(e){}return}
    return oldAppend.apply(S,arguments);
  };
}
function sendAppearance(){
  if(!window.BomberOnline||!BomberOnline.broadcast||!BomberOnline.isDataMatch||!BomberOnline.isDataMatch())return;var payload=APPEAR_PREFIX+encodeURIComponent(JSON.stringify(loadAppearance()));BomberOnline.broadcast({type:'chat',text:payload})
}
function syncTick(){
  var active=!!(window.BomberOnline&&BomberOnline.isDataMatch&&BomberOnline.isDataMatch());
  if(active&&!dataMatchWasActive){remoteAppearance=null;syncSerial++;var s=syncSerial;setTimeout(function(){if(s===syncSerial)sendAppearance()},120);setTimeout(function(){if(s===syncSerial)sendAppearance()},650)}
  if(!active&&dataMatchWasActive){remoteAppearance=null;syncSerial++}
  dataMatchWasActive=active;if(active&&remoteAppearance)applyRemoteNow();
}
function setVersion(){var v=$('buildVersion119')||$('buildVersion120')||$('buildVersion121')||$('buildVersion122')||$('buildVersion');if(!v){v=document.createElement('div');v.id='buildVersion122';document.body.appendChild(v)}if(v.textContent!==VERSION)v.textContent=VERSION}
function expose(){window.BomberCharacter={get:loadAppearance,save:saveAppearance,random:randomAppearance,open:openCharacterPanel,makeSheet:makeCharacterSheet,getRemote:function(){return remoteAppearance}}}
function patch(){
  if(patched)return true;if(!window.gGameEngine||!window.Menu||!window.Player||!window.B115||!window.BomberOnline)return false;
  addCharacterPanel();patchPlayers();patchMenu();patchSimulated();expose();patched=true;setVersion();return true;
}
setVersion();var tries=0,t=setInterval(function(){setVersion();if(patch()||++tries>350)clearInterval(t)},40);setInterval(function(){setVersion();syncTick()},150);
})();
