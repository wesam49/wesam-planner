(() => {
  const APP_VERSION = '16.17';

  // Brunner rules from 16.17:
  // - monthly paid base cap: 38.9 h (was 38 h)
  // - Sunday supplement: 35% (was 50%)
  // - night 15%, holiday 100%, hourly wage 15.50 € stay unchanged
  brunnerForWorkMonth = function(workMonth){
    const evAll = state.events.filter(e => e.type === 'Brunner');
    if(!evAll.length) return {worked:0,paidBase:0,carryIn:0,carry:0,night:0,sunday:0,holiday:0,total:0};

    const first = evAll.map(e => e.date.slice(0,7)).sort()[0];
    const target = parseDate(workMonth + '-01');
    if(target < parseDate(first + '-01')) return {worked:0,paidBase:0,carryIn:0,carry:0,night:0,sunday:0,holiday:0,total:0};

    let carry = 0;
    let res = {worked:0,paidBase:0,carryIn:0,carry:0,night:0,sunday:0,holiday:0,total:0};

    for(let d = parseDate(first + '-01'); d <= target; d = addMonths(d,1)){
      const mk = monthKey(d);
      const ev = evAll.filter(e => e.date.startsWith(mk));
      const worked = ev.reduce((s,e) => s + hours(e), 0);
      const night = ev.reduce((s,e) => s + Number(e.nightHours || 0), 0);
      const sunday = ev.reduce((s,e) => s + Number(e.sundayHours || 0), 0);
      const holiday = ev.reduce((s,e) => s + Number(e.holidayHours || 0), 0);
      const carryIn = carry;
      const paidBase = Math.min(38.9, carryIn + worked);
      carry = Math.max(0, carryIn + worked - paidBase);

      if(mk === workMonth){
        res = {
          worked,
          paidBase,
          carryIn,
          carry,
          night,
          sunday,
          holiday,
          total:
            paidBase * 15.5 +
            night * 15.5 * 0.15 +
            sunday * 15.5 * 0.35 +
            holiday * 15.5
        };
      }
    }
    return res;
  };

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

  const previousSave = save;
  save = function(){
    previousSave();
    try{
      const backup=JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)||'null');
      if(backup){
        backup.appVersion=APP_VERSION;
        localStorage.setItem(AUTO_BACKUP_KEY,JSON.stringify(backup));
      }
    }catch(_){ }
  };

  // Recalculate all salary / finance views immediately with the corrected Brunner rules.
  renderAll();
})();
