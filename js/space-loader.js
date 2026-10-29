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
  var script=document.createElement('script');
  script.src=document.getElementById('space-app').dataset.scene==='park'?'js/park.bundle.js?v=522562ee4491':'js/space.bundle.js?v=6938a3185e2e';script.onerror=function(){window.spaceFailure('三维资源加载失败，请重新加载。');};
  document.head.appendChild(script);
})();
