
(() => {
  const APP_VERSION='16.20';

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

  // Preserve manual corrections through normalizeState / cloud sync.
  const preloadedAdjustments =
    window.__wesamPreloadState &&
    window.__wesamPreloadState.incomeAdjustments &&
    typeof window.__wesamPreloadState.incomeAdjustments === 'object'
      ? window.__wesamPreloadState.incomeAdjustments
      : null;

  const baseNormalizeState=normalizeState;
  normalizeState=function(input){
    const adjustments = input && input.incomeAdjustments && typeof input.incomeAdjustments === 'object'
      ? input.incomeAdjustments
      : (preloadedAdjustments || {});
    const out=baseNormalizeState(input);
    out.incomeAdjustments=adjustments;
    return out;
  };
  if(preloadedAdjustments) state.incomeAdjustments=preloadedAdjustments;
  else if(!state.incomeAdjustments || typeof state.incomeAdjustments!=='object') state.incomeAdjustments={};

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

  // Keep the original calculated income as a reference and only adjust the finance result.
  const calculatedAutomaticEmploymentIncome=automaticEmploymentIncome;
  function adjustmentBucket(month){
    if(!state.incomeAdjustments || typeof state.incomeAdjustments!=='object') state.incomeAdjustments={};
    if(!state.incomeAdjustments[month] || typeof state.incomeAdjustments[month]!=='object') state.incomeAdjustments[month]={};
    return state.incomeAdjustments[month];
  }
  function adjustmentFor(month,source){
    const x=adjustmentBucket(month)[source];
    return x && typeof x==='object' ? {amount:Number(x.amount||0),note:String(x.note||'')} : {amount:0,note:''};
  }
  function signedMoney(value){
    const n=Number(value||0);
    return `${n>0?'+':n<0?'−':''}${money(Math.abs(n))}`;
  }
  automaticEmploymentIncome=function(month){
    const base=calculatedAutomaticEmploymentIncome(month);
    const out={...base};
    Object.keys(out).forEach(source=>{
      const delta=adjustmentFor(month,source).amount;
      out[source]=Math.max(0,Number(base[source]||0)+delta);
    });
    return out;
  };

  const style=document.createElement('style');
  style.textContent=`
    .income-adjust-btn{box-shadow:none;padding:5px 8px;border-radius:999px;font-size:11px;line-height:1.15;background:#e0f2fe;color:#075985;white-space:nowrap}
    .income-adjust-btn.changed{font-weight:800}
    .income-adjust-btn.changed.positive{background:#dcfce7;color:#166534}
    .income-adjust-btn.changed.negative{background:#fee2e2;color:#991b1b}
    .income-adjust-detail{margin-top:3px;font-size:11px;color:var(--muted)}
    .income-adjust-detail strong.positive{color:#166534}
    .income-adjust-detail strong.negative{color:#b91c1c}
    .adjust-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:4px 0 10px}
    .adjust-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px;padding:9px;min-width:0}
    .adjust-stat span{display:block;font-size:11px;color:var(--muted)}
    .adjust-stat b{display:block;margin-top:2px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:420px){.adjust-summary{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal" id="incomeAdjustModal">
      <div class="sheet">
        <div class="sheet-head"><h3>Einnahme anpassen</h3><button type="button" id="closeIncomeAdjustModal">✕</button></div>
        <form id="incomeAdjustForm" class="form-grid">
          <input type="hidden" id="incomeAdjustMonth">
          <input type="hidden" id="incomeAdjustSource">
          <input type="hidden" id="incomeAdjustOriginal">
          <div class="full"><b id="incomeAdjustTitle"></b><div class="tiny" id="incomeAdjustMonthLabel"></div></div>
          <div class="full adjust-summary">
            <div class="adjust-stat"><span>Original aus Kalender/Gehalt</span><b id="incomeAdjustOriginalLabel">0,00 €</b></div>
            <div class="adjust-stat"><span>Korrektur</span><b id="incomeAdjustDeltaLabel">0,00 €</b></div>
            <div class="adjust-stat"><span>Neuer Betrag</span><b id="incomeAdjustNewLabel">0,00 €</b></div>
          </div>
          <div><label>Korrektur (+ / − €)</label><input type="number" step="0.01" id="incomeAdjustAmount" value="0"></div>
          <div><label>Notiz (optional)</label><input id="incomeAdjustNote" placeholder="z. B. Bonus / Abzug"></div>
          <div class="full tiny">Die ursprüngliche Berechnung aus dem Kalender bleibt sichtbar. Nur der Finanzbetrag wird um diese Korrektur erhöht oder reduziert.</div>
          <div class="full actions"><button class="primary" type="submit">Speichern</button><button type="button" id="removeIncomeAdjustment">Korrektur entfernen</button></div>
        </form>
      </div>
    </div>`);

  const modal=document.getElementById('incomeAdjustModal');
  const amountInput=document.getElementById('incomeAdjustAmount');
  const noteInput=document.getElementById('incomeAdjustNote');
  const originalInput=document.getElementById('incomeAdjustOriginal');

  function monthLong(month){
    const [y,m]=String(month).split('-').map(Number);
    return new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));
  }
  function refreshAdjustPreview(){
    const original=Number(originalInput.value||0),delta=Number(amountInput.value||0),total=Math.max(0,original+delta);
    document.getElementById('incomeAdjustOriginalLabel').textContent=money(original);
    const deltaEl=document.getElementById('incomeAdjustDeltaLabel');
    deltaEl.textContent=signedMoney(delta);
    deltaEl.className=delta>0?'positive':delta<0?'negative':'';
    document.getElementById('incomeAdjustNewLabel').textContent=money(total);
  }
  amountInput.addEventListener('input',refreshAdjustPreview);

  function openIncomeAdjustment(source){
    const month=activeFinanceMonth;
    const base=calculatedAutomaticEmploymentIncome(month);
    const original=Number(base[source]||0);
    const adj=adjustmentFor(month,source);
    document.getElementById('incomeAdjustMonth').value=month;
    document.getElementById('incomeAdjustSource').value=source;
    originalInput.value=String(original);
    document.getElementById('incomeAdjustTitle').textContent=source;
    document.getElementById('incomeAdjustMonthLabel').textContent=monthLong(month);
    amountInput.value=String(adj.amount||0);
    noteInput.value=adj.note||'';
    document.getElementById('removeIncomeAdjustment').style.display=(adj.amount||adj.note)?'inline-block':'none';
    refreshAdjustPreview();
    modal.classList.add('show');
  }

  document.getElementById('closeIncomeAdjustModal').onclick=()=>modal.classList.remove('show');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
  document.getElementById('incomeAdjustForm').onsubmit=e=>{
    e.preventDefault();
    const month=document.getElementById('incomeAdjustMonth').value;
    const source=document.getElementById('incomeAdjustSource').value;
    const original=Number(originalInput.value||0);
    let delta=Number(amountInput.value||0);
    if(original+delta<0) delta=-original;
    const note=noteInput.value.trim();
    if(Math.abs(delta)<0.005 && !note) delete adjustmentBucket(month)[source];
    else adjustmentBucket(month)[source]={amount:delta,note};
    save();
    modal.classList.remove('show');
    renderAll();
  };
  document.getElementById('removeIncomeAdjustment').onclick=()=>{
    const month=document.getElementById('incomeAdjustMonth').value;
    const source=document.getElementById('incomeAdjustSource').value;
    delete adjustmentBucket(month)[source];
    save();
    modal.classList.remove('show');
    renderAll();
  };

  function decorateAutomaticIncomeRows(){
    const incomeSection=document.querySelector('#financeList .finance-section');
    if(!incomeSection) return;
    const month=activeFinanceMonth;
    const base=calculatedAutomaticEmploymentIncome(month);
    incomeSection.querySelectorAll('.income-row-main').forEach(main=>{
      const detail=main.querySelector('.tiny');
      if(!detail || !/Automatisch aus Kalender und Gehalt/.test(detail.textContent)) return;
      const source=(main.querySelector('span')?.textContent||'').trim();
      if(!source || !(source in base)) return;
      const row=main.closest('.row');
      const actions=row?.querySelector('.receipt-row-actions');
      if(!actions) return;
      const adj=adjustmentFor(month,source);
      const delta=Number(adj.amount||0);
      detail.innerHTML=delta
        ? `Original: ${money(base[source])} · Korrektur: <strong class="${delta>0?'positive':'negative'}">${signedMoney(delta)}</strong>${adj.note?` · ${adj.note}`:''}`
        : 'Automatisch aus Kalender und Gehalt';
      const btn=document.createElement('button');
      btn.type='button';
      btn.className=`income-adjust-btn${delta?' changed '+(delta>0?'positive':'negative'):''}`;
      btn.textContent=delta?`Korrektur ${signedMoney(delta)}`:'Anpassen';
      btn.onclick=e=>{e.stopPropagation();openIncomeAdjustment(source)};
      actions.insertBefore(btn,actions.firstChild);
    });
  }

  const previousRenderFinance=renderFinance;
  renderFinance=function(){
    previousRenderFinance();
    decorateAutomaticIncomeRows();
  };

  renderFinance();
})();
