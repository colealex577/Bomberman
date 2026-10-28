const LOCAL_MESSAGES = {
    Player1: "Player 1",
    Player2: "Player 2",
    move: "move",
    bomb: "plant the bomb",
    mute: "mute / unmute sound",
    restart: "restart",
    menu: "menu"
};
let getLocalsMessage = (messagename) => LOCAL_MESSAGES[messagename] || messagename;

function GUILocalization(){
    document.querySelector("#player1").textContent = getLocalsMessage("Player1");
    document.querySelector("#player2").textContent = getLocalsMessage("Player2");
    document.querySelector("#movement1").textContent = getLocalsMessage("move");
    document.querySelector("#bomb1").textContent = getLocalsMessage("bomb");
    document.querySelector("#movement2").textContent = getLocalsMessage("move");
    document.querySelector("#bomb2").textContent = getLocalsMessage("bomb");
    document.querySelector("#mute").textContent = getLocalsMessage("mute");
    document.querySelector("#restart").textContent = getLocalsMessage("restart");
    document.querySelector("#menu").textContent = getLocalsMessage("menu");
}

let Storage = {
    setValue : (key, value) => { localStorage[key] = JSON.stringify(value); },
    getValue : (key) => {
        let result = undefined;
        try {
            if (localStorage[key]) result = JSON.parse(localStorage[key]);
        } catch (e) {
            throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`);
        }
        return result; 
    }
};

/**
 * StorageError
 * @param   string      _msg    Error message    
 */
class StorageError extends Error {
    constructor(_msg){
        super();
        this.name = 'StorageError';
        this.message = _msg || 'Storage Error';
        this.stack = (new Error()).stack;
    }
}

function ensureBuildVersion(){
    let badge = document.getElementById('buildVersion');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'buildVersion';
        badge.className = 'build_version';
        (document.body || document.documentElement).appendChild(badge);
    }
    badge.textContent = 'v0.11.6';
    badge.setAttribute('aria-label', 'Game version');
    const s = badge.style;
    const imp = (key, value) => { try { s.setProperty(key, value, 'important'); } catch (e) { s[key] = value; } };
    imp('position','fixed');
    imp('top','calc(env(safe-area-inset-top, 0px) + 5px)');
    imp('left','calc(env(safe-area-inset-left, 0px) + 6px)');
    imp('right','auto');
    imp('bottom','auto');
    imp('z-index','2147483647');
    imp('display','block');
    imp('visibility','visible');
    imp('opacity','1');
    imp('transform','none');
    imp('margin','0');
    imp('padding','2px 5px');
    imp('border-radius','4px');
    imp('background','rgba(0,0,0,.62)');
    imp('color','rgba(255,255,255,.92)');
    imp('font','700 9px/1.25 Arial,sans-serif');
    imp('pointer-events','none');
}

function loadV0116Compatibility(){
    if (document.getElementById('runtime-v0116-fix-loader')) return;
    const s = document.createElement('script');
    s.id = 'runtime-v0116-fix-loader';
    s.src = './files/runtime-v0116-fix.js?v=0116';
    document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', () => {
    ensureBuildVersion();
    loadV0116Compatibility();
	GUILocalization();
	gGameEngine.load();
});

setInterval(ensureBuildVersion, 1200);
window.addEventListener('pageshow', ensureBuildVersion, {passive:true});
