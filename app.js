const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n||0));
const dateFmt=d=>new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
const shortDate=d=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit'}).format(d);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,1);
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const mondayOf=d=>{const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x};

const styles={
 VMT:['#f4e66a','#3f3b00'],Bib:['#f9f2a8','#3f3b00'],Brunner:['#ded56b','#2c2a00'],
 Fitnessstudio:['#7dd3fc','#083344'],Fahrschule:['#f8c95e','#4a2b00'],Urlaub:['#9ad85a','#173b00'],Sonstiges:['#d1d5db','#111827']
};

const defaultEvents=[
['2026-08-01','Bib','09:00','13:00',4,0,0,0,0,''],['2026-08-01','Fitnessstudio','21:00','23:00',2,0,0,0,0,''],
['2026-08-02','Fitnessstudio','21:00','23:00',2,0,0,0,0,''],
...Array.from({length:8},(_,i)=>[`2026-08-${pad(i+3)}`,'Urlaub','','',0,0,0,0,0,i===0?'Urlaub 03.08.–10.08.':'']),
['2026-08-11','Bib','16:00','20:00',4,0,0,0,0,''],
['2026-08-12','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-12','Fahrschule','18:00','20:00',2,0,0,0,0,'3. Fahrstunde'],
['2026-08-13','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-13','Bib','18:00','20:00',2,0,0,0,0,''],
['2026-08-14','VMT','07:00','18:00',8.5,0,0,0,0,''],
['2026-08-15','Bib','09:00','13:00',4,0,0,0,0,''],
['2026-08-17','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-17','Fahrschule','18:00','20:00',2,0,0,0,0,'4. Fahrstunde'],
['2026-08-18','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-18','Fahrschule','18:00','20:00',2,0,0,0,0,'5. Fahrstunde – Abfahrt Bruchsal 17:35, Flehingen, Gochsheimer Str. 12'],
['2026-08-19','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-19','Fahrschule','18:00','20:00',2,0,0,0,0,'6. Fahrstunde – Graben, Hauptstr. 13'],
['2026-08-20','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-20','Bib','18:00','20:00',2,0,0,0,0,''],
['2026-08-21','VMT','07:00','18:00',8.5,0,0,0,0,''],
['2026-08-22','Bib','09:00','13:00',4,0,0,0,0,''],['2026-08-22','Fitnessstudio','13:00','16:00',3,0,0,0,0,''],['2026-08-22','Brunner','20:00','08:00',12,0,0,8,0,''],
['2026-08-23','Fitnessstudio','16:00','18:00',2,0,0,0,0,''],['2026-08-23','Brunner','20:00','08:00',12,0,0,4,0,''],
['2026-08-24','Fitnessstudio','16:00','18:00',2,0,0,0,0,''],['2026-08-24','Brunner','20:00','08:00',12,0,0,0,0,''],
['2026-08-25','Fitnessstudio','16:00','18:00',2,0,0,0,0,''],['2026-08-25','Brunner','20:00','08:00',12,0,0,0,0,''],
['2026-08-26','Fitnessstudio','16:00','18:00',2,0,0,0,0,''],['2026-08-26','Brunner','20:00','08:00',12,0,0,0,0,''],
['2026-08-27','Fitnessstudio','16:00','18:00',2,0,0,0,0,''],['2026-08-27','Brunner','20:00','08:00',12,0,0,0,0,''],
['2026-08-29','Bib','09:00','13:00',4,0,0,0,0,''],['2026-08-29','Fitnessstudio','13:00','16:00',3,0,0,0,0,''],
['2026-08-31','VMT','07:00','18:00',8.5,0,0,0,0,''],['2026-08-31','Bib','18:00','20:00',2,0,0,0,0,''],['2026-08-31','Fitnessstudio','21:00','23:00',2,0,0,0,0,'']
].map(x=>({id:uid(),date:x[0],type:x[1],start:x[2],end:x[3],paidHours:x[4],bibMiniHours:x[5],nightHours:x[6],sundayHours:x[7],holidayHours:x[8],note:x[9]}));

const financeSeed={
'2026-07':[
['income','VMT',1050],['income','Bib von Mai',690],['income','Wohngeld',220],
['expense','Miete',320],['expense','Rechnungen',290],['expense','Lebensmittel',250],['expense','DB',63],['expense','Haare schneiden',40],['expense','Familie',196],['expense','Scharif',70],['expense','Taxi',70],['expense','Freizeit',157],['expense','Laya',140],['expense','Sonstige Ausgaben',324],['saving','Sparbetrag',40]
],
'2026-08':[
['income','Bib mini von Juni',425],['income','Bib von Juni',1290],['income','Taxi',71],['income','Wohngeld',220],['income','Temu-Rückzahlung',35],['income','Parfüm-Rückzahlung',50],['income','Brunner Juli',135],
['expense','Miete',320],['expense','Rechnungen',290],['expense','Lebensmittel',250],['expense','DB',63],['expense','Haare schneiden',40],['expense','Familie',100],['expense','Urlaub',500],['expense','Parfüm',80],['expense','Liska',45],['expense','Uni',180],['expense','Familie Netz',13],['expense','Fahrschule',380],['saving','Sparbetrag',0]
],
'2026-09':[
['income','VMT Juli–August',870],['income','Bib von Juli',968],['income','Das Fest',192.5],['income','Brunner August',800],['income','Wohngeld',220],
['expense','Miete',320],['expense','Rechnungen',290],['expense','Lebensmittel',400],['expense','DB',63],['expense','Haare schneiden',40],['expense','Familie',305.05],['expense','Scharif',66],['expense','Moayed',305.05],['saving','Sparbetrag',1261.4]
],
'2026-10':[
['income','VMT August–September',1980],['income','Bib August',968],['income','Brunner Rest September',500],['income','Wohngeld',220],
['expense','Miete',320],['expense','Rechnungen',290],['expense','Lebensmittel',400],['expense','DB',63],['expense','Haare schneiden',40],['expense','Familie',366.8],['expense','Scharif und Liska',682],['expense','Moayed',366.8],['saving','Sparbetrag',1139.4]
],
'2026-11':[
['income','VMT September–Oktober',1150],['income','Bib September',968],['income','Wohngeld',220],
['expense','Miete',320],['expense','Rechnungen',290],['expense','Lebensmittel',400],['expense','DB',63],['expense','Haare schneiden',40],['expense','Familie',233.8],['expense','Scharif und Liska',528],['expense','Moayed',233.8],['saving','Sparbetrag',229.4]
],
'2026-12':[
['income','VMT Oktober–November Urlaub',1000],['income','Bib',800],['income','Wohngeld',220],
['expense','Miete',320],['expense','Rechnungen',290],['expense','Lebensmittel',400],['expense','DB',63],['expense','Haare schneiden',40],['expense','Familie',202],['expense','Moayed',202],['saving','Sparbetrag',503]
]
};
const defaultFinance=Object.entries(financeSeed).flatMap(([month,rows])=>rows.map(r=>({id:uid(),month,type:r[0],name:r[1],amount:r[2]})));
const defaultGoals=[{id:uid(),name:'Führerschein',target:3000,saved:0}];

let state=JSON.parse(localStorage.getItem('wesamPlannerV3')||'null')||{events:defaultEvents,finance:defaultFinance,goals:defaultGoals};
let selectedDate=new Date(2026,7,10);
let calendarMode='month';
let currentMonth='2026-08';
let financeMonth='2026-08';
let salaryMonth='2026-09';
let selectedMultiDates=new Set();

function save(){localStorage.setItem('wesamPlannerV3',JSON.stringify(state))}
function hours(e){
 if(Number(e.paidHours)>0)return Number(e.paidHours);
 if(!e.start||!e.end)return 0;
 const [sh,sm]=e.start.split(':').map(Number),[eh,em]=e.end.split(':').map(Number);
 let m=(eh*60+em)-(sh*60+sm);if(m<0)m+=1440;return m/60;
}
function salaryFor(month){
 const [y,m]=month.split('-').map(Number),cur=new Date(y,m-1,1);
 const start=new Date(y,m-2,12),end=new Date(y,m-1,11);
 const vmt=state.events.filter(e=>e.type==='VMT'&&parseDate(e.date)>=start&&parseDate(e.date)<=end);
 const vmtHours=vmt.reduce((s,e)=>s+hours(e),0),vmtGross=vmtHours*15,vmtNet=vmtGross*.91+(vmtHours?70:0);
 const bibWorkMonth=monthKey(addMonths(cur,-2));
 const bib=state.events.filter(e=>e.type==='Bib'&&e.date.startsWith(bibWorkMonth));
 const bibTotal=bib.reduce((s,e)=>s+hours(e),0),bibMini=bib.reduce((s,e)=>s+Number(e.bibMiniHours||0),0),bibNormal=Math.max(0,bibTotal-bibMini);
 const bibPay=bibNormal*11+bibMini*15.15;
 const months=[...new Set(state.events.filter(e=>e.type==='Brunner').map(e=>e.date.slice(0,7)))].sort();
 let carry=0,br={worked:0,paidBase:0,carry:0,night:0,sunday:0,holiday:0,addons:0,total:0};
 for(const mk of months){
   const ev=state.events.filter(e=>e.type==='Brunner'&&e.date.startsWith(mk));
   const worked=ev.reduce((s,e)=>s+hours(e),0),night=ev.reduce((s,e)=>s+Number(e.nightHours||0),0),sun=ev.reduce((s,e)=>s+Number(e.sundayHours||0),0),hol=ev.reduce((s,e)=>s+Number(e.holidayHours||0),0);
   const available=carry+worked,paid=Math.min(38,available);carry=available-paid;
   if(mk===month){const addons=night*15.5*.15+sun*15.5*.5+hol*15.5;br={worked,paidBase:paid,carry,night,sunday:sun,holiday:hol,addons,total:paid*15.5+addons}}
 }
 return {vmtHours,vmtNet,start,end,bibWorkMonth,bibTotal,bibMini,bibNormal,bibPay,br,total:vmtNet+bibPay+br.total}
}
function financeSummary(month){
 const rows=state.finance.filter(x=>x.month===month),income=rows.filter(x=>x.type==='income').reduce((s,x)=>s+Number(x.amount),0),expense=rows.filter(x=>x.type==='expense').reduce((s,x)=>s+Number(x.amount),0),saving=rows.filter(x=>x.type==='saving').reduce((s,x)=>s+Number(x.amount),0);
 return {rows,income,expense,saving,remaining:income-expense};
}
function previousMonth(month){
 const [y,m]=month.split('-').map(Number);
 return monthKey(new Date(y,m-2,1));
}
function automaticEmploymentIncome(month){
 const currentSalary=salaryFor(month);
 const brunnerSalary=salaryFor(previousMonth(month));
 return {
   VMT: Number(currentSalary.vmtNet||0),
   Bib: Number(currentSalary.bibPay||0),
   Brunner: Number(brunnerSalary.br.total||0)
 };
}
function employerFromName(name){
 const n=String(name||'').trim().toLowerCase();
 if(n.startsWith('vmt')) return 'VMT';
 if(n.startsWith('bib') || n.startsWith('bibliothek')) return 'Bib';
 if(n.startsWith('brunner')) return 'Brunner';
 return null;
}
function effectiveFinanceSummary(month){
 const rows=state.finance.filter(x=>x.month===month);
 const automatic=automaticEmploymentIncome(month);
 const visibleRows=rows.filter(x=>{
   if(x.type!=='income') return true;
   const employer=employerFromName(x.name);
   return !(employer && automatic[employer]>0);
 });
 const manualIncome=visibleRows.filter(x=>x.type==='income').reduce((s,x)=>s+Number(x.amount),0);
 const expense=visibleRows.filter(x=>x.type==='expense').reduce((s,x)=>s+Number(x.amount),0);
 const saving=visibleRows.filter(x=>x.type==='saving').reduce((s,x)=>s+Number(x.amount),0);
 const automaticTotal=Object.values(automatic).reduce((s,x)=>s+Number(x||0),0);
 const displayIncome=manualIncome+automaticTotal;
 return {rows:visibleRows,allRows:rows,automatic,manualIncome,expense,saving,displayIncome,displayRemaining:displayIncome-expense};
}
function savingsUntil(month,includeFuture=false){
 const [year,mon]=month.split('-').map(Number);
 const limit=includeFuture?`${year}-12`:month;
 const months=[...new Set(state.finance.map(x=>x.month))].filter(m=>m.slice(0,4)===String(year)&&m<=limit).sort();
 let total=0;
 for(const mk of months){
   const f=effectiveFinanceSummary(mk);
   total+=f.saving;
   if(f.displayRemaining<0) total+=f.displayRemaining;
 }
 return total;
}

function showScreen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('[data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===id))}
document.querySelectorAll('[data-screen]').forEach(x=>x.onclick=()=>showScreen(x.dataset.screen));

function renderCalendarViews(){
 const title=document.getElementById('calendarTitle');
 const label=document.getElementById('periodLabel');
 const dayView=document.getElementById('dayView');
 const weekGrid=document.getElementById('weekGrid');
 const monthView=document.getElementById('monthView');
 dayView.style.display='none';weekGrid.style.display='none';monthView.style.display='none';

 if(calendarMode==='day'){
   title.textContent='Tagesansicht';
   label.textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(selectedDate);
   dayView.style.display='block';
   const ds=iso(selectedDate);
   const ev=state.events.filter(e=>e.date===ds).sort((a,b)=>a.start.localeCompare(b.start));
   const html=ev.length?ev.map(e=>{const [bg,fg]=styles[e.type]||styles.Sonstiges;return `<div class="event" data-id="${e.id}" style="background:${bg};color:${fg}"><div><strong>${e.type}</strong><div class="event-note">${e.note||''}</div></div><div class="event-time">${e.start?`${e.start}–${e.end}`:'Ganztägig'}</div></div>`}).join(''):'<div class="tiny">Keine Termine</div>';
   dayView.innerHTML=`<div class="day-detail"><div class="day-title"><b>${dateFmt(selectedDate)}</b><button class="add-day" data-date="${ds}">+</button></div>${html}</div>`;
 }
 else if(calendarMode==='week'){
   title.textContent='Wochenansicht';
   const weekStart=mondayOf(selectedDate);const end=new Date(weekStart);end.setDate(end.getDate()+6);
   label.textContent=`${shortDate(weekStart)} – ${shortDate(end)}`;
   weekGrid.style.display='grid';weekGrid.innerHTML='';
   for(let i=0;i<7;i++){
     const d=new Date(weekStart);d.setDate(d.getDate()+i);const ds=iso(d);
     const ev=state.events.filter(e=>e.date===ds).sort((a,b)=>a.start.localeCompare(b.start));
     const today=iso(new Date())===ds?' today':'';
     const html=ev.length?ev.map(e=>{const [bg,fg]=styles[e.type]||styles.Sonstiges;return `<div class="event" data-id="${e.id}" style="background:${bg};color:${fg}"><div><strong>${e.type}</strong><div class="event-note">${e.note||''}</div></div><div class="event-time">${e.start?`${e.start}–${e.end}`:'Ganztägig'}</div></div>`}).join(''):'<div class="tiny">Keine Termine</div>';
     weekGrid.insertAdjacentHTML('beforeend',`<div class="day-card${today}" data-date="${ds}"><div class="day-title"><b>${dateFmt(d)}</b><button class="add-day" data-date="${ds}">+</button></div>${html}</div>`);
   }
 }
 else{
   title.textContent='Monatsansicht';
   const first=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
   label.textContent=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(first);
   monthView.style.display='block';
   const grid=document.createElement('div');grid.className='month-grid';
   ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(x=>grid.insertAdjacentHTML('beforeend',`<div class="month-weekday">${x}</div>`));
   const start=mondayOf(first);
   for(let i=0;i<42;i++){
     const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d);
     const ev=state.events.filter(e=>e.date===ds).sort((a,b)=>a.start.localeCompare(b.start));
     const cls=['month-day'];
     if(d.getMonth()!==first.getMonth())cls.push('outside');
     if(iso(new Date())===ds)cls.push('today');
     const pills=ev.slice(0,3).map(e=>{const [bg,fg]=styles[e.type]||styles.Sonstiges;return `<div class="month-event" data-id="${e.id}" style="background:${bg};color:${fg}">${e.start?e.start+' ':''}${e.type}</div>`}).join('');
     const more=ev.length>3?`<div class="tiny">+${ev.length-3} weitere</div>`:'';
     grid.insertAdjacentHTML('beforeend',`<div class="${cls.join(' ')}" data-date="${ds}"><div class="month-day-number">${d.getDate()}</div>${pills}${more}</div>`);
   }
   monthView.innerHTML='';monthView.appendChild(grid);
 }
 document.querySelectorAll('.event,.month-event').forEach(x=>x.onclick=e=>{e.stopPropagation();openEvent(x.dataset.id)});
 document.querySelectorAll('.add-day').forEach(x=>x.onclick=e=>{e.stopPropagation();openEvent(null,x.dataset.date)});
 document.querySelectorAll('.month-day').forEach(x=>x.onclick=()=>{selectedDate=parseDate(x.dataset.date);currentMonth=monthKey(selectedDate);calendarMode='day';syncModeButtons();renderAll()});
}
function syncModeButtons(){
 document.querySelectorAll('#calendarMode [data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===calendarMode));
}
function renderSalary(){
 const s=salaryFor(salaryMonth);
 document.getElementById('salaryMonthPicker').value=salaryMonth;
 document.getElementById('salaryDetails').innerHTML=`
 <div class="row"><div><b>VMT</b><div class="tiny">${iso(s.start)} bis ${iso(s.end)} · ${s.vmtHours.toFixed(2)} Std.</div></div><div class="amount">${money(s.vmtNet)}</div></div>
 <div class="row"><div><b>Bib</b><div class="tiny">Arbeitsmonat ${s.bibWorkMonth} · Normal ${s.bibNormal.toFixed(2)} Std. · Bib mini ${s.bibMini.toFixed(2)} Std.</div></div><div class="amount">${money(s.bibPay)}</div></div>
 <div class="row"><div><b>Brunner</b><div class="tiny">Gearbeitet ${s.br.worked.toFixed(2)} Std. · Grundlohn ${s.br.paidBase.toFixed(2)} Std. · Übertrag ${s.br.carry.toFixed(2)} Std.</div><div class="tiny">Nacht ${s.br.night} · Sonntag ${s.br.sunday} · Feiertag ${s.br.holiday}</div></div><div class="amount">${money(s.br.total)}</div></div>
 <div class="row"><b>Berechnetes Gesamtgehalt</b><div class="metric">${money(s.total)}</div></div>`;
}
function renderFinance(){
 const f=effectiveFinanceSummary(financeMonth);
 document.getElementById('financeMonthPicker').value=financeMonth;
 const automaticRows=Object.entries(f.automatic)
   .filter(([,amount])=>Number(amount)>0)
   .map(([name,amount])=>`<div class="row"><div><span>${name}</span><div class="tiny">Automatisch aus Kalender und Gehaltsregeln</div></div><span class="amount">${money(amount)}</span></div>`)
   .join('');
 const manualIncomeRows=f.rows.filter(x=>x.type==='income').map(x=>`<div class="row finance-row" data-id="${x.id}"><span>${x.name}</span><span class="amount">${money(x.amount)}</span></div>`).join('');
 document.getElementById('financeList').innerHTML=`
 <div class="row"><b>Einnahmen gesamt</b><span class="amount positive">${money(f.displayIncome)}</span></div>
 ${automaticRows?`<div class="row"><b>Automatisch berechnet</b><span class="tiny">VMT · Bib · Brunner</span></div>${automaticRows}`:''}
 ${manualIncomeRows?`<div class="row"><b>Manuell eingetragen</b><span class="tiny">z. B. Wohngeld oder Rückzahlung</span></div>${manualIncomeRows}`:''}
 <div class="row"><b>Ausgaben</b><span class="amount negative">${money(f.expense)}</span></div>
 ${f.rows.filter(x=>x.type==='expense').map(x=>`<div class="row finance-row" data-id="${x.id}"><span>${x.name}</span><span class="amount">${money(x.amount)}</span></div>`).join('')}
 <div class="row"><b>Verbleibender Betrag</b><span class="amount ${f.displayRemaining<0?'negative':''}">${money(f.displayRemaining)}</span></div>
 <div class="row"><b>Sparbetrag</b><span class="amount positive">${money(f.saving)}</span></div>`;
 document.querySelectorAll('.finance-row').forEach(x=>x.onclick=()=>openFinance(x.dataset.id));
 document.getElementById('goalList').innerHTML=state.goals.map(g=>{const p=Math.min(100,Number(g.saved||0)/Math.max(1,Number(g.target||0))*100);return `<div class="row goal-row" data-id="${g.id}"><div style="flex:1"><b>${g.name}</b><div class="tiny">${money(g.saved)} von ${money(g.target)}</div><div class="progress"><span style="width:${p}%"></span></div></div><b>${p.toFixed(0)} %</b></div>`}).join('');
 document.querySelectorAll('.goal-row').forEach(x=>x.onclick=()=>openGoal(x.dataset.id));
 renderYearOverview();
}
function renderYearOverview(){
 const year=financeMonth.slice(0,4);
 const rows=[];
 for(let m=1;m<=12;m++){
   const mk=`${year}-${pad(m)}`,f=effectiveFinanceSummary(mk);
   if(f.allRows.length||f.displayIncome>0){
     rows.push(`<div class="row" data-finance-month="${mk}"><div><b>${new Intl.DateTimeFormat('de-DE',{month:'long'}).format(new Date(Number(year),m-1,1))}</b><div class="tiny">Einnahmen ${money(f.displayIncome)} · Ausgaben ${money(f.expense)}</div></div><div><div class="amount ${f.displayRemaining<0?'negative':''}">${money(f.displayRemaining)}</div><div class="tiny">Sparen ${money(f.saving)}</div></div></div>`);
   }
 }
 document.getElementById('yearList').innerHTML=rows.join('')||'Keine Daten';
 document.querySelectorAll('[data-finance-month]').forEach(x=>x.onclick=()=>{financeMonth=x.dataset.financeMonth;salaryMonth=x.dataset.financeMonth;showFinanceTab('plan');renderAll()});
}
function renderDashboard(){
 const f=effectiveFinanceSummary(currentMonth),s=salaryFor(currentMonth);
 const saved=savingsUntil(currentMonth,false);
 const expected=savingsUntil(currentMonth,true);
 document.getElementById('dashSaved').textContent=money(saved);
 document.getElementById('dashExpectedSaved').textContent=money(expected);
 document.getElementById('dashIncome').textContent=money(f.displayIncome);
 document.getElementById('dashExpenses').textContent=money(f.expense);
 document.getElementById('dashboardMonth').innerHTML=`<div class="row"><span>Verbleibender Betrag</span><b class="${f.displayRemaining<0?'negative':''}">${money(f.displayRemaining)}</b></div><div class="row"><span>Automatische Arbeitseinnahmen</span><b>${money(Object.values(f.automatic).reduce((a,b)=>a+Number(b||0),0))}</b></div>`;
 const now=new Date(),up=state.events.filter(e=>parseDate(e.date)>=new Date(now.getFullYear(),now.getMonth(),now.getDate())).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,5);
 document.getElementById('upcoming').innerHTML=up.length?up.map(e=>`<div class="row"><div><b>${e.type}</b><div class="tiny">${e.date} ${e.start||''}</div></div><span>${hours(e).toFixed(2)} Std.</span></div>`).join(''):'Keine anstehenden Termine';
}
function renderAll(){syncModeButtons();renderCalendarViews();renderSalary();renderFinance();renderDashboard();save()}

function openEvent(id,date){
 const e=id?state.events.find(x=>x.id===id):null;
 ['eventId','eventType','eventDate','eventStart','eventEnd','paidHours','bibMiniHours','nightHours','sundayHours','holidayHours','eventNote'].forEach(()=>{});
 document.getElementById('eventId').value=e?.id||'';document.getElementById('eventType').value=e?.type||'VMT';document.getElementById('eventDate').value=e?.date||date||iso(new Date());
 document.getElementById('eventStart').value=e?.start||'';document.getElementById('eventEnd').value=e?.end||'';document.getElementById('paidHours').value=e?.paidHours||'';document.getElementById('bibMiniHours').value=e?.bibMiniHours||0;
 document.getElementById('nightHours').value=e?.nightHours||0;document.getElementById('sundayHours').value=e?.sundayHours||0;document.getElementById('holidayHours').value=e?.holidayHours||0;document.getElementById('eventNote').value=e?.note||'';
 document.getElementById('deleteEventBtn').style.display=e?'inline-block':'none';document.getElementById('eventModal').classList.add('show');
}
document.getElementById('eventForm').onsubmit=e=>{e.preventDefault();const id=document.getElementById('eventId').value||uid();const obj={id,type:document.getElementById('eventType').value,date:document.getElementById('eventDate').value,start:document.getElementById('eventStart').value,end:document.getElementById('eventEnd').value,paidHours:Number(document.getElementById('paidHours').value||0),bibMiniHours:Number(document.getElementById('bibMiniHours').value||0),nightHours:Number(document.getElementById('nightHours').value||0),sundayHours:Number(document.getElementById('sundayHours').value||0),holidayHours:Number(document.getElementById('holidayHours').value||0),note:document.getElementById('eventNote').value};const i=state.events.findIndex(x=>x.id===id);if(i>=0)state.events[i]=obj;else state.events.push(obj);document.getElementById('eventModal').classList.remove('show');renderAll()};
document.getElementById('deleteEventBtn').onclick=()=>{state.events=state.events.filter(x=>x.id!==document.getElementById('eventId').value);document.getElementById('eventModal').classList.remove('show');renderAll()};

function openFinance(id){
 const x=id?state.finance.find(f=>f.id===id):null;document.getElementById('financeId').value=x?.id||'';document.getElementById('financeType').value=x?.type||'expense';document.getElementById('financeMonth').value=x?.month||financeMonth;document.getElementById('financeName').value=x?.name||'';document.getElementById('financeAmount').value=x?.amount||'';document.getElementById('deleteFinanceBtn').style.display=x?'inline-block':'none';document.getElementById('financeModal').classList.add('show')
}
document.getElementById('financeForm').onsubmit=e=>{e.preventDefault();const id=document.getElementById('financeId').value||uid(),obj={id,type:document.getElementById('financeType').value,month:document.getElementById('financeMonth').value,name:document.getElementById('financeName').value,amount:Number(document.getElementById('financeAmount').value)};const i=state.finance.findIndex(x=>x.id===id);if(i>=0)state.finance[i]=obj;else state.finance.push(obj);financeMonth=obj.month;document.getElementById('financeModal').classList.remove('show');renderAll()};
document.getElementById('deleteFinanceBtn').onclick=()=>{state.finance=state.finance.filter(x=>x.id!==document.getElementById('financeId').value);document.getElementById('financeModal').classList.remove('show');renderAll()};

function openGoal(id){const g=id?state.goals.find(x=>x.id===id):null;document.getElementById('goalId').value=g?.id||'';document.getElementById('goalName').value=g?.name||'';document.getElementById('goalTarget').value=g?.target||'';document.getElementById('goalSaved').value=g?.saved||0;document.getElementById('deleteGoalBtn').style.display=g?'inline-block':'none';document.getElementById('goalModal').classList.add('show')}
document.getElementById('goalForm').onsubmit=e=>{e.preventDefault();const id=document.getElementById('goalId').value||uid(),obj={id,name:document.getElementById('goalName').value,target:Number(document.getElementById('goalTarget').value),saved:Number(document.getElementById('goalSaved').value)};const i=state.goals.findIndex(x=>x.id===id);if(i>=0)state.goals[i]=obj;else state.goals.push(obj);document.getElementById('goalModal').classList.remove('show');renderAll()};
document.getElementById('deleteGoalBtn').onclick=()=>{state.goals=state.goals.filter(x=>x.id!==document.getElementById('goalId').value);document.getElementById('goalModal').classList.remove('show');renderAll()};

document.getElementById('prevPeriod').onclick=()=>{
 if(calendarMode==='day')selectedDate.setDate(selectedDate.getDate()-1);
 else if(calendarMode==='week')selectedDate.setDate(selectedDate.getDate()-7);
 else selectedDate.setMonth(selectedDate.getMonth()-1);
 currentMonth=monthKey(selectedDate);renderAll()
};
document.getElementById('nextPeriod').onclick=()=>{
 if(calendarMode==='day')selectedDate.setDate(selectedDate.getDate()+1);
 else if(calendarMode==='week')selectedDate.setDate(selectedDate.getDate()+7);
 else selectedDate.setMonth(selectedDate.getMonth()+1);
 currentMonth=monthKey(selectedDate);renderAll()
};
document.getElementById('todayBtn').onclick=()=>{selectedDate=new Date();currentMonth=monthKey(selectedDate);renderAll()};
document.querySelectorAll('#calendarMode [data-mode]').forEach(x=>x.onclick=()=>{calendarMode=x.dataset.mode;renderAll()});
document.getElementById('addEventBtn').onclick=()=>openEvent();
document.getElementById('addFinanceBtn').onclick=()=>openFinance();
document.getElementById('addGoalBtn').onclick=()=>openGoal();
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>document.getElementById(x.dataset.close).classList.remove('show'));
document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});
function showFinanceTab(tab){
 document.getElementById('planView').style.display=tab==='plan'?'block':'none';
 document.getElementById('yearView').style.display=tab==='year'?'block':'none';
 document.getElementById('goalsView').style.display=tab==='goals'?'block':'none';
 document.getElementById('planBtn').classList.toggle('active',tab==='plan');
 document.getElementById('yearBtn').classList.toggle('active',tab==='year');
 document.getElementById('goalsBtn').classList.toggle('active',tab==='goals');
}
document.getElementById('planBtn').onclick=()=>showFinanceTab('plan');
document.getElementById('yearBtn').onclick=()=>showFinanceTab('year');
document.getElementById('goalsBtn').onclick=()=>showFinanceTab('goals');
document.getElementById('prevFinanceMonth').onclick=()=>{financeMonth=monthKey(addMonths(parseDate(financeMonth+'-01'),-1));renderAll()};
document.getElementById('nextFinanceMonth').onclick=()=>{financeMonth=monthKey(addMonths(parseDate(financeMonth+'-01'),1));renderAll()};
document.getElementById('financeMonthPicker').onchange=e=>{if(e.target.value){financeMonth=e.target.value;renderAll()}};
document.getElementById('prevSalaryMonth').onclick=()=>{salaryMonth=monthKey(addMonths(parseDate(salaryMonth+'-01'),-1));renderAll()};
document.getElementById('nextSalaryMonth').onclick=()=>{salaryMonth=monthKey(addMonths(parseDate(salaryMonth+'-01'),1));renderAll()};
document.getElementById('salaryMonthPicker').onchange=e=>{if(e.target.value){salaryMonth=e.target.value;renderAll()}};


function renderMultiDayPicker(){
 const value=document.getElementById('multiMonth').value||currentMonth;
 const [y,m]=value.split('-').map(Number);
 const first=new Date(y,m-1,1),start=mondayOf(first);
 const picker=document.getElementById('multiDayPicker');picker.innerHTML='';
 ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(x=>picker.insertAdjacentHTML('beforeend',`<div class="month-weekday">${x}</div>`));
 for(let i=0;i<42;i++){
   const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d);
   const outside=d.getMonth()!==first.getMonth();
   const selected=selectedMultiDates.has(ds);
   picker.insertAdjacentHTML('beforeend',`<button type="button" class="month-day ${outside?'outside':''}" data-date="${ds}" style="${selected?'background:#0f172a;color:white;':''}"><div class="month-day-number">${d.getDate()}</div></button>`);
 }
 picker.querySelectorAll('[data-date]').forEach(x=>x.onclick=()=>{const ds=x.dataset.date;if(selectedMultiDates.has(ds))selectedMultiDates.delete(ds);else selectedMultiDates.add(ds);renderMultiDayPicker()});
 document.getElementById('selectedDaysCount').textContent=`${selectedMultiDates.size} Tage ausgewählt`;
}
function openMultiEvent(){
 selectedMultiDates.clear();
 document.getElementById('multiMonth').value=monthKey(selectedDate);
 document.getElementById('multiType').value='Bib';
 document.getElementById('multiStart').value='';document.getElementById('multiEnd').value='';
 document.getElementById('multiPaidHours').value='';document.getElementById('multiBibMiniHours').value=0;
 document.getElementById('multiNightHours').value=0;document.getElementById('multiSundayHours').value=0;document.getElementById('multiHolidayHours').value=0;document.getElementById('multiNote').value='';
 renderMultiDayPicker();document.getElementById('multiEventModal').classList.add('show');
}
document.getElementById('multiEventBtn').onclick=openMultiEvent;
document.getElementById('multiMonth').onchange=()=>{selectedMultiDates.clear();renderMultiDayPicker()};
document.getElementById('multiEventForm').onsubmit=e=>{
 e.preventDefault();
 if(!selectedMultiDates.size){alert('Bitte mindestens einen Tag auswählen.');return}
 const type=document.getElementById('multiType').value,start=document.getElementById('multiStart').value,end=document.getElementById('multiEnd').value;
 let added=0,skipped=0;
 [...selectedMultiDates].sort().forEach(date=>{
   const duplicate=state.events.some(x=>x.date===date&&x.type===type&&x.start===start&&x.end===end);
   if(duplicate){skipped++;return}
   state.events.push({id:uid(),date,type,start,end,paidHours:Number(document.getElementById('multiPaidHours').value||0),bibMiniHours:Number(document.getElementById('multiBibMiniHours').value||0),nightHours:Number(document.getElementById('multiNightHours').value||0),sundayHours:Number(document.getElementById('multiSundayHours').value||0),holidayHours:Number(document.getElementById('multiHolidayHours').value||0),note:document.getElementById('multiNote').value});
   added++;
 });
 document.getElementById('multiEventModal').classList.remove('show');renderAll();
 if(skipped)alert(`${added} Termine gespeichert, ${skipped} Duplikate übersprungen.`);
};

if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
renderAll();