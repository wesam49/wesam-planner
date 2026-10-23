(() => {
  const APP_VERSION='16.24';
  const SETTINGS_KEY='wesamPlannerForecastPlanV2';

  function updateVersionLabels(){
    const subtitle=document.querySelector('.subtitle');
    if(subtitle) subtitle.textContent=subtitle.textContent.replace(/Version\s+[\d.]+/,`Version ${APP_VERSION}`);
    document.querySelectorAll('.tag').forEach(tag=>{
      if(/Schema\s+\d+\s+·\s+App\s+[\d.]+/.test(tag.textContent)) tag.textContent=tag.textContent.replace(/App\s+[\d.]+/,`App ${APP_VERSION}`);
    });
  }
  updateVersionLabels();

  const previousSave=save;
  save=function(){
    previousSave();
    try{
      const backup=JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)||'null');
      if(backup){backup.appVersion=APP_VERSION;localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify(backup))}
    }catch(_){ }
  };

  const yearView=document.getElementById('yearView');
  const yearSummary=document.getElementById('yearSummary');
  if(!yearView||!yearSummary)return;

  const style=document.createElement('style');
  style.textContent=`
    .fp-card{margin-bottom:12px}
    .fp-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px}
    .fp-title{font-size:18px;font-weight:900;color:var(--text)}
    .fp-sub{font-size:11px;color:var(--muted);line-height:1.4;margin-top:3px}
    .fp-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}
    .fp-section{border-top:1px solid #e2e8f0;padding-top:13px;margin-top:13px}
    .fp-section-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:9px}
    .fp-section-head b{font-size:14px}
    .fp-reset{padding:7px 9px;font-size:11px;box-shadow:none}
    .fp-job,.fp-line{border:1px solid #e2e8f0;border-radius:14px;padding:11px;margin-top:8px;background:#fff}
    .fp-job-top,.fp-line-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .fp-check-label{display:flex;align-items:flex-start;gap:9px;min-width:0;font-weight:800;color:var(--text)}
    .fp-check-label input{width:auto;min-width:auto;margin-top:2px}
    .fp-suggestion{font-size:10px;color:var(--muted);margin-top:3px;line-height:1.35;font-weight:400}
    .fp-job-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}
    .fp-line-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}
    .fp-job-grid label,.fp-line-grid label{font-size:10px}
    .fp-job-grid input,.fp-line-grid input{padding:9px 8px}
    .fp-job-pay{font-size:12px;font-weight:900;white-space:nowrap}
    .fp-disabled{opacity:.48}
    .fp-extra-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
    .fp-results{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}
    .fp-result{border:1px solid #e2e8f0;background:#f8fafc;border-radius:13px;padding:10px;min-width:0}
    .fp-result span{display:block;color:var(--muted);font-size:10px}
    .fp-result b{display:block;font-size:15px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .fp-positive{color:#16a34a}.fp-negative{color:#dc2626}
    .fp-scenarios{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
    .fp-scenario{border:1px solid #e2e8f0;border-radius:13px;padding:10px;background:#f8fafc}
    .fp-scenario.real{background:#fff;border-color:#94a3b8}
    .fp-scenario-name{font-size:10px;font-weight:800;color:var(--muted)}
    .fp-scenario b{display:block;font-size:16px;margin-top:3px}
    .fp-scenario .tiny{margin-top:3px}
    .fp-breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 14px;margin-top:10px}
    .fp-breakdown-row{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--muted)}
    .fp-breakdown-row b{color:var(--text);text-align:right}
    .fp-empty{border:1px dashed #cbd5e1;border-radius:12px;padding:10px;color:var(--muted);font-size:11px;margin-top:8px}
    .fp-path{border-top:1px solid #e2e8f0;margin-top:13px;padding-top:12px}
    .fp-bars{display:grid;grid-template-columns:repeat(12,minmax(18px,1fr));align-items:end;gap:4px;height:115px;margin-top:9px;padding-bottom:18px}
    .fp-bar-wrap{height:100%;position:relative;display:flex;align-items:flex-end}
    .fp-bar{width:100%;min-height:3px;border-radius:6px 6px 2px 2px;background:#cbd5e1}
    .fp-bar.pos{background:#86efac}.fp-bar.neg{background:#fca5a5}
    .fp-bar-label{position:absolute;bottom:-17px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--muted)}
    @media(max-width:620px){
      .fp-top,.fp-extra-grid{grid-template-columns:1fr}
      .fp-job-grid{grid-template-columns:1fr 1fr}
      .fp-line-grid{grid-template-columns:1fr 1fr}
      .fp-results{grid-template-columns:1fr 1fr}
      .fp-scenarios{grid-template-columns:1fr}
      .fp-breakdown{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  const section=document.createElement('div');
  section.className='card fp-card';
  section.id='futurePlanCard';
  section.innerHTML=`
    <div class="fp-title-row">
      <div><div class="fp-title">Zukunftsplanung</div><div class="fp-sub">Du bestimmst Jobs, Stunden und Ausgaben. Die App schlägt dir Werte aus deinen bisherigen Daten vor.</div></div>
      <span class="tag" id="fpDataBadge">6 Monate</span>
    </div>
    <div class="fp-top">
      <div><label>Planungsjahr</label><input type="number" id="fpYear" min="2026" max="2100" step="1" inputmode="numeric"></div>
      <div><label>Vorschläge aus</label><select id="fpWindow"><option value="6">letzten 6 vollständigen Monaten</option><option value="12">letzten 12 vollständigen Monaten</option></select></div>
    </div>
    <div class="fp-section">
      <div class="fp-section-head"><div><b>1. Arbeit planen</b><div class="fp-sub">Wähle nur die Jobs, die du im Planungsjahr wirklich erwartest.</div></div><button type="button" class="fp-reset" id="fpResetJobs">Vorschläge übernehmen</button></div>
      <div id="fpJobs"></div>
    </div>
    <div class="fp-section">
      <div class="fp-section-head"><div><b>2. Sonstige Einnahmen</b><div class="fp-sub">Zum Beispiel Wohngeld oder andere wiederkehrende Einnahmen aus deinen bisherigen Einträgen.</div></div><button type="button" class="fp-reset" id="fpResetIncome">Vorschläge übernehmen</button></div>
      <div id="fpOtherIncome"></div>
      <div class="fp-extra-grid"><div><label>Zusätzliche Einnahmen im Jahr €</label><input type="number" id="fpExtraAnnualIncome" min="0" step="10" value="0"></div></div>
    </div>
    <div class="fp-section">
      <div class="fp-section-head"><div><b>3. Ausgaben planen</b><div class="fp-sub">Betrag und Häufigkeit werden aus deinen bisherigen Ausgaben vorgeschlagen, bleiben aber komplett editierbar.</div></div><button type="button" class="fp-reset" id="fpResetExpenses">Vorschläge übernehmen</button></div>
      <div id="fpExpenses"></div>
      <div class="fp-extra-grid">
        <div><label>Zusätzliche geplante Ausgaben im Jahr €</label><input type="number" id="fpExtraAnnualExpense" min="0" step="10" value="0"></div>
        <div><label>Sicherheitspuffer auf Ausgaben %</label><input type="number" id="fpExpenseBuffer" min="0" max="50" step="1" value="5"></div>
      </div>
    </div>
    <div id="fpResults"></div>`;
  yearSummary.parentNode.insertBefore(section,yearSummary);

  const yearInput=document.getElementById('fpYear');
  const windowInput=document.getElementById('fpWindow');
  const jobsBox=document.getElementById('fpJobs');
  const otherIncomeBox=document.getElementById('fpOtherIncome');
  const expensesBox=document.getElementById('fpExpenses');
  const resultsBox=document.getElementById('fpResults');
  const dataBadge=document.getElementById('fpDataBadge');
  const extraAnnualIncomeInput=document.getElementById('fpExtraAnnualIncome');
  const extraAnnualExpenseInput=document.getElementById('fpExtraAnnualExpense');
  const expenseBufferInput=document.getElementById('fpExpenseBuffer');

  let currentModel=null;
  let plan=loadPlan();

  function loadPlan(){
    try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{}}catch(_){return{}}
  }
  function persistPlan(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(plan))}
  function avg(a){return a.length?a.reduce((s,x)=>s+Number(x||0),0)/a.length:0}
  function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0))}
  function ym(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function addMonthKey(key,delta){const [y,m]=key.split('-').map(Number);return ym(new Date(y,m-1+delta,1))}
  function previousCompleteMonth(){const d=new Date();return ym(new Date(d.getFullYear(),d.getMonth()-1,1))}
  function earliestDataMonth(){
    const a=[];(state.events||[]).forEach(e=>e?.date&&a.push(String(e.date).slice(0,7)));(state.finance||[]).forEach(x=>x?.month&&a.push(String(x.month).slice(0,7)));
    return a.filter(x=>/^\d{4}-\d{2}$/.test(x)).sort()[0]||previousCompleteMonth();
  }
  function historyMonths(count){
    const last=previousCompleteMonth(),first=earliestDataMonth(),out=[];
    for(let i=count-1;i>=0;i--){const k=addMonthKey(last,-i);if(k>=first)out.push(k)}
    return out;
  }
  function eventHoursForMonth(type,month){return (state.events||[]).filter(e=>e.type===type&&String(e.date||'').startsWith(month)).reduce((s,e)=>s+hours(e),0)}
  function bibPayForWorkMonth(month){
    const total=eventHoursForMonth('Bib',month);if(!total)return 0;
    const mini=Math.min(total,Math.max(0,Number(state.bibMiniByWorkMonth?.[month]||0)));
    return (total-mini)*11+mini*15.15;
  }
  function extraEventPay(e){
    const h=hours(e),rate=Number(e.customHourlyRate||0),base=h*rate;
    const sup=Number(e.nightHours||0)*rate*(Number(e.customNightPct||0)/100)+Number(e.sundayHours||0)*rate*(Number(e.customSundayPct||0)/100)+Number(e.holidayHours||0)*rate*(Number(e.customHolidayPct||0)/100);
    return base*(1-clamp(Number(e.customDeductionPct||0),0,100)/100)+sup+Number(e.customFixedBonus||0);
  }
  function jobSuggestion(type,months){
    const hs=months.map(m=>eventHoursForMonth(type,m));
    const active=hs.filter(x=>x>0),activeCount=active.length;
    const hoursActive=avg(active);
    const monthsYear=activeCount?clamp(Math.round(activeCount/months.length*12),1,12):12;
    let effectiveRate=0,detail='';
    if(type==='VMT'){
      const rate=Number(payrollForPaymentMonth(monthKey(new Date())).vmtHourlyRate||16);
      effectiveRate=rate*.91;
      detail=`${money(rate)}/Std. · 9% Abzug + 63 € Fahrtkosten je aktivem Monat`;
    }else if(type==='Bib'){
      let th=0,tp=0;months.forEach(m=>{const h=eventHoursForMonth('Bib',m);th+=h;tp+=bibPayForWorkMonth(m)});
      effectiveRate=th?tp/th:11;
      detail=`Ø effektiv ${money(effectiveRate)}/Std. aus deinen Bib-Daten`;
    }else if(type==='Brunner'){
      let th=0,tp=0;months.forEach(m=>{const b=brunnerForWorkMonth(m);th+=Number(b.worked||0);tp+=Number(b.total||0)});
      effectiveRate=th?tp/th:15.5;
      detail=`Ø effektiv ${money(effectiveRate)}/Std. inkl. deiner bisherigen Zuschläge`;
    }else{
      let th=0,tp=0;months.forEach(m=>{const ev=(state.events||[]).filter(e=>e.type==='Zusatzjob'&&String(e.date||'').startsWith(m));th+=ev.reduce((s,e)=>s+hours(e),0);tp+=ev.reduce((s,e)=>s+extraEventPay(e),0)});
      effectiveRate=th?tp/th:15;
      detail=`Ø effektiv ${money(effectiveRate)}/Std. aus Zusatzjob-Daten`;
    }
    return {type,hours:Number(hoursActive.toFixed(1)),extra:0,months:monthsYear,rate:effectiveRate,activeCount,detail,enabled:activeCount>0};
  }
  function groupedFinance(months,type){
    const map=new Map();
    months.forEach(month=>{
      const monthTotals=new Map();
      (state.finance||[]).filter(x=>x.type===type&&x.month===month).forEach(x=>{
        if(type==='income'&&typeof employerFromName==='function'&&employerFromName(x.name))return;
        const key=normName(x.name);if(!key)return;
        if(!map.has(key))map.set(key,{key,name:x.name,monthTotals:new Map(),series:false,account:x.account||''});
        const g=map.get(key);g.series=g.series||!!x.seriesId;g.monthTotals.set(month,(g.monthTotals.get(month)||0)+Number(x.amount||0));
      });
    });
    return [...map.values()].map(g=>{
      const vals=[...g.monthTotals.values()],count=vals.length;
      const amount=avg(vals),frequency=count/months.length,monthsYear=clamp(Math.round(frequency*12),1,12);
      return {...g,amount:Number(amount.toFixed(2)),monthsYear,count,frequency,total:vals.reduce((a,b)=>a+b,0)};
    }).sort((a,b)=>(b.frequency-a.frequency)||(b.total-a.total));
  }
  function buildModel(){
    const count=Number(windowInput.value||6),months=historyMonths(count);
    return {months,jobs:['VMT','Bib','Brunner','Zusatzjob'].map(t=>jobSuggestion(t,months)),income:groupedFinance(months,'income'),expenses:groupedFinance(months,'expense')};
  }
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function jobName(t){return t==='Zusatzjob'?'Zusatzjob':t}
  function initialJobConfig(s){return {enabled:s.enabled,hours:s.hours,extra:0,months:s.months}}
  function initialLineConfig(x,kind){
    const recurring=x.series||x.count>=Math.max(2,Math.ceil(currentModel.months.length/2));
    return {enabled:kind==='expense'?recurring:recurring,amount:x.amount,months:x.monthsYear};
  }
  function ensurePlanDefaults(forceJobs=false,forceIncome=false,forceExpenses=false){
    plan.jobs=plan.jobs||{};plan.income=plan.income||{};plan.expenses=plan.expenses||{};
    currentModel.jobs.forEach(s=>{if(forceJobs||!plan.jobs[s.type])plan.jobs[s.type]=initialJobConfig(s)});
    currentModel.income.forEach(x=>{if(forceIncome||!plan.income[x.key])plan.income[x.key]=initialLineConfig(x,'income')});
    currentModel.expenses.forEach(x=>{if(forceExpenses||!plan.expenses[x.key])plan.expenses[x.key]=initialLineConfig(x,'expense')});
    if(!Number.isFinite(Number(plan.extraAnnualIncome)))plan.extraAnnualIncome=0;
    if(!Number.isFinite(Number(plan.extraAnnualExpense)))plan.extraAnnualExpense=0;
    if(!Number.isFinite(Number(plan.expenseBuffer)))plan.expenseBuffer=5;
  }
  function renderJobs(){
    jobsBox.innerHTML=currentModel.jobs.map((s,i)=>{
      const c=plan.jobs[s.type]||initialJobConfig(s),disabled=!c.enabled;
      return `<div class="fp-job${disabled?' fp-disabled':''}" data-job="${s.type}">
        <div class="fp-job-top"><label class="fp-check-label"><input type="checkbox" class="fp-job-enabled" ${c.enabled?'checked':''}><div>${jobName(s.type)}<div class="fp-suggestion">Vorschlag: ${s.activeCount?`${s.hours.toFixed(1)} Std./aktivem Monat · ca. ${s.months} Monate/Jahr`:'keine Arbeitsdaten im Zeitraum'}<br>${s.detail}</div></div></label><span class="fp-job-pay" data-job-pay>0,00 €</span></div>
        <div class="fp-job-grid">
          <div><label>Grundstunden / Monat</label><input class="fp-job-hours" type="number" min="0" max="300" step="0.5" value="${Number(c.hours||0)}"></div>
          <div><label>Zusatzstunden / Monat</label><input class="fp-job-extra" type="number" min="0" max="300" step="0.5" value="${Number(c.extra||0)}"></div>
          <div><label>Aktive Monate / Jahr</label><input class="fp-job-months" type="number" min="0" max="12" step="1" value="${clamp(c.months,0,12)}"></div>
        </div>
      </div>`;
    }).join('');
  }
  function renderLines(box,items,configs,kind){
    if(!items.length){box.innerHTML='<div class="fp-empty">Keine passenden historischen Einträge gefunden.</div>';return}
    box.innerHTML=items.map((x,i)=>{
      const c=configs[x.key]||initialLineConfig(x,kind),disabled=!c.enabled;
      return `<div class="fp-line${disabled?' fp-disabled':''}" data-${kind}-index="${i}">
        <div class="fp-line-top"><label class="fp-check-label"><input type="checkbox" class="fp-line-enabled" ${c.enabled?'checked':''}><div>${esc(x.name)}<div class="fp-suggestion">Vorschlag: ${money(x.amount)} · ca. ${x.monthsYear}×/Jahr${x.series?' · wiederkehrend':''}</div></div></label><span class="fp-job-pay" data-line-pay>0,00 €</span></div>
        <div class="fp-line-grid"><div><label>Betrag pro Auftreten €</label><input class="fp-line-amount" type="number" min="0" step="1" value="${Number(c.amount||0)}"></div><div><label>Wie oft im Jahr?</label><input class="fp-line-months" type="number" min="0" max="12" step="1" value="${clamp(c.months,0,12)}"></div></div>
      </div>`;
    }).join('');
  }
  function renderPlanner(){
    currentModel=buildModel();ensurePlanDefaults();dataBadge.textContent=`${currentModel.months.length} ${currentModel.months.length===1?'Monat':'Monate'}`;
    renderJobs();renderLines(otherIncomeBox,currentModel.income,plan.income,'income');renderLines(expensesBox,currentModel.expenses,plan.expenses,'expense');
    extraAnnualIncomeInput.value=Number(plan.extraAnnualIncome||0);extraAnnualExpenseInput.value=Number(plan.extraAnnualExpense||0);expenseBufferInput.value=Number(plan.expenseBuffer||0);
    bindPlannerInputs();calculate();
  }
  function syncPlanFromDOM(){
    jobsBox.querySelectorAll('.fp-job').forEach(row=>{const k=row.dataset.job;plan.jobs[k]={enabled:row.querySelector('.fp-job-enabled').checked,hours:clamp(row.querySelector('.fp-job-hours').value,0,300),extra:clamp(row.querySelector('.fp-job-extra').value,0,300),months:clamp(row.querySelector('.fp-job-months').value,0,12)}});
    otherIncomeBox.querySelectorAll('.fp-line').forEach(row=>{const x=currentModel.income[Number(row.dataset.incomeIndex)];if(x)plan.income[x.key]={enabled:row.querySelector('.fp-line-enabled').checked,amount:clamp(row.querySelector('.fp-line-amount').value,0,100000),months:clamp(row.querySelector('.fp-line-months').value,0,12)}});
    expensesBox.querySelectorAll('.fp-line').forEach(row=>{const x=currentModel.expenses[Number(row.dataset.expenseIndex)];if(x)plan.expenses[x.key]={enabled:row.querySelector('.fp-line-enabled').checked,amount:clamp(row.querySelector('.fp-line-amount').value,0,100000),months:clamp(row.querySelector('.fp-line-months').value,0,12)}});
    plan.extraAnnualIncome=clamp(extraAnnualIncomeInput.value,0,1000000);plan.extraAnnualExpense=clamp(extraAnnualExpenseInput.value,0,1000000);plan.expenseBuffer=clamp(expenseBufferInput.value,0,50);plan.year=clamp(yearInput.value,2026,2100);plan.window=Number(windowInput.value||6);persistPlan();
  }
  function annualJobPay(s,c){
    if(!c?.enabled)return 0;const h=Number(c.hours||0)+Number(c.extra||0),m=clamp(c.months,0,12);if(h<=0||m<=0)return 0;
    if(s.type==='VMT'){
      const currentRate=Number(payrollForPaymentMonth(monthKey(new Date())).vmtHourlyRate||16);
      return m*(h*currentRate*.91+63);
    }
    return m*h*Number(s.rate||0);
  }
  function calculate(){
    syncPlanFromDOM();
    let jobsAnnual=0,totalHours=0;
    currentModel.jobs.forEach(s=>{const c=plan.jobs[s.type],v=annualJobPay(s,c);jobsAnnual+=v;if(c?.enabled)totalHours+=(Number(c.hours||0)+Number(c.extra||0))*Number(c.months||0);const row=jobsBox.querySelector(`[data-job="${s.type}"]`);if(row){row.classList.toggle('fp-disabled',!c?.enabled);const pay=row.querySelector('[data-job-pay]');if(pay)pay.textContent=money(v)}});
    let otherAnnual=0;otherIncomeBox.querySelectorAll('.fp-line').forEach(row=>{const x=currentModel.income[Number(row.dataset.incomeIndex)],c=x?plan.income[x.key]:null,v=c?.enabled?Number(c.amount||0)*Number(c.months||0):0;otherAnnual+=v;row.classList.toggle('fp-disabled',!c?.enabled);const pay=row.querySelector('[data-line-pay]');if(pay)pay.textContent=money(v)});
    let expenseAnnual=0;expensesBox.querySelectorAll('.fp-line').forEach(row=>{const x=currentModel.expenses[Number(row.dataset.expenseIndex)],c=x?plan.expenses[x.key]:null,v=c?.enabled?Number(c.amount||0)*Number(c.months||0):0;expenseAnnual+=v;row.classList.toggle('fp-disabled',!c?.enabled);const pay=row.querySelector('[data-line-pay]');if(pay)pay.textContent=money(v)});
    const annualIncome=jobsAnnual+otherAnnual+Number(plan.extraAnnualIncome||0);
    const expenseBeforeBuffer=expenseAnnual+Number(plan.extraAnnualExpense||0);
    const annualExpense=expenseBeforeBuffer*(1+Number(plan.expenseBuffer||0)/100);
    const saving=annualIncome-annualExpense,monthly=saving/12,savingRate=annualIncome>0?saving/annualIncome*100:0;
    const cautious={income:annualIncome*.95,expense:annualExpense*1.05};cautious.saving=cautious.income-cautious.expense;
    const optimistic={income:annualIncome*1.05,expense:annualExpense*.97};optimistic.saving=optimistic.income-optimistic.expense;
    const scenario=(name,x,cls='')=>`<div class="fp-scenario ${cls}"><div class="fp-scenario-name">${name}</div><b class="${x.saving>=0?'fp-positive':'fp-negative'}">${money(x.saving)}</b><div class="tiny">Einkommen ${money(x.income)} · Ausgaben ${money(x.expense)}</div></div>`;
    const monthlyCum=Array.from({length:12},(_,i)=>monthly*(i+1)),maxAbs=Math.max(1,...monthlyCum.map(Math.abs)),labels=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const bars=monthlyCum.map((v,i)=>`<div class="fp-bar-wrap" title="${labels[i]}: ${money(v)}"><div class="fp-bar ${v>=0?'pos':'neg'}" style="height:${Math.max(3,Math.round(Math.abs(v)/maxAbs*100))}%"></div><span class="fp-bar-label">${labels[i]}</span></div>`).join('');
    resultsBox.innerHTML=`
      <div class="fp-section"><div class="fp-section-head"><div><b>Dein Plan ${Math.trunc(Number(plan.year)||new Date().getFullYear()+1)}</b><div class="fp-sub">Die mittlere Variante entspricht exakt deinen Eingaben.</div></div></div>
        <div class="fp-results">
          <div class="fp-result"><span>Einkommen / Jahr</span><b>${money(annualIncome)}</b></div>
          <div class="fp-result"><span>Ausgaben / Jahr</span><b>${money(annualExpense)}</b></div>
          <div class="fp-result"><span>Ersparnis / Jahr</span><b class="${saving>=0?'fp-positive':'fp-negative'}">${money(saving)}</b></div>
          <div class="fp-result"><span>Ø Sparen / Monat</span><b class="${monthly>=0?'fp-positive':'fp-negative'}">${money(monthly)}</b></div>
        </div>
        <div class="fp-scenarios">${scenario('Vorsichtig',cautious)}${scenario('Dein Plan',{income:annualIncome,expense:annualExpense,saving},'real')}${scenario('Optimistisch',optimistic)}</div>
        <div class="fp-breakdown">
          <div class="fp-breakdown-row"><span>Arbeitseinkommen</span><b>${money(jobsAnnual)}</b></div>
          <div class="fp-breakdown-row"><span>Sonstige Einnahmen</span><b>${money(otherAnnual+Number(plan.extraAnnualIncome||0))}</b></div>
          <div class="fp-breakdown-row"><span>Geplante Arbeitsstunden</span><b>${totalHours.toFixed(1)} Std./Jahr</b></div>
          <div class="fp-breakdown-row"><span>Ausgaben vor Puffer</span><b>${money(expenseBeforeBuffer)}</b></div>
          <div class="fp-breakdown-row"><span>Sicherheitspuffer</span><b>+${Number(plan.expenseBuffer||0).toFixed(0)}%</b></div>
          <div class="fp-breakdown-row"><span>Sparquote</span><b class="${savingRate>=0?'fp-positive':'fp-negative'}">${savingRate.toFixed(1)}%</b></div>
        </div>
        <div class="fp-path"><b>Voraussichtlicher Sparverlauf</b><div class="fp-bars">${bars}</div></div>
        <div class="fp-sub" style="margin-top:9px">Vorsichtig: 5% weniger Einkommen und 5% mehr Ausgaben. Optimistisch: 5% mehr Einkommen und 3% weniger Ausgaben. Diese Bandbreite dient nur als Sicherheitsrahmen; „Dein Plan“ basiert direkt auf deinen Eingaben.</div>
      </div>`;
  }
  function bindPlannerInputs(){
    section.querySelectorAll('#fpJobs input,#fpOtherIncome input,#fpExpenses input,#fpExtraAnnualIncome,#fpExtraAnnualExpense,#fpExpenseBuffer').forEach(el=>{el.addEventListener('input',calculate);el.addEventListener('change',calculate)});
  }

  const nextYear=new Date().getFullYear()+1;
  yearInput.value=String(clamp(plan.year||nextYear,2026,2100));
  windowInput.value=['6','12'].includes(String(plan.window))?String(plan.window):'6';
  extraAnnualIncomeInput.value=Number(plan.extraAnnualIncome||0);extraAnnualExpenseInput.value=Number(plan.extraAnnualExpense||0);expenseBufferInput.value=Number.isFinite(Number(plan.expenseBuffer))?Number(plan.expenseBuffer):5;
  currentModel=buildModel();ensurePlanDefaults();renderPlanner();

  yearInput.addEventListener('change',calculate);
  windowInput.addEventListener('change',()=>{syncPlanFromDOM();currentModel=buildModel();ensurePlanDefaults();renderPlanner()});
  document.getElementById('fpResetJobs').onclick=()=>{syncPlanFromDOM();ensurePlanDefaults(true,false,false);renderPlanner()};
  document.getElementById('fpResetIncome').onclick=()=>{syncPlanFromDOM();ensurePlanDefaults(false,true,false);renderPlanner()};
  document.getElementById('fpResetExpenses').onclick=()=>{syncPlanFromDOM();ensurePlanDefaults(false,false,true);renderPlanner()};

  const previousRenderYearOverview=renderYearOverview;
  renderYearOverview=function(){previousRenderYearOverview();calculate()};
  yearBtn.addEventListener('click',calculate);
})();
