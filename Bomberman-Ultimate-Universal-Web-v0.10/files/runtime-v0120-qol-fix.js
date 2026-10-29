(function(){
'use strict';
var id='qol-v0120-mobile-visibility-fix';
if(document.getElementById(id))return;
var st=document.createElement('style');
st.id=id;
st.textContent='body.touch-ui:not(.qol_round_live) .mobile_controls,body:not(.desktop-ui):not(.qol_round_live) .mobile_controls{display:none!important}';
document.head.appendChild(st);
})();
