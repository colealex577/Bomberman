(function(){
'use strict';
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function installStyle(){
 if($('v127-menu-fix-style'))return;var s=document.createElement('style');s.id='v127-menu-fix-style';s.textContent=`
#mainCustomizeTile{left:50%!important;transform:translateX(calc(-100% - 7px))!important}
#mainLeaderboardTile{left:calc(50% + 7px)!important}
body.v127_lb_open #mainCustomizeTile,body.v127_lb_open #mainLeaderboardTile,body.v127_lb_open #mainSettingsTile,body.v127_settings_open #mainCustomizeTile,body.v127_settings_open #mainLeaderboardTile,body.v127_settings_open #mainSettingsTile{display:none!important}
`;document.head.appendChild(s)
}
function stabilizeName(){var n='Player';try{n=String(localStorage.getItem('BombermanPlayerName')||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim()||'Player'}catch(e){}n=n.slice(0,14);if(window.B115&&B115.role==='offline')B115.localName=n;var t=$('mainCustomizeTile');if(t){var x=t.querySelector('.customize_name');if(x)x.textContent=n}var input=$('characterName'),preview=$('characterPreviewName');if(preview)preview.textContent=(input&&String(input.value||'').trim())||n}
function panelClasses(){var lb=$('v127LeaderboardPanel'),sp=$('v127SettingsPanel');document.body.classList.toggle('v127_lb_open',!!(lb&&!lb.hidden));document.body.classList.toggle('v127_settings_open',!!(sp&&!sp.hidden))}
function syncSettingsVisibility(){var g=G(),t=$('mainSettingsTile'),lb=$('v127LeaderboardPanel'),sp=$('v127SettingsPanel'),cp=$('characterPanel');if(!g||!g.menu||!t)return;var show=!!(g.menu.visible&&!g.lobbyOpen&&(!lb||lb.hidden)&&(!sp||sp.hidden)&&(!cp||cp.hidden));t.style.display=show?'block':'none'}
function sync(){installStyle();stabilizeName();panelClasses();syncSettingsVisibility()}
sync();setTimeout(sync,0);setTimeout(sync,40);setInterval(sync,100);
})();
