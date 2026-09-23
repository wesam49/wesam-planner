
(() => {
  const APP_VERSION='16.19';

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

  const style=document.createElement('style');
  style.textContent=`
    .payment-source-block{border-top:1px solid #e2e8f0;margin-top:4px;padding:12px 0 4px}
    .payment-source-title{font-size:11px;color:var(--muted);font-weight:700;margin-bottom:8px}
    .payment-source-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
    .payment-source-stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px;padding:8px;min-width:0}
    .payment-source-stat span{display:block;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .payment-source-stat b{display:block;font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:560px){.payment-source-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  function renderPaymentSourceSummary(){
    const list=document.getElementById('financeList');
    if(!list) return;
    list.querySelectorAll('.payment-source-block').forEach(x=>x.remove());

    const sections=list.querySelectorAll('.finance-section');
    const expenseSection=sections[1];
    if(!expenseSection) return;

    const f=effectiveFinanceSummary(activeFinanceMonth);
    const totals={Sparkasse:0,Revolut:0,Bargeld:0,Sonstiges:0};
    f.rows.filter(x=>x.type==='expense').forEach(x=>{
      const account=String(x.account||'Sonstiges');
      const key=Object.prototype.hasOwnProperty.call(totals,account)?account:'Sonstiges';
      totals[key]+=Number(x.amount||0);
    });

    const block=document.createElement('div');
    block.className='payment-source-block';
    block.innerHTML=`
      <div class="payment-source-title">Ausgaben nach Zahlungsquelle</div>
      <div class="payment-source-summary">
        <div class="payment-source-stat"><span>Sparkasse</span><b>${money(totals.Sparkasse)}</b></div>
        <div class="payment-source-stat"><span>Revolut</span><b>${money(totals.Revolut)}</b></div>
        <div class="payment-source-stat"><span>Bargeld</span><b>${money(totals.Bargeld)}</b></div>
        <div class="payment-source-stat"><span>Sonstiges</span><b>${money(totals.Sonstiges)}</b></div>
      </div>`;
    expenseSection.appendChild(block);
  }

  const previousRenderFinance=renderFinance;
  renderFinance=function(){
    previousRenderFinance();
    renderPaymentSourceSummary();
  };

  renderFinance();
})();
