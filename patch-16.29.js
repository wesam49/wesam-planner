(() => {
  const APP_VERSION='16.29';
  const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const JOB_TYPES=['VMT','Bib','Brunner','Zusatzjob'];

  function updateVersionLabels(){
    const subtitle=document.querySelector('.subtitle');
    if(subtitle)subtitle.textContent=subtitle.textContent.replace(/Version\s+[\d.]+/,`Version ${APP_VERSION}`);
    document.querySelectorAll('.tag').forEach(tag=>{
      if(/Schema\s+\d+\s+·\s+App\s+[\d.]+/.test(tag.textContent))tag.textContent=tag.textContent.replace(/App\s+[\d.]+/,`App ${APP_VERSION}`);
    });
  }
  updateVersionLabels();

  const baseSave1629=save;
  save=function(){
    baseSave1629();
    try{
      const backup=JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)||'null');
      if(backup){backup.appVersion=APP_VERSION;localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify(backup))}
    }catch(_){ }
  };

  // 16.28's aggregated card is replaced by the monthly Plan-vs-Ist tracker.
  document.getElementById('planActualCard')?.remove();
  const futureCard=document.getElementById('futurePlanCard');
  if(!futureCard)return;

  const style=document.createElement('style');
  style.textContent=`
    .pm-card{margin-bottom:12px}
    .pm-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px}
    .pm-title{font-size:18px;font-weight:900;color:var(--text)}
    .pm-sub{font-size:11px;color:var(--muted);line-height:1.45;margin-top:3px}
    .pm-job{border:1px solid #e2e8f0;border-radius:15px;background:#fff;padding:12px;margin-top:10px}
    .pm-job-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
    .pm-job-name{font-size:15px;font-weight:900;color:var(--text)}
    .pm-actions{display:flex;gap:7px;flex-wrap:wrap}
    .pm-actions button{font-size:11px;padding:7px 9px}
    .pm-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:10px 0}
    .pm-stat{border:1px solid #e2e8f0;background:#f8fafc;border-radius:12px;padding:8px;min-width:0}
    .pm-stat span{display:block;font-size:9px;color:var(--muted);line-height:1.25}
    .pm-stat b{display:block;font-size:12px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pm-positive{color:#16a34a}.pm-negative{color:#dc2626}
    .pm-table-wrap{overflow-x:auto;border:1px solid #e2e8f0;border-radius:13px}
    .pm-table{width:100%;border-collapse:collapse;min-width:660px;background:#fff}
    .pm-table th,.pm-table td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:11px;vertical-align:middle}
    .pm-table th{background:#f8fafc;color:#64748b;font-size:10px;position:sticky;top:0;z-index:1}
    .pm-table tr:last-child td{border-bottom:0}
    .pm-month{font-weight:800;color:var(--text);white-space:nowrap}
    .pm-plan{font-weight:800;white-space:nowrap}
    .pm-ist-wrap{display:flex;align-items:center;gap:6px}
    .pm-ist{width:92px;min-width:92px;padding:7px 8px}
    .pm-calendar{font-size:10px;padding:6px 8px;white-space:nowrap}
    .pm-source{font-size:9px;color:var(--muted);margin-top:3px;white-space:nowrap}
    .pm-diff{font-weight:800;white-space:nowrap}
    .pm-row-future{opacity:.72}
    .pm-row-noplan .pm-plan{color:#94a3b8}
    .pm-note{margin-top:9px;padding:9px 10px;border-radius:12px;background:#f8fafc;color:var(--muted);font-size:10px;line-height:1.45}
    .pm-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:12px;color:var(--muted);font-size:11px}
    @media(max-width:760px){.pm-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:470px){.pm-summary{grid-template-columns:1fr 1fr}.pm-job{padding:9px}.pm-actions{width:100%}.pm-actions button{flex:1}}
  `;
  document.head.appendChild(style);

  const card=document.createElement('div');
  card.className='card pm-card';
  card.id='planActualMonthlyCard';
  card.innerHTML=`
    <div class="pm-title-row">
      <div>
        <div class="pm-title">Arbeitsstunden – monatlich Plan vs. Ist</div>
        <div class="pm-sub">Für jeden Monat kannst du die tatsächlich gearbeiteten Stunden selbst eintragen oder direkt aus dem Kalender übernehmen und danach noch manuell ändern.</div>
      </div>
      <span class="tag" id="pmYearBadge"></span>
    </div>
    <div id="pmContent"></div>`;
  futureCard.insertAdjacentElement('afterend',card);

  const content=document.getElementById('pmContent');
  const yearBadge=document.getElementById('pmYearBadge');

  function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0))}
  function planYear(){return Math.trunc(clamp(state.futurePlan?.year||new Date().getFullYear(),2026,2100))}
  function activeJobs(){
    const jobs=state.futurePlan?.jobs||{};
    return JOB_TYPES.filter(type=>jobs[type]?.enabled).map(type=>({type,...jobs[type]}));
  }
  function bucket(year){
    if(!state.futurePlanTracking||typeof state.futurePlanTracking!=='object')state.futurePlanTracking={};
    if(!state.futurePlanTracking[year]||typeof state.futurePlanTracking[year]!=='object')state.futurePlanTracking[year]={};
    const b=state.futurePlanTracking[year];
    if(!b.monthly||typeof b.monthly!=='object')b.monthly={};
    return b;
  }
  function jobBucket(year,type){
    const b=bucket(year);
    if(!b.monthly[type]||typeof b.monthly[type]!=='object')b.monthly[type]={};
    return b.monthly[type];
  }
  function rowState(year,type,month){
    const jb=jobBucket(year,type),key=String(month+1).padStart(2,'0');
    if(!jb[key]||typeof jb[key]!=='object')jb[key]={actual:null,source:''};
    return jb[key];
  }
  function calendarHours(type,year,month){
    const prefix=`${year}-${String(month+1).padStart(2,'0')}`;
    return (state.events||[]).filter(e=>e.type===type&&String(e.date||'').startsWith(prefix)).reduce((s,e)=>s+Number(hours(e)||0),0);
  }
  function plannedMonthHours(job,month){
    const perMonth=Math.max(0,Number(job.hours||0)+Number(job.extra||0));
    const activeMonths=Math.trunc(clamp(job.months,0,12));
    return month<activeMonths?perMonth:0;
  }
  function fmt(v){return `${Number(v||0).toFixed(1)} Std.`}
  function signed(v){const n=Number(v||0);return `${n>0?'+':''}${n.toFixed(1)} Std.`}
  function jobName(type){return type==='Zusatzjob'?'Zusatzjob':type}
  function currentMonthIndex(year){
    const now=new Date(),cy=now.getFullYear();
    if(year<cy)return 11;
    if(year>cy)return -1;
    return now.getMonth();
  }
  function saveActual(year,type,month,value,source){
    const r=rowState(year,type,month);
    if(value===''||value===null||typeof value==='undefined')r.actual=null;
    else r.actual=Math.max(0,Number(value)||0);
    r.source=source||'';
    r.updatedAt=new Date().toISOString();
    save();
  }
  function importCalendar(year,type,month){
    saveActual(year,type,month,calendarHours(type,year,month),'calendar');
  }
  function importPastFromCalendar(year,type){
    const through=currentMonthIndex(year);
    if(through<0)return;
    for(let m=0;m<=through;m++){
      const r=rowState(year,type,m);
      r.actual=calendarHours(type,year,m);
      r.source='calendar';
      r.updatedAt=new Date().toISOString();
    }
    save();
  }
  function metrics(job,year){
    const through=currentMonthIndex(year);
    let annualPlan=0,planToDate=0,actualToDate=0,entered=0,missingPast=0;
    for(let m=0;m<12;m++){
      const p=plannedMonthHours(job,m);annualPlan+=p;
      const r=rowState(year,job.type,m);
      if(m<=through){
        planToDate+=p;
        if(r.actual!==null&&r.actual!==''&&Number.isFinite(Number(r.actual))){actualToDate+=Number(r.actual);entered++}
        else if(m<through)missingPast++;
      }
    }
    const deviation=actualToDate-planToDate;
    const remaining=Math.max(0,annualPlan-actualToDate);
    let futurePlanMonths=0;
    const start=Math.max(0,through);
    for(let m=start;m<12;m++)if(plannedMonthHours(job,m)>0)futurePlanMonths++;
    if(futurePlanMonths===0 && remaining>0)futurePlanMonths=Math.max(1,12-Math.max(0,through));
    const needed=futurePlanMonths?remaining/futurePlanMonths:0;
    return {through,annualPlan,planToDate,actualToDate,deviation,remaining,futurePlanMonths,needed,entered,missingPast};
  }
  function render(){
    const year=planYear(),jobs=activeJobs();
    yearBadge.textContent=`Plan ${year}`;
    if(!jobs.length){
      content.innerHTML='<div class="pm-empty">In Zukunftsplanung ist noch kein Job hinzugefügt. Füge dort zuerst einen Job hinzu und hinterlege deine geplanten Stunden.</div>';
      return;
    }
    const now=new Date(),cy=now.getFullYear();
    content.innerHTML=jobs.map(job=>{
      const m=metrics(job,year),perMonth=Number(job.hours||0)+Number(job.extra||0),activeMonths=Math.trunc(clamp(job.months,0,12));
      const rows=MONTHS.map((name,i)=>{
        const r=rowState(year,job.type,i),cal=calendarHours(job.type,year,i),plan=plannedMonthHours(job,i);
        const hasActual=r.actual!==null&&r.actual!==''&&Number.isFinite(Number(r.actual));
        const actual=hasActual?Number(r.actual):null;
        const diff=hasActual?actual-plan:null;
        const isFuture=year>cy||(year===cy&&i>now.getMonth());
        const noPlan=plan<=0;
        const source=r.source==='calendar'?'Kalender':r.source==='manual'?'Manuell':'Noch nicht eingetragen';
        return `<tr class="${isFuture?'pm-row-future ':''}${noPlan?'pm-row-noplan':''}" data-pm-month="${i}">
          <td class="pm-month">${name}</td>
          <td><span class="pm-plan">${fmt(plan)}</span>${noPlan?'<div class="pm-source">kein Planmonat</div>':''}</td>
          <td>
            <div class="pm-ist-wrap"><input class="pm-ist" type="number" min="0" step="0.25" placeholder="–" value="${hasActual?actual:''}"></div>
            <div class="pm-source">${source}</div>
          </td>
          <td><button type="button" class="pm-calendar">Kalender: ${cal.toFixed(1)} h übernehmen</button></td>
          <td><span class="pm-diff ${diff===null?'':diff>=0?'pm-positive':'pm-negative'}">${diff===null?'–':signed(diff)}</span></td>
        </tr>`;
      }).join('');
      return `<div class="pm-job" data-pm-job="${job.type}">
        <div class="pm-job-head">
          <div><div class="pm-job-name">${jobName(job.type)}</div><div class="pm-sub">Zukunftsplanung: ${perMonth.toFixed(1)} Std./aktivem Monat × ${activeMonths} Monate = ${fmt(m.annualPlan)} Jahresziel</div></div>
          <div class="pm-actions"><button type="button" class="pm-import-past">Vergangene Monate aus Kalender übernehmen</button></div>
        </div>
        <div class="pm-summary">
          <div class="pm-stat"><span>Jahresziel</span><b>${fmt(m.annualPlan)}</b></div>
          <div class="pm-stat"><span>Plan bis aktueller Monat</span><b>${fmt(m.planToDate)}</b></div>
          <div class="pm-stat"><span>Ist eingetragen</span><b>${fmt(m.actualToDate)}</b></div>
          <div class="pm-stat"><span>Abweichung</span><b class="${m.deviation>=0?'pm-positive':'pm-negative'}">${signed(m.deviation)}</b></div>
          <div class="pm-stat"><span>Ø nötig / restl. Planmonat</span><b>${fmt(m.needed)}</b></div>
        </div>
        <div class="pm-table-wrap"><table class="pm-table">
          <thead><tr><th>Monat</th><th>Plan</th><th>Ist</th><th>Aus Kalender</th><th>Differenz</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="pm-note">Noch bis Jahresziel: <b>${fmt(m.remaining)}</b>${m.missingPast?` · ${m.missingPast} vergangene Monate haben noch keinen Ist-Wert.`:''} Jeder manuell geänderte Ist-Wert bleibt gespeichert. Mit „Kalender übernehmen“ kannst du den Wert jederzeit wieder aus den Termineinträgen aktualisieren.</div>
      </div>`;
    }).join('');

    content.querySelectorAll('.pm-job').forEach(jobEl=>{
      const type=jobEl.dataset.pmJob;
      jobEl.querySelector('.pm-import-past')?.addEventListener('click',()=>{importPastFromCalendar(year,type);render()});
      jobEl.querySelectorAll('tr[data-pm-month]').forEach(row=>{
        const month=Number(row.dataset.pmMonth),input=row.querySelector('.pm-ist'),btn=row.querySelector('.pm-calendar');
        input.addEventListener('change',()=>{saveActual(year,type,month,input.value,'manual');render()});
        input.addEventListener('blur',()=>{saveActual(year,type,month,input.value,'manual');render()});
        btn.addEventListener('click',()=>{importCalendar(year,type,month);render()});
      });
    });
  }

  // Keep the monthly tracker in sync when Zukunftsplanung or calendar data changes.
  futureCard.addEventListener('input',()=>setTimeout(render,0));
  futureCard.addEventListener('change',()=>setTimeout(render,0));
  document.getElementById('fpPickerModal')?.addEventListener('click',()=>setTimeout(render,0));
  const baseRenderYearOverview1629=renderYearOverview;
  renderYearOverview=function(){baseRenderYearOverview1629();render()};
  yearBtn?.addEventListener('click',render);
  window.addEventListener('focus',render);
  render();
})();
