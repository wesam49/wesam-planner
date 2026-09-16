(() => {
  const APP_VERSION = '16.18';
  const YEAR_STORAGE_KEY = 'wesamPlannerYearOverview';

  function updateVersionLabels(){
    const subtitle=document.querySelector('.subtitle');
    if(subtitle) subtitle.textContent=subtitle.textContent.replace(/Version\s+[\d.]+/,`Version ${APP_VERSION}`);
    document.querySelectorAll('.tag').forEach(tag=>{
      if(/Schema\s+\d+\s+·\s+App\s+[\d.]+/.test(tag.textContent)){
        tag.textContent=tag.textContent.replace(/App\s+[\d.]+/,`App ${APP_VERSION}`);
      }
    });
  }
  updateVersionLabels();

  const previousSave=save;
  save=function(){
    previousSave();
    try{
      const backup=JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)||'null');
      if(backup){
        backup.appVersion=APP_VERSION;
        localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify(backup));
      }
    }catch(_){ }
  };

  const yearViewEl=document.getElementById('yearView');
  if(!yearViewEl) return;

  const firstCard=yearViewEl.querySelector('.card');
  const nav=document.createElement('div');
  nav.className='week-head year-overview-nav';
  nav.style.margin='10px 0 12px';
  nav.innerHTML=`
    <button type="button" id="prevYearOverview" aria-label="Vorheriges Jahr">‹</button>
    <div style="display:flex;align-items:center;gap:8px;justify-content:center;flex:1;max-width:260px">
      <label for="yearOverviewPicker" style="margin:0;font-weight:800;white-space:nowrap">Jahr</label>
      <input type="number" id="yearOverviewPicker" min="2000" max="2100" step="1" inputmode="numeric" aria-label="Jahr auswählen" style="max-width:140px;text-align:center;font-weight:800">
    </div>
    <button type="button" id="nextYearOverview" aria-label="Nächstes Jahr">›</button>`;
  if(firstCard) yearViewEl.insertBefore(nav,firstCard);
  else yearViewEl.prepend(nav);

  const picker=document.getElementById('yearOverviewPicker');
  const currentDefault=Number(String(activeFinanceMonth||monthKey(new Date())).slice(0,4)) || new Date().getFullYear();
  const stored=Number(localStorage.getItem(YEAR_STORAGE_KEY));
  let selectedYear=Number.isFinite(stored)&&stored>=2000&&stored<=2100?stored:currentDefault;

  function setSelectedYear(value,rerender=true){
    const y=Math.max(2000,Math.min(2100,Math.trunc(Number(value)||currentDefault)));
    selectedYear=y;
    picker.value=String(y);
    localStorage.setItem(YEAR_STORAGE_KEY,String(y));
    if(rerender) renderYearOverview();
  }

  const baseRenderYearOverview=renderYearOverview;
  renderYearOverview=function(){
    // The annual view uses its own year. The Monatsplan month must not change.
    const originalFinanceMonth=activeFinanceMonth;
    activeFinanceMonth=`${selectedYear}-01`;
    try{
      baseRenderYearOverview();
    }finally{
      activeFinanceMonth=originalFinanceMonth;
    }
    picker.value=String(selectedYear);
  };

  document.getElementById('prevYearOverview').onclick=()=>setSelectedYear(selectedYear-1);
  document.getElementById('nextYearOverview').onclick=()=>setSelectedYear(selectedYear+1);
  picker.onchange=()=>setSelectedYear(picker.value);
  picker.onkeydown=e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      picker.blur();
      setSelectedYear(picker.value);
    }
  };

  // Opening Jahresübersicht keeps the independently selected year.
  yearBtn.addEventListener('click',()=>renderYearOverview());

  setSelectedYear(selectedYear,false);
  renderYearOverview();
})();
