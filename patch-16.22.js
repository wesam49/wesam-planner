
(() => {
  const BUILD='16.22';
  const subtitle=document.querySelector('.subtitle');
  if(subtitle) subtitle.textContent=subtitle.textContent.replace(/Version\s+[\d.]+/,`Version ${BUILD}`);
  const btn=document.getElementById('cloudSignInBtn');
  if(btn){
    btn.disabled=false;
    btn.type='button';
    btn.style.pointerEvents='auto';
    btn.style.touchAction='manipulation';
    btn.style.cursor='pointer';
    btn.style.position='relative';
    btn.style.zIndex='999';
  }
  document.documentElement.dataset.wesamBuild=BUILD;
})();
