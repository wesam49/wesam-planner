(() => {
  const APP_VERSION='16.23';
  const SETTINGS_KEY='wesamPlannerForecastSettings';

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

  const yearView=document.getElementById('yearView');
  const yearSummary=document.getElementById('yearSummary');
  if(!yearView || !yearSummary) return;

  const style=document.createElement('style');
  style.textContent=`
    .forecast-card{margin-bottom:12px}
    .forecast-title-row{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}
    .forecast-title{font-weight:900;font-size:17px;color:var(--text)}
    .forecast-subtitle{font-size:11px;color:var(--muted);margin-top:3px;line-height:1.4}
    .forecast-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .forecast-range-row{display:flex;align-items:center;gap:10px}
    .forecast-range-row input[type=range]{flex:1;min-width:0}
    .forecast-range-value{min-width:54px;text-align:right;font-weight:800}
    .forecast-check{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--text)}
    .forecast-check input{width:auto;min-width:auto;margin-top:2px}
    .forecast-scenarios{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}
    .forecast-scenario{border:1px solid #e2e8f0;border-radius:14px;padding:11px;background:#f8fafc;min-width:0}
    .forecast-scenario.realistic{border-color:#94a3b8;background:#fff}
    .forecast-scenario-name{font-size:11px;color:var(--muted);font-weight:800}
    .forecast-scenario-main{font-size:18px;font-weight:900;margin:3px 0 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .forecast-mini{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--muted);margin-top:3px}
    .forecast-mini b{color:var(--text);font-weight:800;white-space:nowrap}
    .forecast-positive{color:#16a34a}
    .forecast-negative{color:#dc2626}
    .forecast-reason{border-top:1px solid #e2e8f0;margin-top:14px;padding-top:12px}
    .forecast-reason-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 12px;margin-top:8px}
    .forecast-reason-item{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--muted)}
    .forecast-reason-item b{color:var(--text);text-align:right}
    .forecast-path{border-top:1px solid #e2e8f0;margin-top:14px;padding-top:12px}
    .forecast-bars{display:grid;grid-template-columns:repeat(12,minmax(20px,1fr));align-items:end;gap:5px;height:128px;margin-top:10px;padding-bottom:20px;position:relative}
    .forecast-bar-wrap{height:100%;display:flex;align-items:flex-end;position:relative}
    .forecast-bar{width:100%;min-height:3px;border-radius:7px 7px 3px 3px;background:#cbd5e1;position:relative}
    .forecast-bar.positive{background:#86efac}
    .forecast-bar.negative{background:#fca5a5}
    .forecast-bar-label{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:9px;color:var(--muted)}
    .forecast-path-summary{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin-top:5px}
    .forecast-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:12px;color:var(--muted);font-size:12px;margin-top:12px}
    @media(max-width:620px){
      .forecast-controls{grid-template-columns:1fr}
      .forecast-scenarios{grid-template-columns:1fr}
      .forecast-reason-grid{grid-template-columns:1fr}
      .forecast-scenario-main{font-size:20px}
      .forecast-bars{gap:3px}
    }
  `;
  document.head.appendChild(style);

  const section=document.createElement('div');
  section.className='card forecast-card';
  section.id='yearForecastCard';
  section.innerHTML=`
    <div class="forecast-title-row">
      <div>
        <div class="forecast-title">Jahresprognose</div>
        <div class="forecast-subtitle">Realistische Schätzung aus deinem bisherigen Arbeits-, Einnahmen- und Ausgabenverhalten.</div>
      </div>
      <span class="tag" id="forecastDataBadge">6 Monate</span>
    </div>
    <div class="forecast-controls">
      <div>
        <label>Prognosejahr</label>
        <input type="number" id="forecastYear" min="2026" max="2100" step="1" inputmode="numeric">
      </div>
      <div>
        <label>Datengrundlage</label>
        <select id="forecastWindow"><option value="6">Letzte 6 vollständige Monate</option><option value="12">Letzte 12 vollständige Monate</option></select>
      </div>
      <div class="full">
        <label>Arbeitsumfang gegenüber bisher</label>
        <div class="forecast-range-row"><span>−20%</span><input type="range" id="forecastWorkload" min="-20" max="20" step="1" value="0"><span>+20%</span><b class="forecast-range-value" id="forecastWorkloadValue">0%</b></div>
      </div>
      <div>
        <label>Ausgabenentwicklung pro Jahr %</label>
        <input type="number" id="forecastExpenseGrowth" min="-20" max="50" step="0.5" value="3">
      </div>
      <div style="display:flex;align-items:flex-end;padding-bottom:4px">
        <label class="forecast-check"><input type="checkbox" id="forecastIncludeOneOff"> Einmalige/seltene Ausgaben als bisherige Belastung mitrechnen</label>
      </div>
    </div>
    <div id="forecastResult"></div>`;

  yearSummary.parentNode.insertBefore(section,yearSummary);

  const yearInput=document.getElementById('forecastYear');
  const windowInput=document.getElementById('forecastWindow');
  const workloadInput=document.getElementById('forecastWorkload');
  const workloadValue=document.getElementById('forecastWorkloadValue');
  const expenseGrowthInput=document.getElementById('forecastExpenseGrowth');
  const includeOneOffInput=document.getElementById('forecastIncludeOneOff');
  const result=document.getElementById('forecastResult');
  const dataBadge=document.getElementById('forecastDataBadge');

  function loadSettings(){
    let s={};
    try{s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{}}catch(_){s={}}
    const nextYear=new Date().getFullYear()+1;
    yearInput.value=String(Math.max(nextYear,Number(s.year)||nextYear));
    windowInput.value=['6','12'].includes(String(s.window))?String(s.window):'6';
    workloadInput.value=String(Math.max(-20,Math.min(20,Number(s.workload)||0)));
    expenseGrowthInput.value=String(Number.isFinite(Number(s.expenseGrowth))?Number(s.expenseGrowth):3);
    includeOneOffInput.checked=!!s.includeOneOff;
  }
  function saveSettings(){
    localStorage.setItem(SETTINGS_KEY,JSON.stringify({
      year:Number(yearInput.value),window:Number(windowInput.value),workload:Number(workloadInput.value),
      expenseGrowth:Number(expenseGrowthInput.value),includeOneOff:includeOneOffInput.checked
    }));
  }

  function avg(values){return values.length?values.reduce((a,b)=>a+Number(b||0),0)/values.length:0}
  function ym(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function addMonthKey(key,delta){
    const [y,m]=key.split('-').map(Number);return ym(new Date(y,m-1+delta,1));
  }
  function previousCompleteMonth(){
    const d=new Date();return ym(new Date(d.getFullYear(),d.getMonth()-1,1));
  }
  function earliestDataMonth(){
    const months=[];
    (state.events||[]).forEach(e=>{if(e?.date)months.push(String(e.date).slice(0,7))});
    (state.finance||[]).forEach(x=>{if(x?.month)months.push(String(x.month).slice(0,7))});
    if(state.incomeAdjustments && typeof state.incomeAdjustments==='object') months.push(...Object.keys(state.incomeAdjustments));
    return months.filter(x=>/^\d{4}-\d{2}$/.test(x)).sort()[0]||previousCompleteMonth();
  }
  function historyMonths(count){
    const last=previousCompleteMonth(), earliest=earliestDataMonth(), months=[];
    for(let i=count-1;i>=0;i--){
      const key=addMonthKey(last,-i);
      if(key>=earliest) months.push(key);
    }
    return months;
  }
  function groupMonthlyRows(months,type){
    const groups=new Map();
    months.forEach(month=>{
      const rows=(state.finance||[]).filter(x=>x.type===type&&x.month===month);
      const byMonth=new Map();
      rows.forEach(x=>{
        if(type==='income' && typeof employerFromName==='function' && employerFromName(x.name)) return;
        const key=normName(x.name);
        if(!key) return;
        if(!groups.has(key)) groups.set(key,{name:x.name,months:new Set(),total:0,series:false});
        const g=groups.get(key);
        g.total+=Number(x.amount||0);g.months.add(month);if(x.seriesId)g.series=true;
        byMonth.set(key,(byMonth.get(key)||0)+Number(x.amount||0));
      });
    });
    return groups;
  }
  function adjustmentTotal(month){
    const bucket=state.incomeAdjustments?.[month];
    if(!bucket||typeof bucket!=='object')return 0;
    return Object.values(bucket).reduce((sum,x)=>sum+Number(x?.amount||0),0);
  }
  function monthJobStats(month){
    const s=payrollForPaymentMonth(month);
    const extra=customJobPayForMonth(month);
    return {
      vmtHours:Number(s.vmtHours||0),
      vmtNet:Number(s.vmtNet||0),
      bibHours:Number(s.bibTotal||0),
      bibPay:Number(s.bibPay||0),
      brunnerHours:Number(s.br?.worked||0),
      brunnerPay:Number(s.br?.total||0),
      extraHours:(extra.items||[]).reduce((sum,x)=>sum+Number(x.hours||0),0),
      extraPay:Number(extra.total||0)
    };
  }
  function forecastModel(){
    const requested=Math.max(1,Number(windowInput.value)||6);
    const months=historyMonths(requested);
    if(!months.length) return null;
    const stats=months.map(monthJobStats);
    const n=months.length;

    const lastPay=payrollForPaymentMonth(months[months.length-1]);
    const currentVmtRate=Number(lastPay.vmtHourlyRate||16);
    const avgVmtHours=avg(stats.map(x=>x.vmtHours));
    const activeVmtShare=stats.filter(x=>x.vmtHours>0).length/n;
    // Reprice VMT with the current hourly rule instead of averaging old 15 €/h months.
    const monthlyVmt=avgVmtHours*currentVmtRate*.91 + activeVmtShare*63;
    const monthlyBib=avg(stats.map(x=>x.bibPay));
    const monthlyBrunner=avg(stats.map(x=>x.brunnerPay));
    const monthlyExtra=avg(stats.map(x=>x.extraPay));
    const monthlyCorrections=avg(months.map(adjustmentTotal));

    const incomeGroups=groupMonthlyRows(months,'income');
    const regularThreshold=Math.max(2,Math.ceil(n/2));
    let monthlyRecurringIncome=0;
    const recurringIncomeNames=[];
    incomeGroups.forEach(g=>{
      if(g.months.size>=regularThreshold){monthlyRecurringIncome+=g.total/n;recurringIncomeNames.push(g.name)}
    });

    const expenseGroups=groupMonthlyRows(months,'expense');
    let monthlyRegularExpense=0,monthlyOneOffExpense=0;
    expenseGroups.forEach(g=>{
      if(g.series||g.months.size>=regularThreshold) monthlyRegularExpense+=g.total/n;
      else monthlyOneOffExpense+=g.total/n;
    });

    const workloadFactor=1+Number(workloadInput.value||0)/100;
    const employmentMonthly=(monthlyVmt+monthlyBib+monthlyBrunner+monthlyExtra)*workloadFactor;
    const monthlyIncome=Math.max(0,employmentMonthly+monthlyCorrections+monthlyRecurringIncome);

    const targetYear=Math.max(new Date().getFullYear()+1,Math.trunc(Number(yearInput.value)||new Date().getFullYear()+1));
    const yearsAhead=Math.max(1,targetYear-new Date().getFullYear());
    const growthPct=Math.max(-20,Math.min(50,Number(expenseGrowthInput.value||0)))/100;
    const growthFactor=Math.pow(Math.max(0.1,1+growthPct),yearsAhead);
    const expenseBase=monthlyRegularExpense+(includeOneOffInput.checked?monthlyOneOffExpense:0);
    const monthlyExpense=Math.max(0,expenseBase*growthFactor);

    return {
      months,n,targetYear,yearsAhead,
      monthlyIncome,monthlyExpense,monthlySaving:monthlyIncome-monthlyExpense,
      annualIncome:monthlyIncome*12,annualExpense:monthlyExpense*12,annualSaving:(monthlyIncome-monthlyExpense)*12,
      avgVmtHours,avgBibHours:avg(stats.map(x=>x.bibHours)),avgBrunnerHours:avg(stats.map(x=>x.brunnerHours)),avgExtraHours:avg(stats.map(x=>x.extraHours)),
      monthlyVmt,monthlyBib,monthlyBrunner,monthlyExtra,monthlyCorrections,monthlyRecurringIncome,
      monthlyRegularExpense,monthlyOneOffExpense,recurringIncomeNames,
      firstMonth:months[0],lastMonth:months[months.length-1],growthPct:growthPct*100,workloadPct:Number(workloadInput.value||0)
    };
  }
  function scenario(base,incomeFactor,expenseFactor){
    const annualIncome=base.annualIncome*incomeFactor;
    const annualExpense=base.annualExpense*expenseFactor;
    return {annualIncome,annualExpense,annualSaving:annualIncome-annualExpense,monthlySaving:(annualIncome-annualExpense)/12};
  }
  function signedPercent(n){return `${n>0?'+':''}${Number(n||0).toFixed(0)}%`}
  function shortMonth(key){
    const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('de-DE',{month:'short',year:'2-digit'}).format(new Date(y,m-1,1));
  }
  function renderForecast(){
    saveSettings();
    workloadValue.textContent=signedPercent(Number(workloadInput.value||0));
    const base=forecastModel();
    if(!base){result.innerHTML='<div class="forecast-empty">Noch nicht genug Daten für eine Prognose.</div>';return}
    dataBadge.textContent=`${base.n} ${base.n===1?'Monat':'Monate'}`;

    const cautious=scenario(base,.92,1.05),realistic=scenario(base,1,1),optimistic=scenario(base,1.08,.97);
    const scenarioHtml=(name,s,cls='')=>`<div class="forecast-scenario ${cls}"><div class="forecast-scenario-name">${name}</div><div class="forecast-scenario-main ${s.annualSaving>=0?'forecast-positive':'forecast-negative'}">${money(s.annualSaving)}</div><div class="forecast-mini"><span>Einkommen</span><b>${money(s.annualIncome)}</b></div><div class="forecast-mini"><span>Ausgaben</span><b>${money(s.annualExpense)}</b></div><div class="forecast-mini"><span>Ø Sparen / Monat</span><b>${money(s.monthlySaving)}</b></div></div>`;

    const monthlyCum=[];
    for(let i=1;i<=12;i++) monthlyCum.push(base.monthlySaving*i);
    const maxAbs=Math.max(1,...monthlyCum.map(Math.abs));
    const monthNames=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const bars=monthlyCum.map((v,i)=>{
      const height=Math.max(3,Math.round(Math.abs(v)/maxAbs*100));
      return `<div class="forecast-bar-wrap" title="${monthNames[i]}: ${money(v)} kumuliert"><div class="forecast-bar ${v>=0?'positive':'negative'}" style="height:${height}%"></div><span class="forecast-bar-label">${monthNames[i]}</span></div>`;
    }).join('');

    result.innerHTML=`
      <div class="forecast-scenarios">
        ${scenarioHtml('Vorsichtig',cautious)}
        ${scenarioHtml('Realistisch',realistic,'realistic')}
        ${scenarioHtml('Optimistisch',optimistic)}
      </div>
      <div class="forecast-reason">
        <b>Warum diese Prognose?</b>
        <div class="forecast-reason-grid">
          <div class="forecast-reason-item"><span>Datengrundlage</span><b>${shortMonth(base.firstMonth)} – ${shortMonth(base.lastMonth)}</b></div>
          <div class="forecast-reason-item"><span>Arbeitsumfang</span><b>${signedPercent(base.workloadPct)} gegenüber bisher</b></div>
          <div class="forecast-reason-item"><span>VMT Ø</span><b>${base.avgVmtHours.toFixed(1)} Std./Monat · ${money(base.monthlyVmt)}</b></div>
          <div class="forecast-reason-item"><span>Bib Ø</span><b>${base.avgBibHours.toFixed(1)} Std./Monat · ${money(base.monthlyBib)}</b></div>
          <div class="forecast-reason-item"><span>Brunner Ø</span><b>${base.avgBrunnerHours.toFixed(1)} Std./Monat · ${money(base.monthlyBrunner)}</b></div>
          <div class="forecast-reason-item"><span>Zusatzjob Ø</span><b>${base.avgExtraHours.toFixed(1)} Std./Monat · ${money(base.monthlyExtra)}</b></div>
          <div class="forecast-reason-item"><span>Regelmäßige sonstige Einnahmen</span><b>${money(base.monthlyRecurringIncome)}/Monat</b></div>
          <div class="forecast-reason-item"><span>Ø Korrekturen</span><b>${money(base.monthlyCorrections)}/Monat</b></div>
          <div class="forecast-reason-item"><span>Regelmäßige Ausgaben</span><b>${money(base.monthlyRegularExpense)}/Monat</b></div>
          <div class="forecast-reason-item"><span>Ausgabenentwicklung bis ${base.targetYear}</span><b>${base.growthPct>=0?'+':''}${base.growthPct.toFixed(1)}%/Jahr</b></div>
        </div>
        <div class="forecast-subtitle" style="margin-top:9px">Vorsichtig = −8% Einkommen / +5% Ausgaben. Optimistisch = +8% Einkommen / −3% Ausgaben. Einmalige Einnahmen werden nicht automatisch als wiederkehrend angenommen.</div>
      </div>
      <div class="forecast-path">
        <b>Voraussichtlicher Sparverlauf ${base.targetYear}</b>
        <div class="forecast-bars">${bars}</div>
        <div class="forecast-path-summary"><span>Ø Einkommen: <b>${money(base.monthlyIncome)}/Monat</b></span><span>Ø Ausgaben: <b>${money(base.monthlyExpense)}/Monat</b></span><span>Ende ${base.targetYear}: <b class="${base.annualSaving>=0?'forecast-positive':'forecast-negative'}">${money(base.annualSaving)}</b></span></div>
      </div>`;
  }

  loadSettings();
  [yearInput,windowInput,expenseGrowthInput,includeOneOffInput].forEach(el=>el.addEventListener('change',renderForecast));
  workloadInput.addEventListener('input',renderForecast);

  const previousRenderYearOverview=renderYearOverview;
  renderYearOverview=function(){
    previousRenderYearOverview();
    renderForecast();
  };
  yearBtn.addEventListener('click',renderForecast);
  renderForecast();
})();
