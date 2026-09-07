(() => {
  // 16.14: income receipt tracking is informational only and never changes finance totals.
  const baseNormalizeState = normalizeState;
  normalizeState = function(input){
    const receipts = input && input.incomeReceipts && typeof input.incomeReceipts === 'object' ? input.incomeReceipts : {};
    const out = baseNormalizeState(input);
    out.incomeReceipts = receipts;
    return out;
  };
  state = normalizeState(state);

  const baseSave = save;
  save = function(){
    baseSave();
    try{
      const backup = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || 'null');
      if(backup){
        backup.appVersion = '16.14';
        localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backup));
      }
    }catch(_){ }
  };

  const style = document.createElement('style');
  style.textContent = `
    .finance-section{border:1.25px solid #334155;border-radius:16px;padding:0 12px;margin-bottom:12px;background:#fff}
    .finance-section .row:last-child{border-bottom:0}
    .income-receipt-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:9px 0 4px}
    .income-receipt-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px;padding:8px;min-width:0}
    .income-receipt-stat b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .receipt-status{box-shadow:none;padding:5px 8px;border-radius:999px;font-size:11px;line-height:1.15;background:#f1f5f9;color:#475569;white-space:nowrap}
    .receipt-status.received{background:#dcfce7;color:#166534}
    .receipt-status.partial{background:#fef3c7;color:#92400e}
    .income-row-main{min-width:0;flex:1}
    .income-row-main .tiny{margin-top:3px}
    .receipt-row-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    @media(max-width:420px){.income-receipt-summary{grid-template-columns:1fr}.receipt-row-actions{align-items:flex-end;flex-direction:column}.receipt-status{max-width:160px;overflow:hidden;text-overflow:ellipsis}}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal" id="incomeReceiptModal">
      <div class="sheet">
        <div class="sheet-head"><h3>Einnahme – Eingang</h3><button type="button" id="closeIncomeReceiptModal">✕</button></div>
        <form id="incomeReceiptForm" class="form-grid">
          <input type="hidden" id="incomeReceiptKey">
          <input type="hidden" id="incomeReceiptMonth">
          <input type="hidden" id="incomeReceiptTotal">
          <div class="full"><div class="card" style="padding:12px;box-shadow:none"><b id="incomeReceiptName"></b><div class="tiny" id="incomeReceiptExpected"></div></div></div>
          <div class="full"><label>Status</label><select id="incomeReceiptStatus"><option value="pending">Ausstehend</option><option value="partial">Teilweise erhalten</option><option value="received">Erhalten</option></select></div>
          <div id="incomeReceiptAmountWrap"><label>Bereits erhalten €</label><input type="number" min="0" step="0.01" id="incomeReceiptAmount" value="0"></div>
          <div><label>Datum des Eingangs</label><input type="date" id="incomeReceiptDate"></div>
          <div class="full tiny">Nur zur Organisation. Einnahmen, Ausgaben, Sparbetrag und Jahreswerte werden dadurch nicht verändert.</div>
          <div class="full actions"><button class="primary" type="submit">Speichern</button></div>
        </form>
      </div>
    </div>
  `);

  function receiptBucket(month){
    if(!state.incomeReceipts || typeof state.incomeReceipts !== 'object') state.incomeReceipts = {};
    if(!state.incomeReceipts[month] || typeof state.incomeReceipts[month] !== 'object') state.incomeReceipts[month] = {};
    return state.incomeReceipts[month];
  }
  function receiptFor(month,key){
    return receiptBucket(month)[key] || {status:'pending',receivedAmount:0,date:''};
  }
  function receivedAmountFor(month,key,total){
    const r = receiptFor(month,key), amount = Math.max(0,Number(total||0));
    if(r.status === 'received') return amount;
    if(r.status === 'partial') return Math.min(amount,Math.max(0,Number(r.receivedAmount||0)));
    return 0;
  }
  function germanReceiptDate(value){
    if(!value) return '';
    const [y,m,d]=value.split('-');
    return y&&m&&d ? `${d}.${m}.${y}` : value;
  }
  function receiptLabel(month,key,total){
    const r=receiptFor(month,key);
    if(r.status==='received') return {cls:'received',text:`✓ Erhalten${r.date?' · '+germanReceiptDate(r.date):''}`};
    if(r.status==='partial') return {cls:'partial',text:`Teilweise · ${money(receivedAmountFor(month,key,total))}`};
    return {cls:'',text:'Ausstehend'};
  }

  const receiptModal=document.getElementById('incomeReceiptModal');
  const receiptForm=document.getElementById('incomeReceiptForm');
  const receiptStatus=document.getElementById('incomeReceiptStatus');
  const receiptAmountWrap=document.getElementById('incomeReceiptAmountWrap');
  const receiptAmount=document.getElementById('incomeReceiptAmount');
  const receiptDate=document.getElementById('incomeReceiptDate');

  function syncReceiptFields(){
    receiptAmountWrap.style.display=receiptStatus.value==='partial'?'block':'none';
  }
  receiptStatus.addEventListener('change',syncReceiptFields);
  document.getElementById('closeIncomeReceiptModal').onclick=()=>receiptModal.classList.remove('show');
  receiptModal.addEventListener('click',e=>{if(e.target===receiptModal)receiptModal.classList.remove('show')});

  function openIncomeReceipt(month,key,name,total){
    const r=receiptFor(month,key);
    document.getElementById('incomeReceiptKey').value=key;
    document.getElementById('incomeReceiptMonth').value=month;
    document.getElementById('incomeReceiptTotal').value=Number(total||0);
    document.getElementById('incomeReceiptName').textContent=name;
    document.getElementById('incomeReceiptExpected').textContent=`Erwartet: ${money(total)}`;
    receiptStatus.value=['pending','partial','received'].includes(r.status)?r.status:'pending';
    receiptAmount.value=Number(r.receivedAmount||0);
    receiptAmount.max=String(Math.max(0,Number(total||0)));
    receiptDate.value=r.date||'';
    syncReceiptFields();
    receiptModal.classList.add('show');
  }

  receiptForm.onsubmit=e=>{
    e.preventDefault();
    const key=document.getElementById('incomeReceiptKey').value;
    const month=document.getElementById('incomeReceiptMonth').value;
    const total=Math.max(0,Number(document.getElementById('incomeReceiptTotal').value||0));
    const status=receiptStatus.value;
    let receivedAmount=0,date=receiptDate.value||'';
    if(status==='partial') receivedAmount=Math.min(total,Math.max(0,Number(receiptAmount.value||0)));
    if(status==='received'){
      receivedAmount=total;
      if(!date) date=iso(new Date());
    }
    if(status==='pending') date='';
    receiptBucket(month)[key]={status,receivedAmount,date};
    save();
    receiptModal.classList.remove('show');
    renderFinance();
  };

  const baseRenderFinance=renderFinance;
  renderFinance=function(){
    baseRenderFinance();
    const f=effectiveFinanceSummary(activeFinanceMonth);
    const month=activeFinanceMonth;

    const automaticEntries=Object.entries(f.automatic).filter(([,amount])=>Number(amount)>0).map(([name,amount])=>({key:`auto:${name}`,name,amount:Number(amount),automatic:true}));
    const manualEntries=f.rows.filter(x=>x.type==='income').map(x=>({key:`manual:${x.id}`,id:x.id,name:x.name,amount:Number(x.amount),automatic:false}));
    const allIncomeEntries=[...automaticEntries,...manualEntries];
    const receivedTotal=allIncomeEntries.reduce((sum,x)=>sum+receivedAmountFor(month,x.key,x.amount),0);
    const openTotal=Math.max(0,f.displayIncome-receivedTotal);

    const incomeHtml=allIncomeEntries.map(x=>{
      const label=receiptLabel(month,x.key,x.amount);
      const detail=x.automatic?'Automatisch aus Kalender und Gehalt':'';
      return `<div class="row${x.automatic?'':' finance-row'}"${x.id?` data-id="${x.id}"`:''}><div class="income-row-main"><span>${x.name}</span>${detail?`<div class="tiny">${detail}</div>`:''}</div><div class="receipt-row-actions"><button type="button" class="receipt-status ${label.cls}" data-receipt-key="${x.key}" data-receipt-name="${String(x.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-receipt-amount="${x.amount}">${label.text}</button><span class="amount">${money(x.amount)}</span></div></div>`;
    }).join('');

    const expenses=f.rows.filter(x=>x.type==='expense').map(x=>`<div class="row finance-row ${x.status!=='unpaid'?'expense-paid':''}" data-id="${x.id}"><div><span>${x.name}</span><div class="tiny">${x.account} · ${paidLabel(x)}${x.seriesId?' · Wiederkehrend':''}</div></div><span class="amount">${money(x.amount)}</span></div>`).join('');
    const remClass=f.displayRemaining>0?'positive':f.displayRemaining<0?'negative':'';

    document.getElementById('financeList').innerHTML=`
      <div class="finance-section">
        <div class="row"><b>Einnahmen gesamt</b><span class="amount positive">${money(f.displayIncome)}</span></div>
        <div class="income-receipt-summary">
          <div class="income-receipt-stat"><span class="tiny">Erwartet</span><b>${money(f.displayIncome)}</b></div>
          <div class="income-receipt-stat"><span class="tiny">Erhalten</span><b class="positive">${money(receivedTotal)}</b></div>
          <div class="income-receipt-stat"><span class="tiny">Noch offen</span><b>${money(openTotal)}</b></div>
        </div>
        ${incomeHtml||'<div class="tiny" style="padding:12px 0">Keine Einnahmen in diesem Monat.</div>'}
      </div>
      <div class="finance-section">
        <div class="row"><b>Ausgaben</b><span class="amount negative">${money(f.expense)}</span></div>
        ${(()=>{
          const expenseRows=f.rows.filter(x=>x.type==='expense');
          const paidExpenseTotal=expenseRows.reduce((sum,x)=>{
            if(x.status==='paid') return sum+Number(x.amount||0);
            if(x.status==='partial') return sum+Math.min(Number(x.amount||0),Math.max(0,Number(x.paidAmount||0)));
            return sum;
          },0);
          const openExpenseTotal=Math.max(0,f.expense-paidExpenseTotal);
          return `<div class="income-receipt-summary">
            <div class="income-receipt-stat"><span class="tiny">Geplant</span><b>${money(f.expense)}</b></div>
            <div class="income-receipt-stat"><span class="tiny">Bezahlt</span><b class="negative">${money(paidExpenseTotal)}</b></div>
            <div class="income-receipt-stat"><span class="tiny">Noch offen</span><b>${money(openExpenseTotal)}</b></div>
          </div>`;
        })()}
        ${expenses||'<div class="tiny" style="padding:12px 0">Keine Ausgaben in diesem Monat.</div>'}
      </div>
      <div class="row"><div><b>In diesem Monat gespart</b><div class="tiny">Automatisch: Einnahmen minus Ausgaben</div></div><span class="amount ${remClass}">${money(f.displayRemaining)}</span></div>`;

    document.querySelectorAll('#financeList .finance-row').forEach(x=>x.onclick=()=>openFinance(x.dataset.id));
    document.querySelectorAll('#financeList [data-receipt-key]').forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      openIncomeReceipt(month,btn.dataset.receiptKey,btn.dataset.receiptName,Number(btn.dataset.receiptAmount||0));
    });
  };

  // Re-render once so the new sections and receipt controls appear immediately.
  renderFinance();
})();
