const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n||0));
const pad=n=>String(n).padStart(2,'0'),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const parseDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)},addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,1),uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const mondayOf=d=>{const x=new Date(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x};
const dateFmt=d=>new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(d),shortDate=d=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit'}).format(d);
const styles={VMT:['#2563eb','#fff'],Bib:['#16a34a','#fff'],Brunner:['#7c3aed','#fff'],Zusatzjob:['#0f766e','#fff'],Fitnessstudio:['#06b6d4','#083344'],Fahrschule:['#f97316','#fff'],Urlaub:['#eab308','#422006'],Sonstiges:['#64748b','#fff']};
const STATE_KEY='wesamPlannerV3',AUTO_BACKUP_KEY='wesamPlannerAutoBackup',DATA_SCHEMA_VERSION=8;
let raw=JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{events:[],finance:[],goals:[],bibMiniByWorkMonth:{}};
function normName(v){return String(v||'').trim().toLocaleLowerCase('de-DE')}
function monthRange(start,end){
  if(!start||!end||start>end)return [];
  const out=[];
  let d=parseDate(start+'-01'),last=parseDate(end+'-01');
  while(d<=last){out.push(monthKey(d));d=addMonths(d,1)}
  return out;
}
function normalizeState(input){const r=input&&typeof input==='object'?input:{};const out={schemaVersion:8,yearPlan:r.yearPlan&&typeof r.yearPlan==='object'?r.yearPlan:{},events:Array.isArray(r.events)?r.events:[],finance:Array.isArray(r.finance)?r.finance:[],goals:Array.isArray(r.goals)?r.goals:[],bibMiniByWorkMonth:r.bibMiniByWorkMonth&&typeof r.bibMiniByWorkMonth==='object'?r.bibMiniByWorkMonth:{}};out.events=out.events.map(e=>({id:e.id||uid(),date:e.date||iso(new Date()),type:e.type||'Sonstiges',start:e.start||'',end:e.end||'',paidHours:Number(e.paidHours||0),nightHours:Number(e.nightHours||0),sundayHours:Number(e.sundayHours||0),holidayHours:Number(e.holidayHours||0),note:e.note||'',bibMiniHours:Number(e.bibMiniHours||0),workConfirmedAt:e.workConfirmedAt||null,customJobName:e.customJobName||'',customHourlyRate:Number(e.customHourlyRate||0),customDeductionPct:Number(e.customDeductionPct||0),customNightPct:Number(e.customNightPct||0),customSundayPct:Number(e.customSundayPct||0),customHolidayPct:Number(e.customHolidayPct||0),customFixedBonus:Number(e.customFixedBonus||0),customPayoutMonth:e.customPayoutMonth||e.date?.slice(0,7)||monthKey(new Date())}));if(!Object.keys(out.bibMiniByWorkMonth).length){out.events.filter(e=>e.type==='Bib'&&e.bibMiniHours>0).forEach(e=>{const m=e.date.slice(0,7);out.bibMiniByWorkMonth[m]=Number(out.bibMiniByWorkMonth[m]||0)+e.bibMiniHours})}out.finance=out.finance.filter(x=>x&&x.type!=='saving'&&normName(x.name)!=='sparbetrag').map(x=>({id:x.id||uid(),month:x.month||monthKey(new Date()),type:x.type==='income'?'income':'expense',name:x.name||'Eintrag',amount:Number(x.amount||0),account:x.account||'Sparkasse',status:['unpaid','partial','paid'].includes(x.status)?x.status:(x.type==='expense'?'unpaid':'paid'),paidAmount:Number(x.paidAmount||0),seriesId:x.seriesId||null,seriesStart:x.seriesStart||null,seriesEnd:x.seriesEnd||null}));out.goals=out.goals.map((g,i)=>({id:g.id||uid(),name:g.name||'Sparziel',target:Number(g.target||0),order:Number.isFinite(Number(g.order))?Number(g.order):i})).sort((a,b)=>a.order-b.order).map((g,i)=>({...g,order:i}));return out}
let state=normalizeState(raw);
function save(){state=normalizeState(state);localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify({exportedAt:new Date().toISOString(),appVersion:'16.9',schemaVersion:8,state}));const x=document.getElementById('backupStatus');if(x)x.textContent=`Automatisch gespeichert: ${new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date())}`;window.wesamCloud?.scheduleUpload?.(state)}
function hours(e){if(Number(e.paidHours)>0)return Number(e.paidHours);if(!e.start||!e.end)return 0;const [sh,sm]=e.start.split(':').map(Number),[eh,em]=e.end.split(':').map(Number);let m=eh*60+em-sh*60-sm;if(m<0)m+=1440;return m/60}
function brunnerForWorkMonth(workMonth){const evAll=state.events.filter(e=>e.type==='Brunner');if(!evAll.length)return {worked:0,paidBase:0,carryIn:0,carry:0,night:0,sunday:0,holiday:0,total:0};const first=evAll.map(e=>e.date.slice(0,7)).sort()[0],target=parseDate(workMonth+'-01');if(target<parseDate(first+'-01'))return {worked:0,paidBase:0,carryIn:0,carry:0,night:0,sunday:0,holiday:0,total:0};let carry=0,res={worked:0,paidBase:0,carryIn:0,carry:0,night:0,sunday:0,holiday:0,total:0};for(let d=parseDate(first+'-01');d<=target;d=addMonths(d,1)){const mk=monthKey(d),ev=evAll.filter(e=>e.date.startsWith(mk)),worked=ev.reduce((s,e)=>s+hours(e),0),night=ev.reduce((s,e)=>s+e.nightHours,0),sunday=ev.reduce((s,e)=>s+e.sundayHours,0),holiday=ev.reduce((s,e)=>s+e.holidayHours,0),carryIn=carry,paidBase=Math.min(38,carryIn+worked);carry=Math.max(0,carryIn+worked-paidBase);if(mk===workMonth)res={worked,paidBase,carryIn,carry,night,sunday,holiday,total:paidBase*15.5+night*15.5*.15+sunday*15.5*.5+holiday*15.5}}return res}
function payrollForPaymentMonth(month){const [y,m]=month.split('-').map(Number),payDate=new Date(y,m-1,1),vmtStart=new Date(y,m-3,12),vmtEnd=new Date(y,m-2,11),vmtEvents=state.events.filter(e=>e.type==='VMT'&&parseDate(e.date)>=vmtStart&&parseDate(e.date)<=vmtEnd),vmtHours=vmtEvents.reduce((s,e)=>s+hours(e),0),vmtHourlyRate=month>='2026-10'?16:15,vmtNet=vmtHours*vmtHourlyRate*.91+(vmtHours?63:0),bibWorkMonth=monthKey(addMonths(payDate,-2)),bibTotal=state.events.filter(e=>e.type==='Bib'&&e.date.startsWith(bibWorkMonth)).reduce((s,e)=>s+hours(e),0),bibMini=Math.min(bibTotal,Math.max(0,Number(state.bibMiniByWorkMonth[bibWorkMonth]||0))),bibNormal=bibTotal-bibMini,bibPay=bibNormal*11+bibMini*15.15,brunnerWorkMonth=monthKey(addMonths(payDate,-1)),br=brunnerForWorkMonth(brunnerWorkMonth);return {vmtStart,vmtEnd,vmtHours,vmtHourlyRate,vmtNet,bibWorkMonth,bibTotal,bibMini,bibNormal,bibPay,brunnerWorkMonth,br,total:vmtNet+bibPay+br.total}}
function customJobPayForMonth(month){
 const events=state.events.filter(e=>e.type==='Zusatzjob'&&(e.customPayoutMonth||e.date.slice(0,7))===month);
 const items=events.map(e=>{
   const h=hours(e),rate=Number(e.customHourlyRate||0),base=h*rate;
   const supplements=Number(e.nightHours||0)*rate*(Number(e.customNightPct||0)/100)+Number(e.sundayHours||0)*rate*(Number(e.customSundayPct||0)/100)+Number(e.holidayHours||0)*rate*(Number(e.customHolidayPct||0)/100);
   const afterDeduction=base*(1-Math.min(100,Math.max(0,Number(e.customDeductionPct||0)))/100);
   return {event:e,name:e.customJobName||'Zusatzjob',workMonth:e.date.slice(0,7),payoutMonth:month,hours:h,rate,total:afterDeduction+supplements+Number(e.customFixedBonus||0)};
 });
 return {items,total:items.reduce((s,x)=>s+x.total,0)};
}
function automaticEmploymentIncome(month){const s=payrollForPaymentMonth(month),extra=customJobPayForMonth(month);return {VMT:s.vmtNet,Bib:s.bibPay,Brunner:s.br.total,Zusatzjob:extra.total}}
function employerFromName(n){n=normName(n);if(n.startsWith('vmt'))return'VMT';if(n.startsWith('bib')||n.startsWith('bibliothek'))return'Bib';if(n.startsWith('brunner'))return'Brunner';if(n.startsWith('zusatzjob'))return'Zusatzjob';return null}
function effectiveFinanceSummary(month){const rows=state.finance.filter(x=>x.month===month),automatic=automaticEmploymentIncome(month),visibleRows=rows.filter(x=>!(x.type==='income'&&employerFromName(x.name)&&automatic[employerFromName(x.name)]>0)),manualIncome=visibleRows.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0),expense=visibleRows.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0),automaticTotal=Object.values(automatic).reduce((s,x)=>s+Number(x||0),0),displayIncome=manualIncome+automaticTotal;return {rows:visibleRows,allRows:rows,automatic,manualIncome,expense,displayIncome,displayRemaining:displayIncome-expense}}
function knownMonths(year){const set=new Set(state.finance.map(x=>x.month).concat(state.events.map(x=>x.date.slice(0,7))));for(let m=1;m<=12;m++)set.add(`${year}-${pad(m)}`);return [...set].filter(x=>x.startsWith(year+'-')).sort()}
function allMonthsThrough(limit){
 const candidates=state.finance.map(x=>x.month).concat(state.events.map(x=>x.date.slice(0,7))).filter(Boolean);
 const earliest=candidates.length?candidates.sort()[0]:limit;
 const out=[];let d=parseDate(earliest+'-01'),last=parseDate(limit+'-01');
 while(d<=last){out.push(monthKey(d));d=addMonths(d,1)}
 return out;
}
function savingsUntil(month,includeFuture=false){
 const limit=includeFuture?`${month.slice(0,4)}-12`:month;
 return allMonthsThrough(limit).reduce((s,m)=>s+effectiveFinanceSummary(m).displayRemaining,0);
}
function goalStats(untilMonth){let pool=Math.max(0,savingsUntil(untilMonth,false));return state.goals.sort((a,b)=>a.order-b.order).map(g=>{const paidRaw=state.finance.filter(x=>x.type==='expense'&&x.month<=untilMonth&&normName(x.name)===normName(g.name)).reduce((s,x)=>s+(x.status==='paid'?x.amount:x.status==='partial'?Math.min(x.amount,x.paidAmount):0),0),paid=Math.min(g.target,paidRaw),remaining=Math.max(0,g.target-paid),saved=Math.min(remaining,pool);pool=Math.max(0,pool-saved);return {...g,saved,paid,progress:Math.min(g.target,paid+saved)}})}
let selectedDate=new Date(),calendarMode='month',currentMonth=monthKey(new Date()),activeFinanceMonth=currentMonth,salaryMonth=currentMonth,goalMonth=currentMonth,selectedMultiDates=new Set();
function showScreen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('[data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===id))}
document.querySelectorAll('[data-screen]').forEach(x=>x.onclick=()=>showScreen(x.dataset.screen));
function renderCalendarViews(){const title=document.getElementById('calendarTitle'),label=document.getElementById('periodLabel'),day=document.getElementById('dayView'),week=document.getElementById('weekGrid'),month=document.getElementById('monthView');day.style.display=week.style.display=month.style.display='none';const eventHtml=e=>{const [bg,fg]=styles[e.type]||styles.Sonstiges;return `<div class="event" data-id="${e.id}" style="background:${bg};color:${fg}"><div><strong>${e.type==='Zusatzjob'?(e.customJobName||'Zusatzjob'):e.type}</strong><div class="event-note">${e.note||''}</div></div><div class="event-time">${e.start?`${e.start}–${e.end}`:'Ganztägig'}</div></div>`};if(calendarMode==='day'){title.textContent='Tagesansicht';label.textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(selectedDate);day.style.display='block';const ds=iso(selectedDate),ev=state.events.filter(e=>e.date===ds).sort((a,b)=>a.start.localeCompare(b.start));day.innerHTML=`<div class="day-detail"><div class="day-title"><b>${dateFmt(selectedDate)}</b><button class="add-day" data-date="${ds}">+</button></div>${ev.length?ev.map(eventHtml).join(''):'<div class="tiny">Keine Termine</div>'}</div>`}else if(calendarMode==='week'){title.textContent='Wochenansicht';const start=mondayOf(selectedDate),end=new Date(start);end.setDate(end.getDate()+6);label.textContent=`${shortDate(start)} – ${shortDate(end)}`;week.style.display='grid';week.innerHTML='';for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d),ev=state.events.filter(e=>e.date===ds).sort((a,b)=>a.start.localeCompare(b.start));week.insertAdjacentHTML('beforeend',`<div class="day-card${iso(new Date())===ds?' today':''}"><div class="day-title"><b>${dateFmt(d)}</b><button class="add-day" data-date="${ds}">+</button></div>${ev.length?ev.map(eventHtml).join(''):'<div class="tiny">Keine Termine</div>'}</div>`)}}else{title.textContent='Monatsansicht';const first=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1),start=mondayOf(first);label.textContent=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(first);month.style.display='block';let html='<div class="month-grid">'+['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<div class="month-weekday">${x}</div>`).join('');for(let i=0;i<42;i++){const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d),ev=state.events.filter(e=>e.date===ds).sort((a,b)=>a.start.localeCompare(b.start)),pills=ev.slice(0,3).map(e=>{const [bg,fg]=styles[e.type]||styles.Sonstiges;return `<div class="month-event" data-id="${e.id}" style="background:${bg};color:${fg}">${e.start?e.start+' ':''}${e.type==='Zusatzjob'?(e.customJobName||'Zusatzjob'):e.type}</div>`}).join('');html+=`<div class="month-day${d.getMonth()!==first.getMonth()?' outside':''}${iso(new Date())===ds?' today':''}" data-date="${ds}"><div class="month-day-number">${d.getDate()}</div>${pills}${ev.length>3?`<div class="tiny">+${ev.length-3} weitere</div>`:''}</div>`}month.innerHTML=html+'</div>'}document.querySelectorAll('.event,.month-event').forEach(x=>x.onclick=e=>{e.stopPropagation();openEvent(x.dataset.id)});document.querySelectorAll('.add-day').forEach(x=>x.onclick=e=>{e.stopPropagation();openEvent(null,x.dataset.date)});document.querySelectorAll('.month-day').forEach(x=>x.onclick=()=>{selectedDate=parseDate(x.dataset.date);currentMonth=monthKey(selectedDate);calendarMode='day';renderAll()})}
function syncModeButtons(){document.querySelectorAll('#calendarMode [data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===calendarMode))}
function renderSalary(){const s=payrollForPaymentMonth(salaryMonth),extra=customJobPayForMonth(salaryMonth);document.getElementById('salaryMonthPicker').value=salaryMonth;const extraHtml=extra.items.length?`<div class="row"><div style="flex:1"><b>Zusatzjob</b>${extra.items.map(x=>`<div class="tiny">${x.name} · ${x.hours.toFixed(2)} Std. · ${money(x.total)}</div>`).join('')}</div><div class="amount">${money(extra.total)}</div></div>`:'';document.getElementById('salaryDetails').innerHTML=`<div class="row"><div><b>VMT</b><div class="tiny">${iso(s.vmtStart)} bis ${iso(s.vmtEnd)} · ${s.vmtHours.toFixed(2)} Std. × ${money(s.vmtHourlyRate)} · inkl. 63,00 € Fahrtkosten</div></div><div class="amount">${money(s.vmtNet)}</div></div><div class="row"><div style="flex:1"><b>Bib</b><div class="tiny">Arbeitsmonat ${s.bibWorkMonth} · Gesamt ${s.bibTotal.toFixed(2)} Std.</div><div style="max-width:230px;margin-top:8px"><label>Davon Bib mini</label><input id="bibMiniSalaryInput" type="number" step="0.25" min="0" max="${s.bibTotal}" value="${s.bibMini}"></div><div class="tiny">Normal ${s.bibNormal.toFixed(2)} Std. · Mini ${s.bibMini.toFixed(2)} Std.</div></div><div class="amount">${money(s.bibPay)}</div></div><div class="row"><div><b>Brunner</b><div class="tiny">Arbeitsmonat ${s.brunnerWorkMonth} · Gearbeitet ${s.br.worked.toFixed(2)} Std. · Übertrag rein ${s.br.carryIn.toFixed(2)} Std.</div><div class="tiny">Bezahlt ${s.br.paidBase.toFixed(2)} Std. · Übertrag raus ${s.br.carry.toFixed(2)} Std.</div><div class="tiny">Nacht ${s.br.night} · Sonntag ${s.br.sunday} · Feiertag ${s.br.holiday}</div></div><div class="amount">${money(s.br.total)}</div></div>${extraHtml}<div class="row"><b>Berechnetes Gesamtgehalt</b><div class="metric">${money(s.total+extra.total)}</div></div>`;document.getElementById('bibMiniSalaryInput').onchange=e=>{state.bibMiniByWorkMonth[s.bibWorkMonth]=Math.min(s.bibTotal,Math.max(0,Number(e.target.value||0)));renderAll()}}
function paidLabel(x){return x.status==='paid'?'Vollständig bezahlt':x.status==='partial'?`Teilweise bezahlt (${money(x.paidAmount)})`:'Nicht bezahlt'}
function renderFinance(){
 const f=effectiveFinanceSummary(activeFinanceMonth);
 document.getElementById('financeMonthPicker').value=activeFinanceMonth;
 document.getElementById('goalMonthPicker').value=goalMonth;
 const auto=Object.entries(f.automatic).filter(([,a])=>a>0).map(([n,a])=>`<div class="row"><div>${n}<div class="tiny">Automatisch aus Kalender und Gehalt</div></div><span class="amount">${money(a)}</span></div>`).join(''),
 income=f.rows.filter(x=>x.type==='income').map(x=>`<div class="row finance-row" data-id="${x.id}"><span>${x.name}</span><span class="amount">${money(x.amount)}</span></div>`).join(''),
 expenses=f.rows.filter(x=>x.type==='expense').map(x=>`<div class="row finance-row ${x.status!=='unpaid'?'expense-paid':''}" data-id="${x.id}"><div><span>${x.name}</span><div class="tiny">${x.account} · ${paidLabel(x)}${x.seriesId?' · Wiederkehrend':''}</div></div><span class="amount">${money(x.amount)}</span></div>`).join(''),
 remClass=f.displayRemaining>0?'positive':f.displayRemaining<0?'negative':'';
 document.getElementById('financeList').innerHTML=`<div class="row"><b>Einnahmen gesamt</b><span class="amount positive">${money(f.displayIncome)}</span></div>${auto}${income}<div class="row"><b>Ausgaben</b><span class="amount negative">${money(f.expense)}</span></div>${expenses}<div class="row"><div><b>In diesem Monat gespart</b><div class="tiny">Automatisch: Einnahmen minus Ausgaben</div></div><span class="amount ${remClass}">${money(f.displayRemaining)}</span></div>`;
 document.querySelectorAll('.finance-row').forEach(x=>x.onclick=()=>openFinance(x.dataset.id));

 const stats=goalStats(goalMonth),todayMonth=monthKey(new Date()),future=goalMonth>todayMonth;
 document.getElementById('goalProjectionHint').textContent=future?`Prognose bis ${goalMonth}: berücksichtigt bereits geplante Einnahmen, Ausgaben und Arbeitszeiten.`:`Stand bis einschließlich ${goalMonth}. Der verfügbare Sparbetrag wird automatisch nach Priorität verteilt.`;
 document.getElementById('goalList').innerHTML=stats.map((g,i)=>{
   const ps=Math.min(100,g.progress/Math.max(1,g.target)*100),pp=Math.min(100,g.paid/Math.max(1,g.target)*100);
   return `<div class="goal-block" data-id="${g.id}"><div class="goal-head"><div><b>${i+1}. ${g.name}</b><div class="tiny">Ziel ${money(g.target)}</div></div><div class="goal-controls"><button class="icon goal-up" data-id="${g.id}" ${i===0?'disabled':''}>↑</button><button class="icon goal-down" data-id="${g.id}" ${i===stats.length-1?'disabled':''}>↓</button><button class="icon goal-edit" data-id="${g.id}">✎</button></div></div><div class="bar-label"><span>${future?'Voraussichtlich gespart':'Gespart'}</span><span>${money(g.progress)} / ${money(g.target)}</span></div><div class="progress"><span style="width:${ps}%"></span></div><div class="tiny">Davon noch verfügbar: ${money(g.saved)}</div><div class="bar-label"><span>Bezahlt</span><span>${money(g.paid)} / ${money(g.target)}</span></div><div class="progress paid"><span style="width:${pp}%"></span></div></div>`;
 }).join('')||'<div class="tiny">Noch keine Sparziele.</div>';
 document.querySelectorAll('.goal-edit').forEach(x=>x.onclick=()=>openGoal(x.dataset.id));
 document.querySelectorAll('.goal-up').forEach(x=>x.onclick=()=>moveGoal(x.dataset.id,-1));
 document.querySelectorAll('.goal-down').forEach(x=>x.onclick=()=>moveGoal(x.dataset.id,1));
 renderYearOverview();
}
function monthsBetweenKeys(from,to){
 if(!from||!to||from>to)return[];
 const a=[];let d=parseDate(from+'-01'),last=parseDate(to+'-01');
 while(d<=last){a.push(monthKey(d));d=addMonths(d,1)}return a
}
function monthsBetweenKeys(from,to){
 if(!from||!to||from>to)return[];
 const a=[];let d=parseDate(from+'-01'),last=parseDate(to+'-01');
 while(d<=last){a.push(monthKey(d));d=addMonths(d,1)}return a
}
function renderYearOverview(){
 const year=activeFinanceMonth.slice(0,4),rows=[];
 let totalIncome=0,totalExpense=0,totalSaved=0;

 for(let m=1;m<=12;m++){
   const mk=`${year}-${pad(m)}`,f=effectiveFinanceSummary(mk);
   totalIncome+=f.displayIncome;
   totalExpense+=f.expense;
   totalSaved+=f.displayRemaining;

   if(f.allRows.length||f.displayIncome>0||f.expense>0){
     const label=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(new Date(+year,m-1,1));
     rows.push(`<div class="row" data-finance-month="${mk}"><div><b>${label}</b><div class="tiny">Einnahmen ${money(f.displayIncome)} · Ausgaben ${money(f.expense)}</div></div><div class="amount ${f.displayRemaining>0?'positive':f.displayRemaining<0?'negative':''}">${money(f.displayRemaining)}</div></div>`);
   }
 }

 const annualAvgIncome=totalIncome/12;
 const annualAvgExpense=totalExpense/12;

 const plan=state.yearPlan[year]||(state.yearPlan[year]={from:`${year}-01`,to:`${year}-12`,incomeTarget:0,expenseTarget:0,jobBasis:'VMT',customRate:15});
 avgFrom.value=plan.from;
 avgTo.value=plan.to;
 targetIncomeAvg.value=plan.incomeTarget||'';
 targetExpenseAvg.value=plan.expenseTarget||'';
 targetJobBasis.value=plan.jobBasis||'VMT';
 targetCustomRate.value=plan.customRate||15;
 targetCustomRateWrap.style.display=targetJobBasis.value==='custom'?'block':'none';

 const range=monthsBetweenKeys(plan.from,plan.to),n=Math.max(1,range.length);
 const rangeIncome=range.reduce((s,m)=>s+effectiveFinanceSummary(m).displayIncome,0);
 const rangeExpense=range.reduce((s,m)=>s+effectiveFinanceSummary(m).expense,0);
 const avgIncome=rangeIncome/n,avgExpense=rangeExpense/n;

 document.getElementById('yearSummary').innerHTML=
   `<div class="row"><div><b>${year}</b><div class="tiny">Jahreswerte</div></div><span class="tag">12 Monate</span></div>
    <div class="row"><span>Einnahmen gesamt</span><b class="positive">${money(totalIncome)}</b></div>
    <div class="row"><span>Ausgaben gesamt</span><b class="negative">${money(totalExpense)}</b></div>
    <div class="row"><span>Jahresersparnis</span><b class="${totalSaved>=0?'positive':'negative'}">${money(totalSaved)}</b></div>
    <div class="row"><span>Ø Monatliches Einkommen ${year}</span><b>${money(annualAvgIncome)}</b></div>
    <div class="row"><span>Ø Monatliche Ausgaben ${year}</span><b>${money(annualAvgExpense)}</b></div>`;

 let status=[];
 if(!range.length){
   status.push(`<div class="negative"><b>Zeitraum prüfen</b><div class="tiny">Bitte einen gültigen Zeitraum wählen.</div></div>`);
 }else{
   if(Number(plan.incomeTarget)>0){
     const target=Number(plan.incomeTarget)*n,diff=rangeIncome-target;
     if(diff>=0){
       status.push(`<div class="row"><div><b class="positive">✓ Einkommen im Plan</b><div class="tiny">Ziel: ${money(Number(plan.incomeTarget))}/Monat · Tatsächlich/Geplant: ${money(avgIncome)}/Monat · ${money(diff)} über dem Gesamtziel.</div></div></div>`);
     }else{
       const missing=-diff,rates={VMT:(plan.to>='2026-10'?16:15),Bib:13.98,Brunner:15},rate=plan.jobBasis==='custom'?Number(plan.customRate||15):rates[plan.jobBasis]||15;
       status.push(`<div class="row"><div><b class="negative">⚠ Einkommen unter Ziel</b><div class="tiny">Ziel: ${money(Number(plan.incomeTarget))}/Monat · Tatsächlich/Geplant: ${money(avgIncome)}/Monat.</div><div class="tiny"><b>Es fehlen ${money(missing)}</b> im gewählten Zeitraum. Bei ${money(rate)}/Std. ≈ <b>${(missing/Math.max(.01,rate)).toFixed(1)} zusätzliche Arbeitsstunden</b>.</div></div></div>`);
     }
   }
   if(Number(plan.expenseTarget)>0){
     const target=Number(plan.expenseTarget)*n,diff=target-rangeExpense;
     status.push(diff>=0
       ? `<div class="row"><div><b class="positive">✓ Ausgaben im Plan</b><div class="tiny">Limit: ${money(Number(plan.expenseTarget))}/Monat · Tatsächlich/Geplant: ${money(avgExpense)}/Monat · ${money(diff)} unter dem Gesamtlimit.</div></div></div>`
       : `<div class="row"><div><b class="negative">⚠ Ausgaben über Ziel</b><div class="tiny">Limit: ${money(Number(plan.expenseTarget))}/Monat · Tatsächlich/Geplant: ${money(avgExpense)}/Monat.</div><div class="tiny"><b>${money(-diff)} über dem Gesamtlimit</b> im gewählten Zeitraum.</div></div></div>`);
   }
 }

 yearPlanStatus.innerHTML=status.join('')||'<div><b>Plan-Check</b><div class="tiny">Trage Ziel-Einkommen und/oder maximales Ausgabenziel ein. Die Auswertung erscheint hier sofort.</div></div>';

 document.getElementById('yearList').innerHTML=rows.join('')||'Keine Daten';
 document.querySelectorAll('[data-finance-month]').forEach(x=>x.onclick=()=>{activeFinanceMonth=x.dataset.financeMonth;showFinanceTab('plan');renderAll()});

 const updateYearCalculator=()=>{
   const p=state.yearPlan[year]||(state.yearPlan[year]={});
   p.from=avgFrom.value||`${year}-01`;
   p.to=avgTo.value||`${year}-12`;
   p.incomeTarget=Number(targetIncomeAvg.value||0);
   p.expenseTarget=Number(targetExpenseAvg.value||0);
   p.jobBasis=targetJobBasis.value;
   p.customRate=Number(targetCustomRate.value||15);
   if(p.from>p.to){
     yearPlanStatus.innerHTML='<div class="negative"><b>Zeitraum prüfen</b><div class="tiny">„Von“ darf nicht nach „Bis“ liegen.</div></div>';
     return;
   }
   save();
   renderYearOverview();
 };

 [avgFrom,avgTo,targetIncomeAvg,targetExpenseAvg,targetCustomRate].forEach(el=>{
   el.oninput=updateYearCalculator;
   el.onchange=updateYearCalculator;
 });
 targetJobBasis.onchange=()=>{
   targetCustomRateWrap.style.display=targetJobBasis.value==='custom'?'block':'none';
   updateYearCalculator();
 };
}
function workEndDate(e){if(!e.date||!e.end)return null;const [y,m,d]=e.date.split('-').map(Number),[hh,mm]=e.end.split(':').map(Number);const x=new Date(y,m-1,d,hh,mm,0,0);if(e.start&&e.end<e.start)x.setDate(x.getDate()+1);return x}
function isWorkEvent(e){return ['VMT','Bib','Brunner','Zusatzjob'].includes(e.type)}
function pendingWorkEvents(){const now=new Date();return state.events.filter(e=>isWorkEvent(e)&&e.end&&!e.workConfirmedAt&&workEndDate(e)<=now).sort((a,b)=>workEndDate(b)-workEndDate(a))}
function confirmWork(id){const e=state.events.find(x=>x.id===id);if(!e)return;e.workConfirmedAt=new Date().toISOString();renderAll()}
function editWork(id){openEvent(id);eventModal.dataset.confirmWorkId=id}
function skipWork(id){const e=state.events.find(x=>x.id===id);if(!e)return;if(confirm(`${e.type} am ${e.date} als nicht gearbeitet markieren? Der Termin wird gelöscht.`)){state.events=state.events.filter(x=>x.id!==id);renderAll()}}
function renderWorkCheck(){const box=document.getElementById('workCheck'),items=pendingWorkEvents();if(!items.length){box.innerHTML='<div class="row"><div><b>Alles bestätigt</b><div class="tiny">Keine vergangenen Arbeitseinsätze warten auf Bestätigung.</div></div><span class="tag">✓</span></div>';return}box.innerHTML=items.map(e=>`<div class="row" style="align-items:flex-start"><div style="flex:1"><b>${e.type==='Zusatzjob'?(e.customJobName||'Zusatzjob'):e.type}</b><div class="tiny">${e.date} · ${e.start||'–'}–${e.end||'–'} · ${hours(e).toFixed(2)} Std.</div><div class="actions" style="margin:8px 0 0"><button class="primary work-ok" data-id="${e.id}">Wie geplant</button><button class="work-edit" data-id="${e.id}">Arbeitszeit ändern</button><button class="danger work-skip" data-id="${e.id}">Nicht gearbeitet</button></div></div></div>`).join('');box.querySelectorAll('.work-ok').forEach(b=>b.onclick=()=>confirmWork(b.dataset.id));box.querySelectorAll('.work-edit').forEach(b=>b.onclick=()=>editWork(b.dataset.id));box.querySelectorAll('.work-skip').forEach(b=>b.onclick=()=>skipWork(b.dataset.id))}
function renderDashboard(){const f=effectiveFinanceSummary(currentMonth),saved=savingsUntil(currentMonth,false),expected=savingsUntil(currentMonth,true),cls=saved>0?'positive':saved<0?'negative':'';document.getElementById('dashboardMonthPicker').value=currentMonth;document.getElementById('dashSaved').textContent=money(saved);document.getElementById('dashSaved').className=`metric ${cls}`;document.getElementById('dashSavedHint').textContent=`Gesamt bis einschließlich ${currentMonth}`;document.getElementById('dashExpectedSaved').textContent=money(expected);document.getElementById('dashIncome').textContent=money(f.displayIncome);document.getElementById('dashExpenses').textContent=money(f.expense);document.getElementById('dashboardMonth').innerHTML=`<div class="row"><span>In diesem Monat gespart</span><b class="${f.displayRemaining>0?'positive':f.displayRemaining<0?'negative':''}">${money(f.displayRemaining)}</b></div><div class="row"><span>Automatische Arbeitseinnahmen</span><b>${money(Object.values(f.automatic).reduce((a,b)=>a+b,0))}</b></div>`;renderWorkCheck()}

function renderAll(){syncModeButtons();renderCalendarViews();renderSalary();renderFinance();renderDashboard();save()}
function toggleCustomJobFields(){customJobFields.style.display=eventType.value==='Zusatzjob'?'block':'none'}
function eventFormSnapshot(){
 return JSON.stringify({
   type:eventType.value,date:eventDate.value,start:eventStart.value,end:eventEnd.value,
   paidHours:Number(paidHours.value||0),nightHours:Number(nightHours.value||0),
   sundayHours:Number(sundayHours.value||0),holidayHours:Number(holidayHours.value||0),
   note:eventNote.value,customJobName:customJobName.value,
   customHourlyRate:Number(customHourlyRate.value||0),
   customDeductionPct:Number(customDeductionPct.value||0),
   customNightPct:Number(customNightPct.value||0),
   customSundayPct:Number(customSundayPct.value||0),
   customHolidayPct:Number(customHolidayPct.value||0),
   customFixedBonus:Number(customFixedBonus.value||0),
   customPayoutMonth:customPayoutMonth.value
 });
}
eventType.onchange=()=>{toggleCustomJobFields();if(eventType.value==='Zusatzjob'&&!customPayoutMonth.value)customPayoutMonth.value=eventDate.value.slice(0,7)};eventDate.onchange=()=>{if(eventType.value==='Zusatzjob'&&!eventId.value)customPayoutMonth.value=eventDate.value.slice(0,7)};
function openEvent(id,date){const e=id?state.events.find(x=>x.id===id):null;eventId.value=e?.id||'';eventType.value=e?.type||'VMT';eventDate.value=e?.date||date||iso(new Date());eventStart.value=e?.start||'';eventEnd.value=e?.end||'';paidHours.value=e?.paidHours||'';nightHours.value=e?.nightHours||0;sundayHours.value=e?.sundayHours||0;holidayHours.value=e?.holidayHours||0;eventNote.value=e?.note||'';customJobName.value=e?.customJobName||'';customHourlyRate.value=e?.customHourlyRate||15;customDeductionPct.value=e?.customDeductionPct||0;customNightPct.value=e?.customNightPct||0;customSundayPct.value=e?.customSundayPct||0;customHolidayPct.value=e?.customHolidayPct||0;customFixedBonus.value=e?.customFixedBonus||0;customPayoutMonth.value=e?.customPayoutMonth||e?.date?.slice(0,7)||eventDate.value.slice(0,7);deleteEventBtn.style.display=e?'inline-block':'none';toggleCustomJobFields();eventModal.dataset.originalSnapshot=eventFormSnapshot();eventModal.classList.add('show')}
eventForm.onsubmit=e=>{e.preventDefault();const id=eventId.value||uid(),old=state.events.find(x=>x.id===id),obj={id,type:eventType.value,date:eventDate.value,start:eventStart.value,end:eventEnd.value,paidHours:Number(paidHours.value||0),nightHours:Number(nightHours.value||0),sundayHours:Number(sundayHours.value||0),holidayHours:Number(holidayHours.value||0),note:eventNote.value,workConfirmedAt:old?.workConfirmedAt||null,customJobName:eventType.value==='Zusatzjob'?customJobName.value:'',customHourlyRate:eventType.value==='Zusatzjob'?Number(customHourlyRate.value||0):0,customDeductionPct:eventType.value==='Zusatzjob'?Number(customDeductionPct.value||0):0,customNightPct:eventType.value==='Zusatzjob'?Number(customNightPct.value||0):0,customSundayPct:eventType.value==='Zusatzjob'?Number(customSundayPct.value||0):0,customHolidayPct:eventType.value==='Zusatzjob'?Number(customHolidayPct.value||0):0,customFixedBonus:eventType.value==='Zusatzjob'?Number(customFixedBonus.value||0):0,customPayoutMonth:eventType.value==='Zusatzjob'?(customPayoutMonth.value||eventDate.value.slice(0,7)):''};if(eventModal.dataset.confirmWorkId===id)obj.workConfirmedAt=new Date().toISOString();const i=state.events.findIndex(x=>x.id===id);i>=0?state.events[i]=obj:state.events.push(obj);delete eventModal.dataset.confirmWorkId;delete eventModal.dataset.originalSnapshot;eventModal.classList.remove('show');renderAll()};deleteEventBtn.onclick=()=>{state.events=state.events.filter(x=>x.id!==eventId.value);eventModal.classList.remove('show');renderAll()};
function toggleFinanceFields(){
 const expense=financeType.value==='expense';
 accountWrap.style.display=statusWrap.style.display=expense?'block':'none';
 paidAmountWrap.style.display=expense&&financeStatus.value==='partial'?'block':'none';
 recurringWrap.style.display=expense?'block':'none';
 if(!expense)financeRecurring.checked=false;
 recurringRangeWrap.style.display=expense&&financeRecurring.checked?'block':'none';

}
function openFinance(id){
 const x=id?state.finance.find(f=>f.id===id):null;
 financeId.value=x?.id||'';
 financeType.value=x?.type||'expense';
 document.getElementById('financeMonth').value=x?.month||activeFinanceMonth;
 financeName.value=x?.name||'';
 financeAmount.value=x?.amount||'';
 financeAccount.value=x?.account||'Sparkasse';
 financeStatus.value=x?.status||'unpaid';
 financePaidAmount.value=x?.paidAmount||0;
 financeRecurring.checked=!!x?.seriesId;
 financeRecurringStart.value=x?.seriesStart||x?.month||activeFinanceMonth;
 financeRecurringEnd.value=x?.seriesEnd||x?.month||activeFinanceMonth;
 deleteFinanceBtn.style.display=x?'inline-block':'none';
 toggleFinanceFields();
 financeModal.classList.add('show')
}
financeType.onchange=toggleFinanceFields;
financeStatus.onchange=toggleFinanceFields;
financeRecurring.onchange=()=>{
 if(financeRecurring.checked){
   const m=document.getElementById('financeMonth').value||activeFinanceMonth;
   if(!financeRecurringStart.value)financeRecurringStart.value=m;
   if(!financeRecurringEnd.value)financeRecurringEnd.value=m;
 }
 toggleFinanceFields();
};
financeForm.onsubmit=e=>{
 e.preventDefault();
 const existing=financeId.value?state.finance.find(x=>x.id===financeId.value):null;
 const baseMonth=document.getElementById('financeMonth').value;
 const common={
   type:financeType.value,
   name:financeName.value,
   amount:Number(financeAmount.value),
   account:financeAccount.value,
   status:financeType.value==='expense'?financeStatus.value:'paid',
   paidAmount:financeStatus.value==='partial'?Number(financePaidAmount.value||0):financeStatus.value==='paid'?Number(financeAmount.value):0
 };
 if(financeType.value==='expense'&&financeRecurring.checked){
   const start=financeRecurringStart.value||baseMonth,end=financeRecurringEnd.value||start;
   if(start>end)return alert('Der Endmonat darf nicht vor dem Startmonat liegen.');
   const months=monthRange(start,end);
   let seriesId=existing?.seriesId||uid();

   if(existing?.seriesId){
     const applyFuture=confirm('Änderung für diesen und alle folgenden Monate übernehmen?\n\nOK = Diesen und alle folgenden Monate\nAbbrechen = Nur diesen Monat');
     if(applyFuture){
       const from=existing.month;
       const originalSeries=state.finance.filter(x=>x.seriesId===existing.seriesId&&x.month>=from);
       originalSeries.forEach(x=>{
         x.name=common.name;x.amount=common.amount;x.account=common.account;
         x.seriesStart=start;x.seriesEnd=end;
       });
       const existingMonths=new Set(state.finance.filter(x=>x.seriesId===seriesId).map(x=>x.month));
       months.filter(m=>m>=from).forEach(m=>{
         if(!existingMonths.has(m))state.finance.push({id:uid(),month:m,...common,seriesId,seriesStart:start,seriesEnd:end,status:'unpaid',paidAmount:0});
       });
       state.finance=state.finance.filter(x=>x.seriesId!==seriesId||x.month<=end);
       const cur=state.finance.find(x=>x.id===existing.id);
       if(cur){cur.status=common.status;cur.paidAmount=common.paidAmount;}
     }else{
       const i=state.finance.findIndex(x=>x.id===existing.id);
       state.finance[i]={...existing,...common,month:baseMonth,seriesId,seriesStart:existing.seriesStart||start,seriesEnd:existing.seriesEnd||end};
     }
   }else{
     months.forEach(m=>state.finance.push({
       id:uid(),month:m,...common,seriesId,seriesStart:start,seriesEnd:end,
       status:m===baseMonth?common.status:'unpaid',
       paidAmount:m===baseMonth?common.paidAmount:0
     }));
   }
   activeFinanceMonth=baseMonth;
 }else{
   const obj={id:existing?.id||uid(),month:baseMonth,...common,seriesId:null,seriesStart:null,seriesEnd:null};
   const i=state.finance.findIndex(x=>x.id===obj.id);
   i>=0?state.finance[i]=obj:state.finance.push(obj);
   activeFinanceMonth=obj.month;
 }
 financeModal.classList.remove('show');
 renderAll();
};
deleteFinanceBtn.onclick=()=>{
 const current=state.finance.find(x=>x.id===financeId.value);
 if(!current)return;
 if(current.seriesId){
   const deleteFuture=confirm('Löschen für diesen und alle folgenden Monate?\n\nOK = Diesen und alle folgenden Monate\nAbbrechen = Nur diesen Monat');
   if(deleteFuture)state.finance=state.finance.filter(x=>!(x.seriesId===current.seriesId&&x.month>=current.month));
   else state.finance=state.finance.filter(x=>x.id!==current.id);
 }else{
   state.finance=state.finance.filter(x=>x.id!==current.id);
 }
 financeModal.classList.remove('show');
 renderAll();
};
function openGoal(id){const g=id?state.goals.find(x=>x.id===id):null;goalId.value=g?.id||'';goalName.value=g?.name||'';goalTarget.value=g?.target||'';deleteGoalBtn.style.display=g?'inline-block':'none';goalModal.classList.add('show')}
goalForm.onsubmit=e=>{e.preventDefault();const id=goalId.value||uid(),old=state.goals.find(x=>x.id===id),obj={id,name:goalName.value,target:Number(goalTarget.value),order:old?.order??state.goals.length},i=state.goals.findIndex(x=>x.id===id);i>=0?state.goals[i]=obj:state.goals.push(obj);goalModal.classList.remove('show');renderAll()};deleteGoalBtn.onclick=()=>{state.goals=state.goals.filter(x=>x.id!==goalId.value).map((g,i)=>({...g,order:i}));goalModal.classList.remove('show');renderAll()};function moveGoal(id,dir){const a=state.goals.sort((x,y)=>x.order-y.order),i=a.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];state.goals=a.map((g,k)=>({...g,order:k}));renderAll()}
prevPeriod.onclick=()=>{calendarMode==='day'?selectedDate.setDate(selectedDate.getDate()-1):calendarMode==='week'?selectedDate.setDate(selectedDate.getDate()-7):selectedDate.setMonth(selectedDate.getMonth()-1);currentMonth=monthKey(selectedDate);renderAll()};nextPeriod.onclick=()=>{calendarMode==='day'?selectedDate.setDate(selectedDate.getDate()+1):calendarMode==='week'?selectedDate.setDate(selectedDate.getDate()+7):selectedDate.setMonth(selectedDate.getMonth()+1);currentMonth=monthKey(selectedDate);renderAll()};todayBtn.onclick=()=>{selectedDate=new Date();currentMonth=monthKey(selectedDate);renderAll()};document.querySelectorAll('#calendarMode [data-mode]').forEach(x=>x.onclick=()=>{calendarMode=x.dataset.mode;renderAll()});addEventBtn.onclick=()=>openEvent();addFinanceBtn.onclick=()=>openFinance();addGoalBtn.onclick=()=>openGoal();document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>document.getElementById(x.dataset.close).classList.remove('show'));document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});
function showFinanceTab(tab){planView.style.display=tab==='plan'?'block':'none';yearView.style.display=tab==='year'?'block':'none';goalsView.style.display=tab==='goals'?'block':'none';dataView.style.display=tab==='data'?'block':'none';planBtn.classList.toggle('active',tab==='plan');yearBtn.classList.toggle('active',tab==='year');goalsBtn.classList.toggle('active',tab==='goals');dataBtn.classList.toggle('active',tab==='data')}
planBtn.onclick=()=>showFinanceTab('plan');yearBtn.onclick=()=>showFinanceTab('year');goalsBtn.onclick=()=>showFinanceTab('goals');dataBtn.onclick=()=>showFinanceTab('data');prevFinanceMonth.onclick=()=>{activeFinanceMonth=monthKey(addMonths(parseDate(activeFinanceMonth+'-01'),-1));renderAll()};nextFinanceMonth.onclick=()=>{activeFinanceMonth=monthKey(addMonths(parseDate(activeFinanceMonth+'-01'),1));renderAll()};financeMonthPicker.onchange=e=>{if(e.target.value){activeFinanceMonth=e.target.value;renderAll()}};prevSalaryMonth.onclick=()=>{salaryMonth=monthKey(addMonths(parseDate(salaryMonth+'-01'),-1));renderAll()};nextSalaryMonth.onclick=()=>{salaryMonth=monthKey(addMonths(parseDate(salaryMonth+'-01'),1));renderAll()};salaryMonthPicker.onchange=e=>{if(e.target.value){salaryMonth=e.target.value;renderAll()}};prevDashboardMonth.onclick=()=>{currentMonth=monthKey(addMonths(parseDate(currentMonth+'-01'),-1));renderAll()};nextDashboardMonth.onclick=()=>{currentMonth=monthKey(addMonths(parseDate(currentMonth+'-01'),1));renderAll()};dashboardMonthPicker.onchange=e=>{if(e.target.value){currentMonth=e.target.value;renderAll()}};prevGoalMonth.onclick=()=>{goalMonth=monthKey(addMonths(parseDate(goalMonth+'-01'),-1));renderAll()};nextGoalMonth.onclick=()=>{goalMonth=monthKey(addMonths(parseDate(goalMonth+'-01'),1));renderAll()};goalMonthPicker.onchange=e=>{if(e.target.value){goalMonth=e.target.value;renderAll()}};
function renderMultiDayPicker(){const value=multiMonth.value||currentMonth,[y,m]=value.split('-').map(Number),first=new Date(y,m-1,1),start=mondayOf(first);multiDayPicker.innerHTML=['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<div class="month-weekday">${x}</div>`).join('');for(let i=0;i<42;i++){const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d);multiDayPicker.insertAdjacentHTML('beforeend',`<button type="button" class="month-day${d.getMonth()!==first.getMonth()?' outside':''}" data-date="${ds}" style="${selectedMultiDates.has(ds)?'background:#0f172a;color:#fff':''}"><div class="month-day-number">${d.getDate()}</div></button>`)}multiDayPicker.querySelectorAll('[data-date]').forEach(x=>x.onclick=()=>{selectedMultiDates.has(x.dataset.date)?selectedMultiDates.delete(x.dataset.date):selectedMultiDates.add(x.dataset.date);renderMultiDayPicker()});selectedDaysCount.textContent=`${selectedMultiDates.size} Tage ausgewählt`}
function toggleMultiCustomJobFields(){multiCustomJobFields.style.display=multiType.value==='Zusatzjob'?'block':'none'}
function openMultiEvent(){selectedMultiDates.clear();multiMonth.value=monthKey(selectedDate);multiType.value='Bib';multiStart.value=multiEnd.value=multiPaidHours.value=multiNote.value='';multiNightHours.value=multiSundayHours.value=multiHolidayHours.value=0;multiCustomJobName.value='';multiCustomHourlyRate.value=15;multiCustomDeductionPct.value=multiCustomNightPct.value=multiCustomSundayPct.value=multiCustomHolidayPct.value=multiCustomFixedBonus.value=0;multiCustomPayoutMonth.dataset.userSet='';multiCustomPayoutMonth.value=multiMonth.value;toggleMultiCustomJobFields();renderMultiDayPicker();multiEventModal.classList.add('show')}multiEventBtn.onclick=openMultiEvent;multiType.onchange=toggleMultiCustomJobFields;multiMonth.onchange=()=>{if(multiType.value==='Zusatzjob'&&!multiCustomPayoutMonth.dataset.userSet)multiCustomPayoutMonth.value=multiMonth.value;renderMultiDayPicker()};multiCustomPayoutMonth.onchange=()=>{multiCustomPayoutMonth.dataset.userSet='1'};multiMonth.onchange=()=>{selectedMultiDates.clear();renderMultiDayPicker()};multiEventForm.onsubmit=e=>{e.preventDefault();if(!selectedMultiDates.size)return alert('Bitte mindestens einen Tag auswählen.');[...selectedMultiDates].forEach(date=>{if(!state.events.some(x=>x.date===date&&x.type===multiType.value&&x.start===multiStart.value&&x.end===multiEnd.value))state.events.push({id:uid(),date,type:multiType.value,start:multiStart.value,end:multiEnd.value,paidHours:Number(multiPaidHours.value||0),nightHours:Number(multiNightHours.value||0),sundayHours:Number(multiSundayHours.value||0),holidayHours:Number(multiHolidayHours.value||0),note:multiNote.value,workConfirmedAt:null,customJobName:multiType.value==='Zusatzjob'?multiCustomJobName.value:'',customHourlyRate:multiType.value==='Zusatzjob'?Number(multiCustomHourlyRate.value||0):0,customDeductionPct:multiType.value==='Zusatzjob'?Number(multiCustomDeductionPct.value||0):0,customNightPct:multiType.value==='Zusatzjob'?Number(multiCustomNightPct.value||0):0,customSundayPct:multiType.value==='Zusatzjob'?Number(multiCustomSundayPct.value||0):0,customHolidayPct:multiType.value==='Zusatzjob'?Number(multiCustomHolidayPct.value||0):0,customFixedBonus:multiType.value==='Zusatzjob'?Number(multiCustomFixedBonus.value||0):0,customPayoutMonth:multiType.value==='Zusatzjob'?String(multiCustomPayoutMonth.value||date.slice(0,7)):''})});multiEventModal.classList.remove('show');renderAll()};
let workReminderTimers=[];
async function enableWorkNotifications(){if(!('Notification'in window))return alert('Benachrichtigungen werden von diesem Browser nicht unterstützt.');const p=await Notification.requestPermission();updateNotificationButton();if(p==='granted'){scheduleWorkReminders();alert('Benachrichtigungen sind aktiviert.')}}
function updateNotificationButton(){const b=document.getElementById('enableWorkNotificationsBtn');if(!b)return;const ok='Notification'in window&&Notification.permission==='granted';b.textContent=ok?'Benachrichtigungen aktiv':'Benachrichtigungen aktivieren';b.disabled=ok}
function scheduleWorkReminders(){workReminderTimers.forEach(clearTimeout);workReminderTimers=[];if(!('Notification'in window)||Notification.permission!=='granted')return;const now=Date.now();state.events.filter(e=>isWorkEvent(e)&&!e.workConfirmedAt&&workEndDate(e)&&workEndDate(e).getTime()>now).forEach(e=>{const delay=workEndDate(e).getTime()-now;if(delay>2147483647)return;workReminderTimers.push(setTimeout(async()=>{try{const reg=await navigator.serviceWorker?.ready;if(reg)reg.showNotification(`${e.type} beendet`,{body:'Arbeitszeit jetzt bestätigen oder im Kalender anpassen.',tag:`work-${e.id}`,data:{url:'./?screen=dashboard'}});else new Notification(`${e.type} beendet`,{body:'Arbeitszeit jetzt bestätigen oder im Kalender anpassen.'})}catch{}},delay))})}
document.getElementById('enableWorkNotificationsBtn').onclick=enableWorkNotifications;updateNotificationButton();setInterval(()=>{renderWorkCheck();scheduleWorkReminders()},60000);setTimeout(scheduleWorkReminders,1500);
function exportBackup(){const blob=new Blob([JSON.stringify({product:'Wesam Planner',appVersion:'16.9',schemaVersion:8,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`WesamPlanner_Backup_${iso(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}async function importBackupFile(file){if(!file)return;let p;try{p=JSON.parse(await file.text())}catch{return alert('Die Datei ist kein gültiges JSON-Backup.')}const c=p.state||p;if(!Array.isArray(c.events)||!Array.isArray(c.finance)||!Array.isArray(c.goals))return alert('Ungültige Wesam-Planner-Daten.');if(confirm('Aktuelle lokale Daten durch dieses Backup ersetzen?')){state=normalizeState(c);renderAll();alert('Backup wiederhergestellt.')}}exportBackupBtn.onclick=exportBackup;importBackupBtn.onclick=()=>importBackupInput.click();importBackupInput.onchange=async e=>{await importBackupFile(e.target.files?.[0]);e.target.value=''};
window.wesamPlanner={getState:()=>structuredClone(state),replaceState:(next,{fromCloud=false}={})=>{state=normalizeState(next);localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify({exportedAt:new Date().toISOString(),appVersion:'16.9',schemaVersion:8,state}));renderAll();if(fromCloud)window.wesamCloud?.markRemoteApplied?.()},normalizeState};if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');renderAll();
