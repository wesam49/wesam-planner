(() => {
  const APP_VERSION='16.28';
  const preloadedTracking=
    window.__wesamPreloadState &&
    window.__wesamPreloadState.futurePlanTracking &&
    typeof window.__wesamPreloadState.futurePlanTracking==='object'
      ? window.__wesamPreloadState.futurePlanTracking
      : null;

  function updateVersionLabels(){
    const subtitle=document.querySelector('.subtitle');
    if(subtitle) subtitle.textContent=subtitle.textContent.replace(/Version\s+[\d.]+/,`Version ${APP_VERSION}`);
    document.querySelectorAll('.tag').forEach(tag=>{
      if(/Schema\s+\d+\s+·\s+App\s+[\d.]+/.test(tag.textContent)) tag.textContent=tag.textContent.replace(/App\s+[\d.]+/,`App ${APP_VERSION}`);
    });
  }
  updateVersionLabels();

  // Preserve tracking settings through normalization, backup and cloud sync.
  const baseNormalizeTracking=normalizeState;
  normalizeState=function(input){
    const tracking=
      input && input.futurePlanTracking && typeof input.futurePlanTracking==='object'
        ? input.futurePlanTracking
        : (preloadedTracking || {});
    const out=baseNormalizeTracking(input);
    out.futurePlanTracking=tracking;
    return out;
  };
  state=normalizeState(preloadedTracking?{...state,futurePlanTracking:preloadedTracking}:state);

  const baseSaveTracking=save;
  save=function(){
    baseSaveTracking();
    try{
      const backup=JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)||'null');
      if(backup){backup.appVersion=APP_VERSION;localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify(backup))}
    }catch(_){ }
  };

  const futureCard=document.getElementById('futurePlanCard');
  const yearView=document.getElementById('yearView');
  if(!futureCard||!yearView)return;

  const style=document.createElement('style');
  style.textContent=`
    .pa-card{margin-bottom:12px}
    .pa-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px}
    .pa-title{font-size:18px;font-weight:900;color:var(--text)}
    .pa-sub{font-size:11px;color:var(--muted);line-height:1.45;margin-top:3px}
    .pa-head-grid,.pa-total-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}
    .pa-stat{border:1px solid #e2e8f0;background:#f8fafc;border-radius:13px;padding:9px;min-width:0}
    .pa-stat span{display:block;font-size:9px;color:var(--muted);line-height:1.25}
    .pa-stat b{display:block;font-size:13px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pa-job{border:1px solid #e2e8f0;border-radius:15px;background:#fff;padding:12px;margin-top:9px}
    .pa-job-title{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}
    .pa-job-name{font-weight:900;color:var(--text);font-size:14px}
    .pa-status{font-size:10px;font-weight:800;padding:5px 8px;border-radius:999px;background:#f1f5f9;color:#475569}
    .pa-status.good{background:#dcfce7;color:#166534}.pa-status.bad{background:#fee2e2;color:#991b1b}
    .pa-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-top:10px}
    .pa-cell{border-top:1px solid #e2e8f0;padding-top:8px;min-width:0}
    .pa-cell span{display:block;font-size:9px;color:var(--muted);line-height:1.25}
    .pa-cell b{display:block;font-size:12px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pa-correction{display:grid;grid-template-columns:minmax(0,180px) 1fr;gap:10px;align-items:end;margin-top:10px}
    .pa-correction label{font-size:10px}.pa-correction input{padding:8px}
    .pa-progress{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:9px}
    .pa-progress>span{display:block;height:100%;background:#94a3b8;border-radius:999px}
    .pa-progress>span.good{background:#86efac}.pa-progress>span.bad{background:#fca5a5}
    .pa-note{margin-top:10px;padding:9px 10px;border-radius:12px;background:#f8fafc;font-size:10px;color:var(--muted);line-height:1.45}
    .pa-positive{color:#16a34a}.pa-negative{color:#dc2626}
    @media(max-width:760px){.pa-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pa-head-grid,.pa-total-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:470px){.pa-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pa-correction{grid-template-columns:1fr}.pa-head-grid,.pa-total-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  const card=document.createElement('div');
  card.className='card pa-card';
  card.id='planActualCard';
  card.innerHTML=`
    <div class="pa-title-row">
      <div><div class="pa-title">Arbeitsstunden – Plan vs. Ist</div><div class="pa-sub">Vergleicht deine gespeicherte Zukunftsplanung mit den tatsächlich im Kalender eingetragenen Arbeitsstunden.</div></div>
      <span class="tag" id="paYearBadge"></span>
    </div>
    <div id="paContent"></div>`;
  futureCard.insertAdjacentElement('afterend',card);

  const content=document.getElementById('paContent');
  const yearBadge=document.getElementById('paYearBadge');
  const JOB_TYPES=['VMT','Bib','Brunner','Zusatzjob'];

  function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0))}
  function planYear(){return Math.trunc(clamp(state.futurePlan?.year||new Date().getFullYear(),2026,2100))}
  function trackingBucket(year){
    if(!state.futurePlanTracking||typeof state.futurePlanTracking!=='object')state.futurePlanTracking={};
    if(!state.futurePlanTracking[year]||typeof state.futurePlanTracking[year]!=='object')state.futurePlanTracking[year]={adjustments:{}};
    if(!state.futurePlanTracking[year].adjustments||typeof state.futurePlanTracking[year].adjustments!=='object')state.futurePlanTracking[year].adjustments={};
    return state.futurePlanTracking[year];
  }
  function calendarHours(type,year){
    const prefix=`${year}-`;
    return (state.events||[]).filter(e=>e.type===type&&String(e.date||'').startsWith(prefix)).reduce((sum,e)=>sum+Number(hours(e)||0),0);
  }
  function elapsedYearFraction(year){
    const now=new Date(),cy=now.getFullYear();
    if(year<cy)return 1;
    if(year>cy)return 0;
    const start=new Date(cy,0,1),end=new Date(cy+1,0,1);
    return clamp((now-start)/(end-start),0,1);
  }
  function remainingMonths(year){
    const now=new Date(),cy=now.getFullYear();
    if(year<cy)return 0;
    if(year>cy)return 12;
    return 12-now.getMonth(); // current month included because more hours can still be worked.
  }
  function jobLabel(type){return type==='Zusatzjob'?'Zusatzjob':type}
  function fmtHours(v){return `${Number(v||0).toFixed(1)} Std.`}
  function signedHours(v){const n=Number(v||0);return `${n>0?'+':''}${n.toFixed(1)} Std.`}
  function activeJobs(){
    const jobs=state.futurePlan?.jobs||{};
    return JOB_TYPES.filter(type=>jobs[type]?.enabled).map(type=>({type,...jobs[type]}));
  }
  function saveAdjustment(year,type,value){
    const bucket=trackingBucket(year);
    bucket.adjustments[type]=Number(value||0);
    save();
  }
  function metricsFor(job,year){
    const bucket=trackingBucket(year),adjustment=Number(bucket.adjustments[job.type]||0);
    const basePerMonth=Number(job.hours||0)+Number(job.extra||0);
    const activeMonths=clamp(job.months,0,12);
    const annualTarget=basePerMonth*activeMonths;
    const fraction=elapsedYearFraction(year);
    const plannedToDate=annualTarget*fraction;
    const calendar=calendarHours(job.type,year);
    const actual=Math.max(0,calendar+adjustment);
    const deviation=actual-plannedToDate;
    const remaining=Math.max(0,annualTarget-actual);
    const restMonths=remainingMonths(year);
    const neededMonthly=restMonths>0?remaining/restMonths:0;
    const elapsedMonthsEquivalent=fraction*12;
    let forecast;
    if(year<new Date().getFullYear())forecast=actual;
    else if(year>new Date().getFullYear())forecast=0;
    else forecast=elapsedMonthsEquivalent>0?(actual/elapsedMonthsEquivalent)*12:0;
    const forecastDiff=forecast-annualTarget;
    const completion=annualTarget>0?actual/annualTarget*100:0;
    return {basePerMonth,activeMonths,annualTarget,fraction,plannedToDate,calendar,adjustment,actual,deviation,remaining,restMonths,neededMonthly,forecast,forecastDiff,completion};
  }
  function render(){
    const year=planYear(),jobs=activeJobs(),fraction=elapsedYearFraction(year);
    yearBadge.textContent=`Plan ${year}`;
    if(!jobs.length){
      content.innerHTML='<div class="pa-note">In Zukunftsplanung ist noch kein Job aktiviert. Füge dort zuerst einen Job hinzu und hinterlege deine geplanten Stunden.</div>';
      return;
    }
    const all=jobs.map(j=>({job:j,m:metricsFor(j,year)}));
    const totals=all.reduce((a,x)=>{
      for(const k of ['annualTarget','plannedToDate','actual','deviation','remaining','forecast'])a[k]+=x.m[k];
      return a;
    },{annualTarget:0,plannedToDate:0,actual:0,deviation:0,remaining:0,forecast:0});
    const rest=remainingMonths(year),needed=rest>0?totals.remaining/rest:0,forecastDiff=totals.forecast-totals.annualTarget;
    const yearState=year<new Date().getFullYear()?'abgeschlossen':year>new Date().getFullYear()?'zukünftig':'laufend';
    const jobHtml=all.map(({job,m})=>{
      const statusCls=m.deviation>=0?'good':'bad',statusText=m.deviation>=0?`${signedHours(m.deviation)} vor Soll`:`${signedHours(m.deviation)} hinter Soll`;
      const width=Math.min(100,Math.max(0,m.completion));
      const forecastText=year>new Date().getFullYear()?'–':fmtHours(m.forecast);
      return `<div class="pa-job" data-pa-job="${job.type}">
        <div class="pa-job-title"><div><div class="pa-job-name">${jobLabel(job.type)}</div><div class="pa-sub">Jahresplan: ${m.basePerMonth.toFixed(1)} Std./aktivem Monat × ${m.activeMonths} Monate</div></div><span class="pa-status ${statusCls}">${statusText}</span></div>
        <div class="pa-progress"><span class="${statusCls}" style="width:${width}%"></span></div>
        <div class="pa-grid">
          <div class="pa-cell"><span>Jahresziel</span><b>${fmtHours(m.annualTarget)}</b></div>
          <div class="pa-cell"><span>Soll bis heute</span><b>${fmtHours(m.plannedToDate)}</b></div>
          <div class="pa-cell"><span>Ist</span><b>${fmtHours(m.actual)}</b></div>
          <div class="pa-cell"><span>Noch bis Ziel</span><b>${fmtHours(m.remaining)}</b></div>
          <div class="pa-cell"><span>Ø nötig / Restmonat</span><b>${fmtHours(m.neededMonthly)}</b></div>
          <div class="pa-cell"><span>Prognose Jahresende</span><b class="${m.forecastDiff>=0?'pa-positive':'pa-negative'}">${forecastText}</b></div>
        </div>
        <div class="pa-correction">
          <div><label>Ist-Korrektur ± Std.</label><input class="pa-adjustment" type="number" step="0.25" value="${m.adjustment}"></div>
          <div class="pa-sub">Kalender: <b>${fmtHours(m.calendar)}</b>. Nutze die Korrektur nur für tatsächlich gearbeitete Stunden, die im Kalender fehlen oder berichtigt werden müssen.</div>
        </div>
      </div>`;
    }).join('');
    content.innerHTML=`
      <div class="pa-head-grid">
        <div class="pa-stat"><span>Planstatus</span><b>${yearState}</b></div>
        <div class="pa-stat"><span>Jahresfortschritt</span><b>${(fraction*100).toFixed(1)}%</b></div>
        <div class="pa-stat"><span>Restmonate inkl. aktuellem</span><b>${rest}</b></div>
        <div class="pa-stat"><span>Jobs im Plan</span><b>${jobs.length}</b></div>
        <div class="pa-stat"><span>Datenquelle Ist</span><b>Kalender</b></div>
      </div>
      ${jobHtml}
      <div class="pa-note"><b>Gesamt:</b> Plan ${fmtHours(totals.annualTarget)} · Soll bis heute ${fmtHours(totals.plannedToDate)} · Ist ${fmtHours(totals.actual)} · <span class="${totals.deviation>=0?'pa-positive':'pa-negative'}">Abweichung ${signedHours(totals.deviation)}</span> · Noch ${fmtHours(totals.remaining)} · nötig ${fmtHours(needed)}/Restmonat${year<=new Date().getFullYear()?` · Prognose Jahresende ${fmtHours(totals.forecast)} (${signedHours(forecastDiff)} zum Jahresziel)`:''}.</div>
      <div class="pa-note">„Soll bis heute“ verteilt dein Jahresziel gleichmäßig über das Jahr. „Ø nötig / Restmonat“ verteilt die noch fehlenden Stunden auf die verbleibenden Kalendermonate inklusive des aktuellen Monats.</div>`;
    content.querySelectorAll('.pa-job').forEach(row=>{
      const input=row.querySelector('.pa-adjustment'),type=row.dataset.paJob;
      input.addEventListener('change',()=>{saveAdjustment(year,type,input.value);render()});
      input.addEventListener('blur',()=>{saveAdjustment(year,type,input.value);render()});
    });
  }

  // Recalculate after the future-plan inputs are persisted by 16.27's input handlers.
  futureCard.addEventListener('input',()=>setTimeout(render,0));
  futureCard.addEventListener('change',()=>setTimeout(render,0));
  document.getElementById('fpPickerModal')?.addEventListener('click',()=>setTimeout(render,0));

  const baseRenderYearOverview=renderYearOverview;
  renderYearOverview=function(){baseRenderYearOverview();render()};
  yearBtn?.addEventListener('click',render);
  window.addEventListener('focus',render);
  render();
})();
