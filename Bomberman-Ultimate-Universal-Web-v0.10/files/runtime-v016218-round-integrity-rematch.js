(function(){
'use strict';
/*
 * v0.16.2.18 shipped with a parse error, so its rematch overrides never ran in
 * the live build. Keep that effective behavior unchanged while removing the
 * page-level SyntaxError. Deliberately do not publish BomberFix16218 here:
 * later layers that depended on the never-loaded runtime must remain dormant.
 */
window.BomberFix16218ParseSafe=true;
})();