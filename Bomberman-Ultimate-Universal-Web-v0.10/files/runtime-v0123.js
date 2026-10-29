(function(){
'use strict';
var VERSION='v0.12.3';
var CHAR_STORAGE='BombermanCharacterV1';
var RATING_STORAGE='BombermanRatingV1';
var START_RATING=500;
var patched=false,cachedSheets={},remoteProfile=null,lastProfileSend=0;
var S=window.B115,Q=window.BomberQOL;
if(!S||!Q)return;

var SKINS=[
  {id:'light',label:'Light',color:'#f3cfb4'},
  {id:'fair',label:'Fair',color:'#deb08a'},
  {id:'medium',label:'Medium',color:'#bd7f58'},
  {id:'tan',label:'Tan',color:'#965c40'},
  {id:'deep',label:'Deep',color:'#654033'}
];
var SHOE_COLORS={original:null,black:'#25242a',white:'#ececf0',red:'#b93645',blue:'#345b9b'};

function $(id){return document.getElementById(id)}
function clone(o){return JSON.parse(JSON.stringify(o))}
function clampRating(v){v=Math.round(Number(v));if(!isFinite(v))v=START_RATING;return Math.max(0,Math.min(1000,v))}
function formatRating(v){v=clampRating(v);return v>=1000?'1000 MAX':String(v)}
function loadRating(){try{var raw=localStorage.getItem(RATING_STORAGE);return raw==null?START_RATING:clampRating(raw)}catch(e){return START_RATING}}
function saveRating(v){v=clampRating(v);try{localStorage.setItem(RATING_STORAGE,String(v))}catch(e){}return v}
function cleanName(v){v=String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return(v||'Player').slice(0,14)}
function savedName(){try{return cleanName(localStorage.getItem('BombermanPlayerName')||'Player')}catch(e){return'Player'}}
function defaultAppearance(){return{gender:'male',skin:'fair',glasses:false,hat:'none',shoes:'original'}}
function normalizeAppearance(a){
  a=a||{};var skinOk=false;for(var i=0;i<SKINS.length;i++)if(SKINS[i].id===a.skin)skinOk=true;
  return{gender:a.gender==='female'?'female':'male',skin:skinOk?a.skin:'fair',glasses:!!a.glasses,hat:(a.hat==='cap'||a.hat==='beanie')?a.hat:'none',shoes:Object.prototype.hasOwnProperty.call(SHOE_COLORS,a.shoes)?a.shoes:'original'};
}
function loadAppearance(){try{var v=localStorage.getItem(CHAR_STORAGE);return v?normalizeAppearance(JSON.parse(v)):defaultAppearance()}catch(e){return defaultAppearance()}}
function saveAppearance(a){a=normalizeAppearance(a);try{localStorage.setItem(CHAR_STORAGE,JSON.stringify(a))}catch(e){}return a}
function randomAppearance(){return normalizeAppearance({gender:Math.random()<.5?'male':'female',skin:SKINS[Math.floor(Math.random()*SKINS.length)].id,glasses:Math.random()<.36,hat:(function(){var r=Math.random();return r<.52?'none':(r<.78?'cap':'beanie')})(),shoes:['original','black','white','red','blue'][Math.floor(Math.random()*5)]})}
function randomSimRating(){
  var r=Math.random(),v;
  if(r<.18)v=400+Math.random()*150;
  else if(r<.58)v=550+Math.random()*200;
  else if(r<.88)v=750+Math.random()*150;
  else v=900+Math.random()*101;
  return clampRating(Math.round(v/10)*10)
}
function skillFromRating(r){return Math.max(.08,Math.min(1,(clampRating(r)-350)/650))}
function skillLabel(r){r=clampRating(r);if(r>=900)return'Elite';if(r>=800)return'Expert';if(r>=675)return'Strong';if(r>=525)return'Skilled';return'Competent'}

function skinHex(id){for(var i=0;i<SKINS.length;i++)if(SKINS[i].id===id)return SKINS[i].color;return SKINS[1].color}
function hexRgb(h){h=String(h||'#ffffff').replace('#','');return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}}
function baseImage(a){if(!window.gGameEngine)return null;return a.gender==='female'?(gGameEngine.playerGirl2Img||gGameEngine.playerGirlImg||gGameEngine.playerBoyImg):gGameEngine.playerBoyImg}
function cacheKey(a){return[a.gender,a.skin,a.glasses?1:0,a.hat,a.shoes].join('|')}
function recolorSkin(ctx,w,h,tone){try{var img=ctx.getImageData(0,0,w,h),d=img.data,t=hexRgb(tone);for(var i=0;i<d.length;i+=4){var r=d[i],g=d[i+1],b=d[i+2],alpha=d[i+3];if(!alpha)continue;var warm=r>=165&&g>=100&&b>=70&&r>g+28&&g>b+15;if(!warm)continue;var lum=(r+g+b)/765,shade=.58+lum*.78;d[i]=Math.min(255,Math.round(t.r*shade));d[i+1]=Math.min(255,Math.round(t.g*shade));d[i+2]=Math.min(255,Math.round(t.b*shade))}ctx.putImageData(img,0,0)}catch(e){}}
function pixelRect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function frameDirection(frame){if(frame<=3)return'down';if(frame<=7)return'left';if(frame<=11)return'up';if(frame<=15)return'right';return'dead'}
function drawHat(ctx,ox,oy,frame,type){
  if(type==='none'||frame===16)return;var dir=frameDirection(frame),bob=(frame%4===1||frame%4===3)?1:0;
  if(type==='cap'){var c='#41688f',dark='#294158';pixelRect(ctx,ox+14,oy+5+bob,20,5,c);pixelRect(ctx,ox+11,oy+9+bob,25,5,c);pixelRect(ctx,ox+13,oy+13+bob,21,2,dark);if(dir==='down')pixelRect(ctx,ox+30,oy+12+bob,8,3,c);else if(dir==='left')pixelRect(ctx,ox+8,oy+11+bob,8,3,c);else if(dir==='right')pixelRect(ctx,ox+32,oy+11+bob,8,3,c)}
  else if(type==='beanie'){var c2='#8d4058',dark2='#5d2839';pixelRect(ctx,ox+15,oy+4+bob,18,3,c2);pixelRect(ctx,ox+12,oy+7+bob,24,8,c2);pixelRect(ctx,ox+11,oy+13+bob,26,3,dark2);pixelRect(ctx,ox+21,oy+1+bob,6,5,c2)}
}
function drawGlasses(ctx,ox,oy,frame){
  if(frame===16)return;var dir=frameDirection(frame),bob=(frame%4===1||frame%4===3)?1:0,c='#17191f',shine='#6d91a5';
  if(dir==='down'){pixelRect(ctx,ox+13,oy+16+bob,9,4,c);pixelRect(ctx,ox+27,oy+16+bob,9,4,c);pixelRect(ctx,ox+22,oy+17+bob,5,2,c);pixelRect(ctx,ox+15,oy+16+bob,4,1,shine);pixelRect(ctx,ox+29,oy+16+bob,4,1,shine)}
  else if(dir==='left'){pixelRect(ctx,ox+11,oy+16+bob,15,4,c);pixelRect(ctx,ox+10,oy+17+bob,3,2,c);pixelRect(ctx,ox+13,oy+16+bob,5,1,shine)}
  else if(dir==='right'){pixelRect(ctx,ox+22,oy+16+bob,15,4,c);pixelRect(ctx,ox+35,oy+17+bob,3,2,c);pixelRect(ctx,ox+29,oy+16+bob,5,1,shine)}
  else if(dir==='up')pixelRect(ctx,ox+14,oy+16+bob,20,2,c)
}
function drawShoes(ctx,ox,oy,frame,color){if(!color||frame===16)return;var step=frame%4,dir=frameDirection(frame),dy=(step===1||step===3)?-1:0;if(dir==='left'||dir==='right'){var shift=dir==='left'?-2:2;pixelRect(ctx,ox+14+shift,oy+39+dy,8,4,color);pixelRect(ctx,ox+25+shift,oy+39-dy,8,4,color)}else{pixelRect(ctx,ox+13,oy+39+dy,8,4,color);pixelRect(ctx,ox+28,oy+39-dy,8,4,color)}pixelRect(ctx,ox+13,oy+42+dy,8,1,'rgba(0,0,0,.45)');pixelRect(ctx,ox+28,oy+42-dy,8,1,'rgba(0,0,0,.45)')}
function makeCharacterSheet(a){
  a=normalizeAppearance(a);var key=cacheKey(a),cached=cachedSheets[key];if(cached)return cached;var base=baseImage(a);if(!base)return null;
  var c=document.createElement('canvas');c.width=base.width||816;c.height=base.height||48;var ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);recolorSkin(ctx,c.width,c.height,skinHex(a.skin));
  var cols=Math.max(1,Math.floor(c.width/48)),rows=Math.max(1,Math.floor(c.height/48)),frames=Math.min(17,cols*rows),shoe=SHOE_COLORS[a.shoes];for(var f=0;f<frames;f++){var ox=(f%cols)*48,oy=Math.floor(f/cols)*48;if(shoe)drawShoes(ctx,ox,oy,f,shoe);if(a.glasses)drawGlasses(ctx,ox,oy,f);drawHat(ctx,ox,oy,f,a.hat)}cachedSheets[key]=c;return c
}
function makeSpriteSheet(a){var c=makeCharacterSheet(a);if(!c)return null;return new createjs.SpriteSheet({images:[c],frames:{width:48,height:48,regX:10,regY:12},animations:{idle:[0,0,'idle'],down:[0,3,'down',.1],left:[4,7,'left',.1],up:[8,11,'up',.1],right:[12,15,'right',.1],dead:[16,16,'dead',.1]}})}
function applyAppearanceToEntity(e,a){if(!e||!e.bmp)return;a=normalizeAppearance(a);var key=cacheKey(a);if(e.__v123AppearanceKey===key)return;var ss=makeSpriteSheet(a);if(!ss)return;var anim=e.bmp.currentAnimation||'idle';e.bmp.spriteSheet=ss;e.characterAppearance=clone(a);e.__v123AppearanceKey=key;try{e.bmp.gotoAndPlay(anim)}catch(x){try{e.bmp.gotoAndPlay('idle')}catch(y){}}}
function localPlayer(){var g=window.gGameEngine;if(!g||!g.players||!g.players.length)return null;return S.role==='guest'?(g.players[1]||null):(g.players[0]||null)}
function remotePlayer(){var g=window.gGameEngine;if(!g||!g.players||g.players.length<2)return null;return S.role==='guest'?(g.players[0]||null):(g.players[1]||null)}
function applyProfilesToEntities(){
  var g=window.gGameEngine;if(!g)return;var lp=localPlayer();if(lp){lp.rating=loadRating();applyAppearanceToEntity(lp,loadAppearance());if(!g.onlineNetworkMode&&g.players[0]===lp){lp.displayName=savedName();if(lp.nameLabel)lp.nameLabel.text=lp.displayName}}
  var rp=remotePlayer();if(rp&&remoteProfile){rp.rating=remoteProfile.rating;applyAppearanceToEntity(rp,remoteProfile.appearance)}
  var sim=g.simulatedOpponent;if(sim){var ranked=window.BomberLeaderboard127&&BomberLeaderboard127.profile(S.remoteName);sim.rating=ranked?ranked.score:clampRating(g.simulatedRating||S.simulatedRating||650);if(ranked)sim.leaderboardRank=ranked.displayRank;if(g.simulatedAppearance)applyAppearanceToEntity(sim,g.simulatedAppearance);applySimSkill(sim,sim.rating)}
}

function ensureStyle(){
  if($('v0123-style'))return;var st=document.createElement('style');st.id='v0123-style';st.textContent=`
#buildVersion,#buildVersion119,#buildVersion120,#buildVersion121,#buildVersion122{display:none!important}
#buildVersion123{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.62);color:rgba(255,255,255,.94);font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
.qol_stat_box[data-rating]:not([data-rating=""]) .qol_stat_name::after{content:" · " attr(data-rating);color:#b9ef8c;font-weight:800}
.character_panel{position:fixed;inset:0;z-index:8200;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(10,6,9,.72);backdrop-filter:blur(4px)}.character_panel[hidden]{display:none!important}.character_card{width:min(430px,94vw);max-height:min(650px,94vh);overflow:auto;box-sizing:border-box;padding:16px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:#21111a;color:#fff;box-shadow:0 22px 70px rgba(0,0,0,.55);font-family:Helvetica,Arial,sans-serif}.character_head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.character_head h2{margin:0;font-size:22px}.character_head p{margin:4px 0 0;color:#aaa;font-size:12px}.character_head>button{border:0;background:transparent;color:#fff;font-size:26px;line-height:1}.character_preview_wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:8px 0 12px}.character_preview_wrap canvas{width:96px;height:96px;image-rendering:pixelated;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(0,0,0,.22)}.character_preview_wrap span{margin-top:5px;font-size:12px;font-weight:800;color:#99cc00}.character_rating{margin-top:3px!important;color:#b9ef8c!important}.character_label,.character_group>strong{display:block;margin:9px 0 6px;font-size:12px}.character_name{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:rgba(255,255,255,.07);color:#fff;padding:9px 10px;font-size:16px;outline:none}.character_choices{display:grid;gap:7px}.character_choices.two{grid-template-columns:repeat(2,1fr)}.character_choices.three{grid-template-columns:repeat(3,1fr)}.character_choices.five{grid-template-columns:repeat(5,1fr)}.character_choices button,.character_secondary,.character_primary{border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.055);color:#fff;padding:8px 7px;font-weight:700}.character_choices button.active{background:#99cc00;color:#162000;border-color:#99cc00}.skin_choices{display:flex;gap:10px;flex-wrap:wrap}.skin_swatch{width:35px;height:35px;border-radius:50%;border:3px solid transparent;box-shadow:0 0 0 1px rgba(255,255,255,.17)}.skin_swatch.active{border-color:#99cc00;box-shadow:0 0 0 2px #243200}.character_group{margin-top:9px}.character_row,.character_subgroup{margin-top:8px;padding:9px 10px;border-radius:9px;background:rgba(255,255,255,.035)}.character_row{display:flex;align-items:center;justify-content:space-between}.character_subgroup>span{display:block;margin-bottom:7px;font-size:11px;color:#bbb}.character_toggle input{position:absolute;opacity:0}.character_toggle span{display:block;width:42px;height:23px;border-radius:14px;background:#4a3b43;position:relative}.character_toggle span:after{content:"";position:absolute;left:3px;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:.14s}.character_toggle input:checked+span{background:#99cc00}.character_toggle input:checked+span:after{left:22px}.character_status{min-height:16px;margin-top:7px;font-size:11px;color:#ff8b8b}.character_actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:9px}.character_primary{background:#99cc00;color:#162000;border-color:#99cc00}.character_secondary{background:#3b2933}@media(max-width:560px){.character_card{padding:13px}.character_choices.five{grid-template-columns:repeat(3,1fr)}.character_panel{align-items:flex-start;padding-top:max(12px,env(safe-area-inset-top))}}
`;document.head.appendChild(st)
}
function setVersion(){ensureStyle();var v=$('buildVersion123');if(!v){v=document.createElement('div');v.id='buildVersion123';v.setAttribute('aria-label','Game version');(document.body||document.documentElement).appendChild(v)}v.textContent=VERSION}

var editingAppearance=null;
function addCharacterPanel(){
  if($('characterPanel'))return;var wrap=document.createElement('div');wrap.id='characterPanel';wrap.className='character_panel';wrap.hidden=true;
  wrap.innerHTML='<div class="character_card"><div class="character_head"><div><h2>Character</h2><p>Customize your player and username.</p></div><button id="characterClose" type="button" aria-label="Close">×</button></div><div class="character_preview_wrap"><canvas id="characterPreview" width="96" height="96"></canvas><span id="characterPreviewName"></span><span id="characterPreviewRating" class="character_rating"></span></div><label class="character_label" for="characterName">Username</label><input id="characterName" class="character_name" type="text" maxlength="14" autocomplete="nickname" spellcheck="false"><div class="character_group"><strong>Gender</strong><div class="character_choices two"><button type="button" data-char-gender="male">Male</button><button type="button" data-char-gender="female">Female</button></div></div><div class="character_group"><strong>Skin tone</strong><div id="characterSkinChoices" class="skin_choices"></div></div><div class="character_group"><strong>Accessories</strong><div class="character_row"><span>Sunglasses</span><label class="character_toggle"><input id="characterGlasses" type="checkbox"><span></span></label></div><div class="character_subgroup"><span>Hat</span><div class="character_choices three"><button type="button" data-char-hat="none">None</button><button type="button" data-char-hat="cap">Cap</button><button type="button" data-char-hat="beanie">Beanie</button></div></div><div class="character_subgroup"><span>Shoes</span><div class="character_choices five"><button type="button" data-char-shoes="original">Original</button><button type="button" data-char-shoes="black">Black</button><button type="button" data-char-shoes="white">White</button><button type="button" data-char-shoes="red">Red</button><button type="button" data-char-shoes="blue">Blue</button></div></div></div><div id="characterStatus" class="character_status"></div><div class="character_actions"><button id="characterRandom" class="character_secondary" type="button">Randomize</button><button id="characterSave" class="character_primary" type="button">Save</button></div></div>';
  document.body.appendChild(wrap);var skins=$('characterSkinChoices');SKINS.forEach(function(s){var b=document.createElement('button');b.type='button';b.className='skin_swatch';b.setAttribute('data-char-skin',s.id);b.setAttribute('aria-label',s.label+' skin tone');b.title=s.label;b.style.background=s.color;skins.appendChild(b)});wireCharacterPanel()
}
function updateChoiceStates(){if(!editingAppearance)return;document.querySelectorAll('[data-char-gender]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-gender')===editingAppearance.gender)});document.querySelectorAll('[data-char-hat]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-hat')===editingAppearance.hat)});document.querySelectorAll('[data-char-shoes]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-shoes')===editingAppearance.shoes)});document.querySelectorAll('[data-char-skin]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-char-skin')===editingAppearance.skin)});var g=$('characterGlasses');if(g)g.checked=!!editingAppearance.glasses}
function renderPreview(){if(!editingAppearance)return;var c=$('characterPreview');if(!c)return;var ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,c.width,c.height);var sheet=makeCharacterSheet(editingAppearance);if(sheet)ctx.drawImage(sheet,0,0,48,48,0,0,96,96);var n=$('characterPreviewName');if(n)n.textContent=cleanName((($('characterName')||{}).value)||savedName());var rr=$('characterPreviewRating');if(rr)rr.textContent='Rating '+formatRating(loadRating());updateChoiceStates()}
function openCharacterPanel(){addCharacterPanel();editingAppearance=loadAppearance();var inp=$('characterName');if(inp)inp.value=savedName();var st=$('characterStatus');if(st)st.textContent='';$('characterPanel').hidden=false;renderPreview()}
function closeCharacterPanel(){var p=$('characterPanel');if(p)p.hidden=true;editingAppearance=null}
function wireCharacterPanel(){
  var close=$('characterClose'),save=$('characterSave'),rand=$('characterRandom'),name=$('characterName'),glasses=$('characterGlasses');if(close)close.onclick=closeCharacterPanel;
  document.querySelectorAll('[data-char-gender]').forEach(function(b){b.onclick=function(){editingAppearance.gender=this.getAttribute('data-char-gender');cachedSheets={};renderPreview()}});document.querySelectorAll('[data-char-hat]').forEach(function(b){b.onclick=function(){editingAppearance.hat=this.getAttribute('data-char-hat');cachedSheets={};renderPreview()}});document.querySelectorAll('[data-char-shoes]').forEach(function(b){b.onclick=function(){editingAppearance.shoes=this.getAttribute('data-char-shoes');cachedSheets={};renderPreview()}});document.querySelectorAll('[data-char-skin]').forEach(function(b){b.onclick=function(){editingAppearance.skin=this.getAttribute('data-char-skin');cachedSheets={};renderPreview()}});
  if(glasses)glasses.onchange=function(){editingAppearance.glasses=!!this.checked;cachedSheets={};renderPreview()};if(name)name.oninput=renderPreview;if(rand)rand.onclick=function(){editingAppearance=randomAppearance();cachedSheets={};renderPreview()};
  if(save)save.onclick=function(){var raw=String(name&&name.value||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();if(!raw){$('characterStatus').textContent='Enter a username.';return}var nm=cleanName(raw);try{localStorage.setItem('BombermanPlayerName',nm)}catch(e){}saveAppearance(editingAppearance);cachedSheets={};S.localName=nm;if(S.els&&S.els.name)S.els.name.value=nm;if(window.gGameEngine){if(!gGameEngine.playerNames)gGameEngine.playerNames=[];gGameEngine.playerNames[0]=nm}closeCharacterPanel();applyProfilesToEntities();sendProfile(true);if(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible){gGameEngine.menu.hide();gGameEngine.menu.show()}}
}

function patchMenu(){
  if(!window.Menu||Menu.prototype.__v123Character)return;Menu.prototype.__v123Character=true;var oldDraw=Menu.prototype.draw;
  Menu.prototype.draw=function(text){var r=oldDraw.apply(this,arguments),w=gGameEngine.size.w,modeSize=110,modesDistance=20,modesY=188;var singleX=w/2-modeSize-modesDistance,multiX=w/2+modesDistance;for(var i=0;i<this.views.length;i++){var v=this.views[i];if(!v||typeof v.x!=='number'||typeof v.y!=='number'||v.y<modesY-8||v.y>modesY+modeSize+15)continue;if(v.x>=singleX-15&&v.x<w/2)v.x-=50;else if(v.x>=multiX-15)v.x+=50}
    var x=w/2-modeSize/2,card=new createjs.Container();card.x=x;card.y=modesY;card.addChild(new createjs.Shape(new createjs.Graphics().beginFill('rgba(0,0,0,.5)').drawRect(0,0,modeSize,modeSize)));var sheet=makeCharacterSheet(loadAppearance());if(sheet){var icon=new createjs.Bitmap(sheet);icon.sourceRect=new createjs.Rectangle(0,0,48,48);icon.x=(modeSize-48)/2;icon.y=8;card.addChild(icon)}var t=new createjs.Text('character','15px Helvetica','#74b9ff');t.x=(modeSize-t.getMeasuredWidth())/2;t.y=61;card.addChild(t);var nm=new createjs.Text(savedName(),'bold 9px Helvetica','#ffffff');nm.textAlign='center';nm.maxWidth=98;nm.x=modeSize/2;nm.y=81;card.addChild(nm);var rt=new createjs.Text('rating '+formatRating(loadRating()),'bold 8px Helvetica','#b9ef8c');rt.textAlign='center';rt.x=modeSize/2;rt.y=95;card.addChild(rt);gGameEngine.stage.addChild(card);this.views.push(card);this.setHandCursor(card);card.addEventListener('click',openCharacterPanel);return r
  }
}
function patchPlayers(){if(!window.Player||Player.prototype.__v123Character)return;Player.prototype.__v123Character=true;var oldInit=Player.prototype.init;Player.prototype.init=function(){var r=oldInit.apply(this,arguments);setTimeout(applyProfilesToEntities,0);return r}}

function applySimSkill(bot,rating){
  if(!bot||!bot.simulatedHuman)return;rating=clampRating(rating);var skill=skillFromRating(rating);bot.rating=rating;bot.humanRating=rating;bot.humanSkill=skill;bot.skillTier=skillLabel(rating);bot.attackWeight=1.7+skill*4.3;bot.velocity=Math.max(Number(bot.velocity)||2,2+skill*.45)
}
function patchSimAI(){
  if(!window.Bot||Bot.prototype.__v123Skill)return;Bot.prototype.__v123Skill=true;
  var oldBest=Bot.prototype.getBestOpponent;Bot.prototype.getBestOpponent=function(){if(!this.simulatedHuman)return oldBest.apply(this,arguments);var all=gGameEngine.getPlayersAndBots(),skill=this.humanSkill||skillFromRating(this.rating),best=null,bestScore=Infinity;for(var i=0;i<all.length;i++){var c=all[i];if(!c||c===this||!c.alive)continue;var path=this.findPath(this.position,c.position,true),score=path?path.length:Math.abs(c.position.x-this.position.x)+Math.abs(c.position.y-this.position.y)+20;var exits=this.getWalkableNeighbors(c.position,true).length;if(!c.isBot)score-=1.5+skill*4.5;score-=Math.max(0,3-exits)*skill*3.8;if(!this.isSafe(c.position))score-=skill*3.5;if(this.targetInBlastLine(c))score-=1.5+skill*4;score+=Math.random()*(4.2-skill*3.4);if(score<bestScore){best=c;bestScore=score}}return best||oldBest.apply(this,arguments)};
  var oldScore=Bot.prototype.scoreBombPlacement;Bot.prototype.scoreBombPlacement=function(origin){var score=oldScore.apply(this,arguments);if(!this.simulatedHuman)return score;var skill=this.humanSkill||skillFromRating(this.rating),target=this.getBestOpponent();if(target&&target.alive){var exits=this.getWalkableNeighbors(target.position,true).length;score+=Math.max(0,3-exits)*skill*18;if(this.blastWouldHit(origin,target.position))score+=skill*26;var d=Math.abs(origin.x-target.position.x)+Math.abs(origin.y-target.position.y);if(d<=Math.max(4,this.bombStrength+2))score+=skill*Math.max(0,14-d*2)}return score};
  var oldShould=Bot.prototype.shouldPlantStrategicBomb;Bot.prototype.shouldPlantStrategicBomb=function(opponent){if(!this.simulatedHuman)return oldShould.apply(this,arguments);var skill=this.humanSkill||skillFromRating(this.rating),base=oldShould.apply(this,arguments);if(base){if(opponent&&this.targetInBlastLine(opponent))return true;return Math.random()<.68+skill*.31}if(!opponent||this.activeBombCount()>=this.bombsMax||this.hasBomb(this.position)||!this.findEscapePath(this.position,this.bombStrength))return false;var exits=this.getWalkableNeighbors(opponent.position,true).length,placement=this.scoreBombPlacement(this.position),threshold=52-skill*34-Math.max(0,2-exits)*skill*8,chance=.08+skill*.68;return placement>=threshold&&Math.random()<chance};
  var oldAggro=Bot.prototype.updateEndgameAggression;Bot.prototype.updateEndgameAggression=function(){if(!this.simulatedHuman)return oldAggro.apply(this,arguments);var skill=this.humanSkill||skillFromRating(this.rating),threshold=10+Math.round(skill*34);if(this.remainingWoodCount()<=threshold&&!this.hyperAggressive){this.hyperAggressive=true;if(!this.hyperAggroSpeedApplied){this.velocity=Math.max(this.velocity,2.75+skill*.7);this.hyperAggroSpeedApplied=true}}if(!this.hyperAggressive)return oldAggro.apply(this,arguments)}
}
function patchSpawnBots(){if(!window.GameEngine||GameEngine.prototype.__v123SimSpawn)return;GameEngine.prototype.__v123SimSpawn=true;var old=GameEngine.prototype.spawnBots;GameEngine.prototype.spawnBots=function(){var r=old.apply(this,arguments);if(this.simulatedOpponent){var rating=clampRating(this.simulatedRating||S.simulatedRating||650);applySimSkill(this.simulatedOpponent,rating);if(this.simulatedAppearance)applyAppearanceToEntity(this.simulatedOpponent,this.simulatedAppearance)}return r}}
function patchSimulatedStart(){if(S.__v123SimStart)return;S.__v123SimStart=true;var old=S.startSimulated;S.startSimulated=function(){var appearance=randomAppearance(),rating=randomSimRating();S.simulatedRating=rating;remoteProfile={appearance:appearance,rating:rating};if(window.gGameEngine){gGameEngine.simulatedAppearance=clone(appearance);gGameEngine.simulatedRating=rating}var r=old.apply(S,arguments);setTimeout(function(){applyProfilesToEntities();updateMatchStatus()},60);return r}}

function receiveProfile(d){if(!d)return;remoteProfile={appearance:normalizeAppearance(d.appearance),rating:clampRating(d.rating)};applyProfilesToEntities();updateMatchStatus()}
function sendProfile(force){if(!S.online()||!S.conn||!S.conn.open)return;var now=Date.now();if(!force&&now-lastProfileSend<1600)return;lastProfileSend=now;S.send({type:'v123Profile',appearance:loadAppearance(),rating:loadRating()})}
function patchNetworkProfiles(){
  if(S.__v123Profiles)return;S.__v123Profiles=true;var oldHost=S.hostData;S.hostData=function(d){if(d&&d.type==='v123Profile'){receiveProfile(d);return}var r=oldHost.apply(S,arguments);if(d&&d.type==='matchEnd')settleFromMatchEnd();return r};var oldGuest=S.guestData;S.guestData=function(d){if(d&&d.type==='v123Profile'){receiveProfile(d);return}var r=oldGuest.apply(S,arguments);if(d&&d.type==='spectate')settleRating(false);if(d&&d.type==='matchEnd')settleFromMatchEnd();if(d&&d.type==='start')setTimeout(function(){sendProfile(true);applyProfilesToEntities()},150);return r};var oldStartHost=S.startHostMatch;S.startHostMatch=function(){var r=oldStartHost.apply(S,arguments);setTimeout(function(){sendProfile(true);applyProfilesToEntities()},150);return r}
}

function settleRating(won){
  var g=window.gGameEngine;if(!g||g.__v123RatingSettled)return null;g.__v123RatingSettled=true;var before=loadRating(),delta=won?10:-10,after=saveRating(before+delta);g.__v123RatingResult={before:before,after:after,delta:after-before,won:!!won};var lp=localPlayer();if(lp)lp.rating=after;sendProfile(true);updateRatingHud();updatePostRating();return g.__v123RatingResult
}
function settleFromMatchEnd(){var p=localPlayer();if(p)settleRating(p.alive!==false)}
function updatePostRating(){var g=window.gGameEngine,res=g&&g.__v123RatingResult,o=$('qolPostMatch');if(!res||!o||o.hidden)return;var copy=o.querySelector('.qol_copy');if(!copy)return;var sign=res.delta>0?'+':'';copy.textContent='Choose what you want to do next. Rating '+formatRating(res.after)+' ('+sign+res.delta+').'}
function patchRatingFlow(){
  if(!window.GameEngine||GameEngine.prototype.__v123RatingFlow)return;GameEngine.prototype.__v123RatingFlow=true;
  var oldRestart=GameEngine.prototype.restart;GameEngine.prototype.restart=function(){this.__v123RatingSettled=false;this.__v123RatingResult=null;var r=oldRestart.apply(this,arguments);setTimeout(applyProfilesToEntities,0);return r};
  var oldMulti=GameEngine.prototype.beginMultiplayerSpectating;GameEngine.prototype.beginMultiplayerSpectating=function(playerIndex){var localIndex=S.role==='guest'?1:0,r=oldMulti.apply(this,arguments);if(playerIndex===localIndex)settleRating(false);return r};
  var oldSpec=GameEngine.prototype.beginSpectating;GameEngine.prototype.beginSpectating=function(){var r=oldSpec.apply(this,arguments);if(this.playersCount===1)settleRating(false);return r};
  var oldFinish=GameEngine.prototype.finishCompetitiveMatch;GameEngine.prototype.finishCompetitiveMatch=function(){var p=localPlayer(),alive=p&&p.alive!==false,r=oldFinish.apply(this,arguments);if(!this.__v123RatingSettled&&p)settleRating(!!alive);return r};
  var oldGameOver=GameEngine.prototype.gameOver;GameEngine.prototype.gameOver=function(status){var r=oldGameOver.apply(this,arguments);if(this.playersCount===1&&!this.__v123RatingSettled)settleRating(status==='win');return r}
}

function updateRatingHud(){
  var g=window.gGameEngine,hud=$('qolStatHud');if(!g||!hud)return;var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[];for(var i=0;i<4;i++){var box=hud.querySelector('.qol_stat_box[data-slot="'+i+'"]'),e=slots[i];if(!box)continue;if(e&&isFinite(Number(e.rating)))box.setAttribute('data-rating',formatRating(e.rating));else box.setAttribute('data-rating','')}
}
function updateMatchStatus(){
  if(!S.els||!S.els.matchStatus||!S.els.matchBar||S.els.matchBar.hidden)return;var local=S.localName||savedName(),lr=formatRating(loadRating());if(S.role==='simulated'&&window.BomberLeaderboard127){var rp=BomberLeaderboard127.profile(S.remoteName);if(rp){S.els.matchStatus.textContent='SIMULATED • '+local+' '+lr+' (#'+BomberLeaderboard127.rank(loadRating(),local)+') vs '+rp.name+' '+rp.score+' (#'+rp.displayRank+')';return}}if(S.role==='simulated'&&remoteProfile){S.els.matchStatus.textContent='SIMULATED • '+local+' '+lr+' vs '+S.remoteName+' '+formatRating(remoteProfile.rating)}else if(S.online()){var rr=remoteProfile?formatRating(remoteProfile.rating):'—';S.els.matchStatus.textContent='ONLINE • '+local+' '+lr+' vs '+S.remoteName+' '+rr}
}
function periodic(){setVersion();applyProfilesToEntities();updateRatingHud();updatePostRating();updateMatchStatus();if(S.online())sendProfile(false)}

function expose(){window.BomberCharacter={get:loadAppearance,save:saveAppearance,random:randomAppearance,open:openCharacterPanel,makeSheet:makeCharacterSheet,getRating:loadRating,setRating:saveRating,getRemote:function(){return remoteProfile},randomSimRating:randomSimRating,skillFromRating:skillFromRating}}
function install(){
  if(patched)return true;if(!Q.installed||!Q.bottomRightOpponent||!window.gGameEngine||!window.Menu||!window.Player||!window.Bot||!S.startSimulated||!S.hostData||!S.guestData)return false;ensureStyle();addCharacterPanel();patchPlayers();patchMenu();patchSimAI();patchSpawnBots();patchSimulatedStart();patchNetworkProfiles();patchRatingFlow();expose();patched=true;setVersion();applyProfilesToEntities();return true
}
setVersion();var tries=0,t=setInterval(function(){setVersion();if(install()||++tries>600)clearInterval(t)},40);setInterval(periodic,140);
})();

