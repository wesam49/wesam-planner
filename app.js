const money = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n||0));
const pad=n=>String(n).padStart(2,'0');
const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,1);
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);

const typeStyle={
  VMT:['#f4e66a','#3f3b00'], Bibliothek:['#f9f2a8','#3f3b00'], Brunner:['#d8cf6a','#2c2a00'],
  Gym:['#7dd3fc','#083344'], Fahrschule:['#f8c95e','#4a2b00'], Urlaub:['#93d34f','#173b00'], Other:['#d1d5db','#111827']
};

const defaultEvents = [
['2026-08-01','Bibliothek','09:00','13:00',4,0,0,0,''],['2026-08-01','Gym','21:00','23:00',2,0,0,0,''],
['2026-08-02','Gym','21:00','23:00',2,0,0,0,''],
['2026-08-03','Urlaub','','',0,0,0,0,'Urlaub 03.08–10.08'],
['2026-08-04','Urlaub','','',0,0,0,0,''],['2026-08-05','Urlaub','','',0,0,0,0,''],['2026-08-06','Urlaub','','',0,0,0,0,''],['2026-08-07','Urlaub','','',0,0,0,0,''],['2026-08-08','Urlaub','','',0,0,0,0,''],['2026-08-09','Urlaub','','',0,0,0,0,''],['2026-08-10','Urlaub','','',0,0,0,0,''],
['2026-08-11','Bibliothek','16:00','20:00',4,0,0,0,''],
['2026-08-12','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-12','Fahrschule','18:00','20:00',2,0,0,0,'3. Fahrstunde'],
['2026-08-13','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-13','Bibliothek','18:00','20:00',2,0,0,0,''],
['2026-08-14','VMT','07:00','18:00',8.5,0,0,0,''],
['2026-08-15','Bibliothek','09:00','13:00',4,0,0,0,''],
['2026-08-17','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-17','Fahrschule','18:00','20:00',2,0,0,0,'4. Fahrstunde'],
['2026-08-18','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-18','Fahrschule','18:00','20:00',2,0,0,0,'5. Fahrstunde – Abfahrt Bruchsal 17:35، Flehingen، Gochsheimer Str. 12، Anmeldung 17:00'],
['2026-08-19','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-19','Fahrschule','18:00','20:00',2,0,0,0,'6. Fahrstunde – Graben، Hauptstr. 13، Abfahrt von der Arbeit um 18:00'],
['2026-08-20','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-20','Bibliothek','18:00','20:00',2,0,0,0,''],
['2026-08-21','VMT','07:00','18:00',8.5,0,0,0,''],
['2026-08-22','Bibliothek','09:00','13:00',4,0,0,0,''],['2026-08-22','Gym','13:00','16:00',3,0,0,0,''],['2026-08-22','Brunner','20:00','08:00',12,0,8,0,''],
['2026-08-23','Gym','16:00','18:00',2,0,0,0,''],['2026-08-23','Brunner','20:00','08:00',12,0,4,0,''],
['2026-08-24','Gym','16:00','18:00',2,0,0,0,''],['2026-08-24','Brunner','20:00','08:00',12,0,0,0,''],
['2026-08-25','Gym','16:00','18:00',2,0,0,0,''],['2026-08-25','Brunner','20:00','08:00',12,0,0,0,''],
['2026-08-26','Gym','16:00','18:00',2,0,0,0,''],['2026-08-26','Brunner','20:00','08:00',12,0,0,0,''],
['2026-08-27','Gym','16:00','18:00',2,0,0,0,''],['2026-08-27','Brunner','20:00','08:00',12,0,0,0,''],
['2026-08-29','Bibliothek','09:00','13:00',4,0,0,0,''],['2026-08-29','Gym','13:00','16:00',3,0,0,0,''],
['2026-08-31','VMT','07:00','18:00',8.5,0,0,0,''],['2026-08-31','Bibliothek','18:00','20:00',2,0,0,0,''],['2026-08-31','Gym','21:00','23:00',2,0,0,0,'']
].map(x=>({id:uid(),date:x[0],type:x[1],start:x[2],end:x[3],paidHours:x[4],nightHours:x[5],sundayHours:x[6],holidayHours:x[7],note:x[8]}));

const defaultExpenses=[
['Miete',320],['Rechnungen',290],['Lebensmittel',250],['DB',63],['Haare schneiden',40],
['Familie',100],['Urlaub',500],['Parfüm',80],['Uni',180],['Familie Netz',13]
].map(x=>({id:uid(),name:x[0],amount:x[1],month:'2026-08'}));

const defaultGoals=[{id:uid(),name:'Führerschein',target:3000,saved:0}];

let state=JSON.parse(localStorage.getItem('wesamPlanner')||'null')||{
  events:defaultEvents,expenses:defaultExpenses,goals:defaultGoals,current:'2026-08'
};
let current=parseDate(state.current+'-01');

function save(){state.current=monthKey(current);localStorage.setItem('wesamPlanner',JSON.stringify(state))}
function hours(e){
  if(Number(e.paidHours)>0)return Number(e.paidHours);
  if(!e.start||!e.end)return 0;
  const [sh,sm]=e.start.split(':').map(Number),[eh,em]=e.end.split(':').map(Number);
  let m=(eh*60+em)-(sh*60+sm); if(m<0)m+=1440; return m/60;
}
function eventsForMonth(key){return state.events.filter(e=>e.date.startsWith(key))}
function salaryFor(month){
  const [y,m]=month.split('-').map(Number);
  const cur=new Date(y,m-1,1);
  const end=new Date(y,m-1,11), start=new Date(y,m-2,12);
  const vmt=state.events.filter(e=>e.type==='VMT'&&parseDate(e.date)>=start&&parseDate(e.date)<=end);
  const vmtHours=vmt.reduce((s,e)=>s+hours(e),0);
  const vmtGross=vmtHours*15, vmtNet=vmtGross*.91+(vmtHours?70:0);

  const bibWorkKey=monthKey(addMonths(cur,-2));
  const bib=state.events.filter(e=>e.type==='Bibliothek'&&e.date.startsWith(bibWorkKey));
  const bibHours=bib.reduce((s,e)=>s+hours(e),0), bibPay=bibHours*11;

  const months=[...new Set(state.events.filter(e=>e.type==='Brunner').map(e=>e.date.slice(0,7)))].sort();
  let carry=0, br={worked:0,paidBase:0,carry:0,night:0,sunday:0,holiday:0,basePay:0,addons:0,total:0};
  for(const mk of months){
    const ev=state.events.filter(e=>e.type==='Brunner'&&e.date.startsWith(mk));
    const worked=ev.reduce((s,e)=>s+hours(e),0);
    const night=ev.reduce((s,e)=>s+Number(e.nightHours||0),0);
    const sunday=ev.reduce((s,e)=>s+Number(e.sundayHours||0),0);
    const holiday=ev.reduce((s,e)=>s+Number(e.holidayHours||0),0);
    const available=carry+worked, paidBase=Math.min(38,available); carry=available-paidBase;
    if(mk===month){
      const basePay=paidBase*15.5;
      const addons=night*15.5*.15+sunday*15.5*.5+holiday*15.5;
      br={worked,paidBase,carry,night,sunday,holiday,basePay,addons,total:basePay+addons};
    }
  }
  return {vmtHours,vmtGross,vmtNet,bibHours,bibPay,bibWorkKey,br,total:vmtNet+bibPay+br.total,start,end};
}
function render(){
  const key=monthKey(current);
  document.getElementById('monthLabel').textContent=new Intl.DateTimeFormat('ar',{month:'long',year:'numeric'}).format(current);
  renderCalendar(); renderEvents(); renderSalary(); renderBudget(); renderDashboard(); save();
}
function renderCalendar(){
  const grid=document.getElementById('calendarGrid'); grid.innerHTML='';
  ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'].forEach(x=>grid.insertAdjacentHTML('beforeend',`<div class="dow">${x}</div>`));
  const first=new Date(current.getFullYear(),current.getMonth(),1);
  const start=new Date(first); start.setDate(1-first.getDay());
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const ds=iso(d), ev=state.events.filter(e=>e.date===ds);
    const cls=d.getMonth()!==current.getMonth()?'day out':'day';
    const pills=ev.slice(0,3).map(e=>{const [bg,fg]=typeStyle[e.type]||typeStyle.Other;return `<div class="pill" style="background:${bg};color:${fg}">${e.start?e.start+' ':''}${e.type}</div>`}).join('');
    const more=ev.length>3?`<div class="tiny">+${ev.length-3}</div>`:'';
    grid.insertAdjacentHTML('beforeend',`<div class="${cls}" data-date="${ds}"><div class="daynum">${d.getDate()}</div>${pills}${more}</div>`);
  }
  grid.querySelectorAll('.day').forEach(el=>el.onclick=()=>openEvent(null,el.dataset.date));
}
function renderEvents(){
  const key=monthKey(current), list=eventsForMonth(key).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  document.getElementById('monthEvents').innerHTML=list.length?list.map(e=>{
    const [bg,fg]=typeStyle[e.type]||typeStyle.Other;
    return `<div class="event-row" data-id="${e.id}">
      <div><span class="tag" style="background:${bg};color:${fg}">${e.type}</span>
      <div><b>${e.date}</b> ${e.start?`— ${e.start} إلى ${e.end}`:''}</div><div class="tiny">${e.note||''}</div></div>
      <div><b>${hours(e).toFixed(2)} h</b></div></div>`
  }).join(''):'لا توجد مواعيد';
  document.querySelectorAll('.event-row').forEach(x=>x.onclick=()=>openEvent(x.dataset.id));
}
function renderSalary(){
  const key=monthKey(current),s=salaryFor(key);
  const br=s.br;
  document.getElementById('salaryDetails').innerHTML=`
    <div class="salary-row"><div><b>VMT</b><div class="tiny">دورة ${iso(s.start)} إلى ${iso(s.end)} · ${s.vmtHours.toFixed(2)} h</div></div><div><b>${money(s.vmtNet)}</b><div class="tiny">بعد 9% + 70€</div></div></div>
    <div class="salary-row"><div><b>Bibliothek</b><div class="tiny">عن ساعات ${s.bibWorkKey} · ${s.bibHours.toFixed(2)} h</div></div><div><b>${money(s.bibPay)}</b></div></div>
    <div class="salary-row"><div><b>Brunner</b><div class="tiny">عملت ${br.worked.toFixed(2)} h · أساسي مدفوع ${br.paidBase.toFixed(2)} h · مرحّل ${br.carry.toFixed(2)} h</div><div class="tiny">ليل ${br.night} h · أحد ${br.sunday} h · عطلة ${br.holiday} h</div></div><div><b>${money(br.total)}</b><div class="tiny">إضافات ${money(br.addons)}</div></div></div>
    <div class="salary-row"><div><b>الإجمالي المتوقع</b></div><div class="metric">${money(s.total)}</div></div>`;
}
function renderBudget(){
  const key=monthKey(current), ex=state.expenses.filter(x=>x.month===key);
  const total=ex.reduce((s,x)=>s+Number(x.amount),0);
  document.getElementById('budgetTotal').textContent=money(total);
  document.getElementById('expenseList').innerHTML=ex.length?ex.map(x=>`<div class="expense-row" data-id="${x.id}"><div>${x.name}</div><b>${money(x.amount)}</b></div>`).join(''):'لا توجد مصاريف';
  document.querySelectorAll('.expense-row').forEach(x=>x.onclick=()=>openExpense(x.dataset.id));
  const saved=state.goals.reduce((s,g)=>s+Number(g.saved||0),0);
  document.getElementById('savingAmount').textContent=money(saved);
  document.getElementById('goalList').innerHTML=state.goals.length?state.goals.map(g=>{
    const p=Math.min(100,(Number(g.saved||0)/Math.max(1,Number(g.target||0)))*100);
    return `<div class="expense-row" data-id="${g.id}"><div style="flex:1"><b>${g.name}</b><div class="tiny">${money(g.saved)} من ${money(g.target)}</div><div class="progress"><span style="width:${p}%"></span></div></div><b>${p.toFixed(0)}%</b></div>`
  }).join(''):'لا توجد أهداف';
  document.querySelectorAll('#goalList .expense-row').forEach(x=>x.onclick=()=>openGoal(x.dataset.id));
}
function renderDashboard(){
  const key=monthKey(current),s=salaryFor(key);
  const expenses=state.expenses.filter(x=>x.month===key).reduce((a,x)=>a+Number(x.amount),0);
  document.getElementById('dashIncome').textContent=money(s.total);
  document.getElementById('dashExpenses').textContent=money(expenses);
  document.getElementById('dashRemaining').textContent=money(s.total-expenses);
  document.getElementById('dashCarry').textContent=`${s.br.carry.toFixed(2)} h`;
  document.getElementById('dashboardSalary').innerHTML=`
    <div class="salary-row"><span>VMT</span><b>${money(s.vmtNet)}</b></div>
    <div class="salary-row"><span>Bibliothek</span><b>${money(s.bibPay)}</b></div>
    <div class="salary-row"><span>Brunner</span><b>${money(s.br.total)}</b></div>`;
  const now=new Date(), upcoming=state.events.filter(e=>parseDate(e.date)>=new Date(now.getFullYear(),now.getMonth(),now.getDate())).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,5);
  document.getElementById('upcoming').innerHTML=upcoming.length?upcoming.map(e=>`<div class="event-row"><div><b>${e.type}</b><div class="tiny">${e.date} ${e.start||''}</div></div><span>${hours(e).toFixed(2)} h</span></div>`).join(''):'لا توجد مواعيد قادمة';
}
function showScreen(id){
  document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));
  document.querySelectorAll('[data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));
}
document.querySelectorAll('[data-screen]').forEach(x=>x.onclick=()=>showScreen(x.dataset.screen));
document.getElementById('prevMonth').onclick=()=>{current=addMonths(current,-1);render()};
document.getElementById('nextMonth').onclick=()=>{current=addMonths(current,1);render()};
document.getElementById('addEventBtn').onclick=()=>openEvent();
document.getElementById('addExpenseBtn').onclick=()=>openExpense();
document.getElementById('addGoalBtn').onclick=()=>openGoal();
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>document.getElementById(x.dataset.close).classList.remove('show'));
document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('show')});

function openEvent(id,date){
  const e=id?state.events.find(x=>x.id===id):null;
  document.getElementById('eventId').value=e?.id||'';
  document.getElementById('eventType').value=e?.type||'VMT';
  document.getElementById('eventDate').value=e?.date||date||iso(new Date());
  document.getElementById('eventStart').value=e?.start||'';
  document.getElementById('eventEnd').value=e?.end||'';
  document.getElementById('paidHours').value=e?.paidHours||'';
  document.getElementById('nightHours').value=e?.nightHours||0;
  document.getElementById('sundayHours').value=e?.sundayHours||0;
  document.getElementById('holidayHours').value=e?.holidayHours||0;
  document.getElementById('eventNote').value=e?.note||'';
  document.getElementById('deleteEventBtn').style.display=e?'inline-block':'none';
  document.getElementById('eventModal').classList.add('show');
}
document.getElementById('eventForm').onsubmit=e=>{
  e.preventDefault(); const id=document.getElementById('eventId').value||uid();
  const obj={id,type:document.getElementById('eventType').value,date:document.getElementById('eventDate').value,start:document.getElementById('eventStart').value,end:document.getElementById('eventEnd').value,
    paidHours:Number(document.getElementById('paidHours').value||0),nightHours:Number(document.getElementById('nightHours').value||0),sundayHours:Number(document.getElementById('sundayHours').value||0),
    holidayHours:Number(document.getElementById('holidayHours').value||0),note:document.getElementById('eventNote').value};
  const i=state.events.findIndex(x=>x.id===id); if(i>=0)state.events[i]=obj;else state.events.push(obj);
  document.getElementById('eventModal').classList.remove('show');render();
console.log('Wesam Planner Update 2 loaded');
};
document.getElementById('deleteEventBtn').onclick=()=>{const id=document.getElementById('eventId').value;state.events=state.events.filter(x=>x.id!==id);document.getElementById('eventModal').classList.remove('show');render()};

function openExpense(id){
  const x=id?state.expenses.find(e=>e.id===id):null;
  document.getElementById('expenseId').value=x?.id||'';document.getElementById('expenseName').value=x?.name||'';document.getElementById('expenseAmount').value=x?.amount||'';document.getElementById('expenseMonth').value=x?.month||monthKey(current);
  document.getElementById('deleteExpenseBtn').style.display=x?'inline-block':'none';document.getElementById('expenseModal').classList.add('show');
}
document.getElementById('expenseForm').onsubmit=e=>{
  e.preventDefault(); const id=document.getElementById('expenseId').value||uid(),obj={id,name:document.getElementById('expenseName').value,amount:Number(document.getElementById('expenseAmount').value),month:document.getElementById('expenseMonth').value};
  const i=state.expenses.findIndex(x=>x.id===id);if(i>=0)state.expenses[i]=obj;else state.expenses.push(obj);
  document.getElementById('expenseModal').classList.remove('show');render();
}
document.getElementById('deleteExpenseBtn').onclick=()=>{state.expenses=state.expenses.filter(x=>x.id!==document.getElementById('expenseId').value);document.getElementById('expenseModal').classList.remove('show');render()};

function openGoal(id){
  const g=id?state.goals.find(x=>x.id===id):null;
  document.getElementById('goalId').value=g?.id||'';document.getElementById('goalName').value=g?.name||'';document.getElementById('goalTarget').value=g?.target||'';document.getElementById('goalSaved').value=g?.saved||0;
  document.getElementById('deleteGoalBtn').style.display=g?'inline-block':'none';document.getElementById('goalModal').classList.add('show');
}
document.getElementById('goalForm').onsubmit=e=>{
  e.preventDefault();const id=document.getElementById('goalId').value||uid(),obj={id,name:document.getElementById('goalName').value,target:Number(document.getElementById('goalTarget').value),saved:Number(document.getElementById('goalSaved').value)};
  const i=state.goals.findIndex(x=>x.id===id);if(i>=0)state.goals[i]=obj;else state.goals.push(obj);
  document.getElementById('goalModal').classList.remove('show');render();
}
document.getElementById('deleteGoalBtn').onclick=()=>{state.goals=state.goals.filter(x=>x.id!==document.getElementById('goalId').value);document.getElementById('goalModal').classList.remove('show');render()};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
render();