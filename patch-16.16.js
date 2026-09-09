
(() => {
  const APP_VERSION = '16.16';

  function updateVersionLabels(){
    const subtitle = document.querySelector('.subtitle');
    if(subtitle) subtitle.textContent = subtitle.textContent.replace(/Version\s+[\d.]+/, `Version ${APP_VERSION}`);
    document.querySelectorAll('.tag').forEach(tag => {
      if(/Schema\s+\d+\s+·\s+App\s+[\d.]+/.test(tag.textContent)){
        tag.textContent = tag.textContent.replace(/App\s+[\d.]+/, `App ${APP_VERSION}`);
      }
    });
  }
  updateVersionLabels();

  const baseSave = save;
  save = function(){
    baseSave();
    try{
      const backup = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || 'null');
      if(backup){
        backup.appVersion = APP_VERSION;
        localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backup));
      }
    }catch(_){ }
  };

  const style = document.createElement('style');
  style.textContent = `
    #financeCopyWrap{margin-top:2px}
    .copy-panel{border:1px solid #dbeafe;background:#eff6ff;border-radius:18px;padding:14px}
    .copy-panel-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px}
    .copy-panel-icon{width:40px;height:40px;display:grid;place-items:center;background:#dbeafe;border-radius:14px;color:#2563eb;font-size:22px;flex:0 0 auto}
    .copy-panel-title{font-size:15px;font-weight:800;color:var(--text);line-height:1.25}
    .copy-list{display:grid;gap:8px;margin-top:8px}
    .copy-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:14px;background:#fff}
    .copy-item-left{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
    .copy-item-left input{width:auto;min-width:auto;margin:0}
    .copy-name{font-weight:700;color:var(--text);word-break:break-word}
    .copy-item .amount{white-space:nowrap}
    .copy-item.disabled{opacity:.6;background:#f8fafc}
    .copy-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 8px;border-radius:999px;background:#e2e8f0;color:#475569;margin-top:4px}
    .copy-panel .actions{justify-content:flex-start}
    .copy-panel .tiny{line-height:1.35}
    #financeCopyHint{margin-top:2px}
    #financeCopyResult{margin-top:8px}
    @media(max-width:680px){
      .copy-item{align-items:flex-start;flex-direction:column}
      .copy-item-right{width:100%;display:flex;justify-content:flex-end}
    }
  `;
  document.head.appendChild(style);

  const financeFormEl = document.getElementById('financeForm');
  if(!financeFormEl || document.getElementById('financeCopyWrap')) return;
  const actionsWrap = financeFormEl.querySelector('.full.actions')?.parentElement || financeFormEl.querySelector('.actions')?.closest('.full') || financeFormEl.lastElementChild;
  const copyWrap = document.createElement('div');
  copyWrap.className = 'full';
  copyWrap.id = 'financeCopyWrap';
  copyWrap.style.display = 'none';
  copyWrap.innerHTML = `
    <div class="copy-panel">
      <div class="copy-panel-head">
        <div class="copy-panel-icon">⧉</div>
        <div>
          <div class="copy-panel-title">Ausgabe aus früherem Monat übernehmen</div>
          <div class="tiny">Kopiere vorhandene Ausgaben, statt alles neu einzutragen.</div>
        </div>
      </div>
      <div class="form-grid">
        <div>
          <label>Monat auswählen</label>
          <select id="financeCopySourceMonth"></select>
        </div>
        <div>
          <label>&nbsp;</label>
          <button type="button" id="financeCopyToggleAll">Alle auswählen</button>
        </div>
      </div>
      <div class="tiny" id="financeCopyHint"></div>
      <div class="tiny" id="financeCopyResult"></div>
      <div id="financeCopyList" class="copy-list"></div>
      <div class="tiny" style="margin-top:10px">Nur Ausgaben werden übernommen. Zahlungsstatus wird im Zielmonat auf „Nicht bezahlt“ gesetzt, damit du neu markieren kannst, was schon bezahlt ist.</div>
      <div class="actions"><button class="primary" type="button" id="financeCopyApplyBtn">Übernehmen (0 Einträge)</button></div>
    </div>`;
  actionsWrap.parentNode.insertBefore(copyWrap, actionsWrap);

  const copySourceMonth = document.getElementById('financeCopySourceMonth');
  const copyList = document.getElementById('financeCopyList');
  const copyHint = document.getElementById('financeCopyHint');
  const copyResult = document.getElementById('financeCopyResult');
  const copyApplyBtn = document.getElementById('financeCopyApplyBtn');
  const copyToggleAll = document.getElementById('financeCopyToggleAll');
  const targetMonthInput = document.getElementById('financeMonth');

  let copySource = '';
  let selectedIds = new Set();

  function monthLabel(month){
    if(!month) return '';
    const [y,m] = month.split('-').map(Number);
    return new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));
  }
  function expensesForMonth(month){
    return state.finance
      .filter(x => x.type === 'expense' && x.month === month)
      .sort((a,b) => String(a.name||'').localeCompare(String(b.name||''), 'de-DE'));
  }
  function sourceMonths(targetMonth){
    return [...new Set(state.finance.filter(x => x.type === 'expense' && x.month && x.month !== targetMonth).map(x => x.month))]
      .sort((a,b) => b.localeCompare(a));
  }
  function chooseDefaultSource(targetMonth, months){
    const previous = months.filter(m => m < targetMonth).sort((a,b) => b.localeCompare(a))[0];
    return previous || months[0] || '';
  }
  function existsInTarget(sourceEntry, targetMonth){
    return state.finance.some(x =>
      x.type === 'expense' &&
      x.month === targetMonth &&
      normName(x.name) === normName(sourceEntry.name) &&
      Number(x.amount || 0) === Number(sourceEntry.amount || 0) &&
      String(x.account || 'Sparkasse') === String(sourceEntry.account || 'Sparkasse')
    );
  }
  function eligibleEntries(targetMonth, month){
    return expensesForMonth(month).filter(entry => !existsInTarget(entry, targetMonth));
  }
  function updateCopyButton(){
    const targetMonth = targetMonthInput.value || activeFinanceMonth;
    const eligible = eligibleEntries(targetMonth, copySource);
    const validIds = new Set(eligible.map(x => x.id));
    selectedIds = new Set([...selectedIds].filter(id => validIds.has(id)));
    const count = selectedIds.size;
    copyApplyBtn.textContent = `Übernehmen (${count} ${count===1?'Eintrag':'Einträge'})`;
    copyApplyBtn.disabled = count === 0;
    copyToggleAll.textContent = count && count === eligible.length ? 'Auswahl aufheben' : 'Alle auswählen';
    copyToggleAll.disabled = eligible.length === 0;
  }
  function renderCopyList(resetSelection = false){
    const isExpense = financeType.value === 'expense';
    copyWrap.style.display = isExpense ? 'block' : 'none';
    if(!isExpense) return;

    const targetMonth = targetMonthInput.value || activeFinanceMonth;
    const months = sourceMonths(targetMonth);
    if(!months.length){
      copySource = '';
      copySourceMonth.innerHTML = '<option value="">Keine früheren Monate</option>';
      copySourceMonth.disabled = true;
      copyList.innerHTML = '<div class="tiny" style="padding:8px 2px">Es gibt noch keine früheren Ausgaben zum Übernehmen.</div>';
      copyHint.textContent = 'Lege zuerst Ausgaben in einem anderen Monat an.';
      copyResult.textContent = '';
      copyApplyBtn.textContent = 'Übernehmen (0 Einträge)';
      copyApplyBtn.disabled = true;
      copyToggleAll.disabled = true;
      copyToggleAll.textContent = 'Alle auswählen';
      return;
    }

    copySourceMonth.disabled = false;
    const nextSource = (!resetSelection && months.includes(copySource)) ? copySource : chooseDefaultSource(targetMonth, months);
    if(copySource !== nextSource || resetSelection){
      copySource = nextSource;
      selectedIds = new Set(eligibleEntries(targetMonth, copySource).map(x => x.id));
      copyResult.textContent = '';
    }
    copySourceMonth.innerHTML = months.map(month => `<option value="${month}">${monthLabel(month)}</option>`).join('');
    copySourceMonth.value = copySource;

    const rows = expensesForMonth(copySource);
    copyHint.textContent = `Quelle: ${monthLabel(copySource)} · Ziel: ${monthLabel(targetMonth)}`;
    if(!rows.length){
      copyList.innerHTML = '<div class="tiny" style="padding:8px 2px">In diesem Monat gibt es keine Ausgaben.</div>';
      updateCopyButton();
      return;
    }

    copyList.innerHTML = rows.map(entry => {
      const already = existsInTarget(entry, targetMonth);
      const checked = selectedIds.has(entry.id) ? 'checked' : '';
      return `
        <label class="copy-item ${already ? 'disabled' : ''}">
          <div class="copy-item-left">
            <input type="checkbox" class="finance-copy-check" data-id="${entry.id}" ${checked} ${already ? 'disabled' : ''}>
            <div>
              <div class="copy-name">${entry.name}</div>
              <div class="tiny">${entry.account || 'Sparkasse'}${already ? '' : ' · wird als „Nicht bezahlt“ kopiert'}</div>
              ${already ? '<div class="copy-badge">Schon im Zielmonat vorhanden</div>' : ''}
            </div>
          </div>
          <div class="copy-item-right"><span class="amount">${money(entry.amount)}</span></div>
        </label>`;
    }).join('');

    copyList.querySelectorAll('.finance-copy-check').forEach(check => {
      check.onchange = () => {
        if(check.checked) selectedIds.add(check.dataset.id);
        else selectedIds.delete(check.dataset.id);
        updateCopyButton();
      };
    });
    updateCopyButton();
  }

  copySourceMonth.addEventListener('change', () => {
    copySource = copySourceMonth.value || '';
    const targetMonth = targetMonthInput.value || activeFinanceMonth;
    selectedIds = new Set(eligibleEntries(targetMonth, copySource).map(x => x.id));
    copyResult.textContent = '';
    renderCopyList(false);
  });

  copyToggleAll.addEventListener('click', () => {
    const targetMonth = targetMonthInput.value || activeFinanceMonth;
    const eligible = eligibleEntries(targetMonth, copySource);
    const eligibleIds = eligible.map(x => x.id);
    const allSelected = eligibleIds.length && eligibleIds.every(id => selectedIds.has(id));
    selectedIds = allSelected ? new Set() : new Set(eligibleIds);
    renderCopyList(false);
  });

  copyApplyBtn.addEventListener('click', () => {
    const targetMonth = targetMonthInput.value || activeFinanceMonth;
    if(!targetMonth || !copySource) return;
    const selectedEntries = expensesForMonth(copySource).filter(x => selectedIds.has(x.id));
    if(!selectedEntries.length) return;
    let created = 0, skipped = 0;
    selectedEntries.forEach(entry => {
      if(existsInTarget(entry, targetMonth)){
        skipped++;
        return;
      }
      state.finance.push({
        id: uid(),
        month: targetMonth,
        type: 'expense',
        name: entry.name,
        amount: Number(entry.amount || 0),
        account: entry.account || 'Sparkasse',
        status: 'unpaid',
        paidAmount: 0
      });
      created++;
    });
    activeFinanceMonth = targetMonth;
    copyResult.className = 'tiny';
    copyResult.style.color = created ? '#166534' : '#b91c1c';
    copyResult.textContent = created
      ? `${created} ${created===1?'Eintrag wurde':'Einträge wurden'} in ${monthLabel(targetMonth)} übernommen${skipped ? ` · ${skipped} übersprungen` : ''}.`
      : 'Keine neuen Einträge übernommen – die ausgewählten Ausgaben gibt es im Zielmonat bereits.';
    financeModal.classList.remove('show');
    renderAll();
  });

  const baseOpenFinance = openFinance;
  openFinance = function(id){
    baseOpenFinance(id);
    copyResult.textContent = '';
    renderCopyList(true);
  };

  financeType.addEventListener('change', () => renderCopyList(true));
  targetMonthInput.addEventListener('change', () => renderCopyList(true));

  renderCopyList(true);
})();
