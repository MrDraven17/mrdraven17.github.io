(function(){
  'use strict';
  var status=document.getElementById('space-status');
  var retry=document.getElementById('space-retry');
  retry.addEventListener('click',function(){location.reload();});
  window.spaceFailure=function(message){
    document.body.classList.remove('space-ready');document.body.classList.add('space-failed');
    document.getElementById('space-loading').hidden=false;
    status.textContent=message;retry.hidden=false;
    document.getElementById('space-hint').textContent='当前显示参考照片';
    document.querySelectorAll('#space-compare,#space-settings-button,[data-space-view]').forEach(function(button){button.disabled=true;});
  };
  function add(src,next){var script=document.createElement('script');script.src=src;script.onload=next||null;script.onerror=function(){window.spaceFailure('三维资源加载失败，请重新加载。');};document.head.appendChild(script);}
  // The park scene's data (scene + textures as data URLs) comes first so it also works from file://.
  if(document.getElementById('space-app').dataset.scene==='park')add('assets/park-r04/data.js?v=2',function(){add('js/park-r04.bundle.js?v=2');});
  else add('js/space.bundle.js?v=ef9daed9f01e');
})();
