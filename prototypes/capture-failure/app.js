// UI exploration only. No network, storage, or production imports.
const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m9 3-.6 3-2.5 1-2.6-1.1-2 3.5L3.7 12l-2.4 2.6 2 3.5L6 17l2.5 1 .6 3h4l.6-3 2.5-1 2.6 1.1 2-3.5L20.3 12l2.4-2.6-2-3.5L18 7l-2.5-1-.6-3Z" transform="translate(1 0) scale(.91 1)"/>',
  alert: '<path d="m10.3 4-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  refresh: '<path d="M20 8a8 8 0 1 0 .5 7M20 3v5h-5"/>',
  loader: '<path d="M12 3a9 9 0 1 0 9 9"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m21 16-6-6L3 21"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Zm3 5h6m-6 4h6"/>',
  coffee: '<path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm12 1h2a3 3 0 0 1 0 6h-2M7 2v2m5-2v2"/>',
  train: '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 18l-2 3m8-3 2 3M8 14h.01M16 14h.01M12 3v7"/>',
  bag: '<path d="M4 7h16l-1 14H5Zm4 0V6a4 4 0 0 1 8 0v1"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  desktop: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-4 0h8"/>',
  mobile: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  edit: '<path d="m15 5 4 4M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15ZM4 20h8"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10s-8-5-8-10V6Z"/><path d="m8 12 3 3 5-6"/>',
};
function icon(name, size = 16, extra = '') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${extra}">${icons[name] || icons.receipt}</svg>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
const variants = {
  A: { number:'01', name:'Keep it in the feed', description:'Persistent cards beside recent expenses. The smallest change to the current Home screen.', note:'Start here. Keep the failed capture in its original place, and keep a completed capture visible until its remaining items are saved or ignored. Saved expenses appear below immediately.' },
  B: { number:'02', name:'Give captures their own space', description:'An activity panel keeps capture outcomes available while the expense list stays focused.', note:'For frequent captures. An attention count brings users back to unresolved work. Closing the panel does not resolve anything. On mobile, the panel becomes a full-width section.' },
  C: { number:'03', name:'Make recovery a focused task', description:'A review inbox pairs each capture with its source, results, and next steps.', note:'For larger batches. A dedicated review space makes item-by-item correction easier. It adds a destination and more navigation, so it is a larger change to the current app.' },
};
const scenarioNames = ['both','active','failed','partial','empty','unknown','success'];
const params = new URLSearchParams(location.search);
const state = {
  variant: Object.hasOwn(variants, params.get('variant')) ? params.get('variant') : 'A',
  scenario: scenarioNames.includes(params.get('scenario')) ? params.get('scenario') : 'both',
  view: params.get('view') === 'components' ? 'components' : 'context',
  pendingDesign: params.get('pending') === 'proposed' ? 'proposed' : 'current',
  device: 'desktop', expanded: false, panelOpen: true, selected: 'partial', filter:'attention',
  failure: 'failed', resolution: {}, manual: {}, retryExpenses: [], retryTimer:null, generation:0,
};
const failureItems = [
  {id:'lunch',title:'Lunch at Lofthus',reason:'The total is unclear.',source:'Lofthus Samvirkelag · Total: 1?8,00 NOK',suggestions:['178.00','198.00'],merchant:'Lofthus Samvirkelag',currency:'NOK',date:'2026-11-15',category:'Food & drink',amount:''},
  {id:'taxi',title:'Taxi to the station',reason:'The currency is missing.',source:'Taxi to Oslo S · 245 · Sunday evening',suggestions:['NOK','EUR'],merchant:'Oslo Taxi',currency:'',date:'2026-11-15',category:'Transport',amount:'245.00'},
];
const baseExpenses = [
  {id:'coffee',title:'Coffee at Fuglen',category:'Food & drink',amount:5800,glyph:'coffee'},
  {id:'train',title:'Train to Oslo S',category:'Transport',amount:12400,glyph:'train'},
  {id:'groceries',title:'Groceries at Rema 1000',category:'Groceries',amount:38650,glyph:'bag'},
];
function activeVisible() { return ['both','active'].includes(state.scenario); }
function partialVisible() { return ['both','partial','empty','success'].includes(state.scenario); }
function failedVisible() { return ['both','failed','unknown'].includes(state.scenario) && state.failure !== 'dismissed'; }
function unresolved() { return state.scenario === 'success' ? [] : failureItems.filter(i => !state.resolution[i.id]); }
function savedBase() { return state.scenario === 'empty' ? 0 : 3; }
function savedCount() { return savedBase() + Object.values(state.resolution).filter(x => x === 'saved').length; }
function attentionCount() { return (failedVisible() && !['saved','retrying'].includes(state.failure) ? 1 : 0) + (partialVisible() && unresolved().length ? 1 : 0); }
function money(cents) { return new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}).format(cents / 100); }
function actionButton(label, action, css = '', attrs = '') { return `<button class="button ${css}" data-action="${action}" ${attrs}>${label}</button>`; }
function receipt(blurry = false) { return `<div class="receipt-thumb ${blurry ? 'blurry' : ''}" aria-hidden="true"><div class="receipt-paper"><i></i><i></i><i></i><i></i><i></i></div></div>`; }
function sourceRow(kind = 'failed') {
  if (kind === 'active') return `<div class="source-row">${receipt()}<div class="source-meta"><strong>Grocery receipt</strong><small>grocery-receipt.jpg · Personal</small></div><button class="source-open" data-action="source" data-kind="active" aria-label="View grocery receipt">${icon('eye',15)}</button></div>`;
  const partial = kind === 'partial';
  return `<div class="source-row">${receipt(partial)}<div class="source-meta"><strong>${partial ? 'Sunday in Oslo' : 'Dinner receipt'}</strong><small>${partial ? 'Text + receipt · Personal' : 'dinner-receipt.jpg · Personal'}</small></div><button class="source-open" data-action="source" data-kind="${kind}" aria-label="View ${partial ? 'Sunday in Oslo source' : 'dinner receipt'}">${icon('eye',15)}</button></div>`;
}
// Visual revision of PendingCapture using the failure card's header and source layout.
function currentPendingCapture() {
  return `<div class="capture-card current-pending-capture" role="status" aria-live="polite" aria-atomic="true" aria-label="Current pending capture"><header><span class="badge">${icon('loader',14,'progress-spinner')} Pending entry</span></header><div class="card-body"><ul class="current-pending-files"><li class="source-row">${receipt()}<div class="source-meta"><strong title="grocery-receipt.jpg">grocery-receipt.jpg</strong></div><button class="source-open" data-action="source" data-kind="active" aria-label="View uploaded photo">${icon('eye',15)}</button></li></ul><p class="error-copy current-pending-description">Groceries at Kiwi</p></div><div class="current-pending-footer"><p>Running AI analysis...</p><span>Not saved yet</span></div></div>`;
}
function activeCard() {
  return state.pendingDesign === 'current' ? currentPendingCapture() : proposedActiveCard();
}
function proposedActiveCard() {
  return `<article class="capture-card active-capture" aria-label="Active capture"><header><span class="badge processing">${icon('refresh',14,'progress-spinner')} Capturing expenses</span><time>Just now</time></header><div class="card-body">${sourceRow('active')}<p class="error-copy">Reading your receipt and finding expense details.</p><ol class="capture-steps" aria-label="Capture progress"><li class="done">${icon('checkCircle',12)} Uploaded</li><li class="current" aria-current="step"><span class="step-dot"></span>Reading receipt</li><li>${icon('clock',12)} Saving</li></ol></div><footer class="card-footer processing"><span class="footer-status">${icon('clock',12)} You can keep using the app.</span></footer></article>`;
}
function failedCard() {
  if (state.failure === 'dismissed') return '';
  if (state.failure === 'saved') return `<article class="capture-card"><header><span class="badge success">${icon('checkCircle',14)} Capture complete</span><time>Just now</time></header><div class="card-body">${sourceRow()}<p class="error-copy">Your dinner expense is now in recent expenses.</p></div><footer class="card-footer success"><span class="footer-status">${icon('check',12)} 1 expense saved</span>${actionButton('View expense','view-expenses','text')}</footer></article>`;
  const retrying = state.failure === 'retrying';
  const unknown = state.scenario === 'unknown';
  return `<article class="capture-card"><header><span class="badge ${retrying || unknown ? 'neutral' : 'danger'}">${icon(retrying ? 'refresh' : unknown ? 'info' : 'error',14,retrying ? 'progress-spinner' : '')} ${retrying ? 'Trying again' : unknown ? 'Completion not confirmed' : 'Capture failed'}</span><time>2 min ago</time></header><div class="card-body">${sourceRow()}<p class="error-copy">${retrying ? 'Reading your receipt. You can keep using the app.' : unknown ? 'We lost confirmation while saving. Check recent expenses before trying again.' : 'We couldn’t read your receipt because the service was unavailable. Try again in a moment.'}</p></div><footer class="card-footer ${retrying || unknown ? 'neutral' : ''}"><span class="footer-status">${icon(retrying ? 'clock' : unknown ? 'info' : 'shield',12)} ${retrying ? 'Processing receipt' : unknown ? 'Save outcome unknown' : 'No expenses added'}</span><div class="card-actions">${!retrying ? actionButton('Dismiss','dismiss','ghost','aria-label="Dismiss failed capture"') : ''}${actionButton(retrying ? 'Retrying…' : unknown ? 'Check expenses' : `${icon('refresh',12)} Try again`,unknown ? 'check-unknown' : 'retry',unknown ? '' : 'soft-red', retrying ? 'disabled' : '')}</div></footer></article>`;
}
function counts() {
  const count = unresolved().length;
  return `<div class="summary-counts"><span class="${savedCount() > 0 ? 'saved-count' : 'muted'}">${icon(savedCount() > 0 ? 'checkCircle' : 'receipt',13)} ${savedCount()} saved</span><span class="summary-divider"></span><span class="${count ? 'review-count' : 'muted'}">${icon(count ? 'alert' : 'check',13)} ${count ? `${count} ${count === 1 ? 'needs' : 'need'} review` : 'Nothing to review'}</span></div>`;
}
function itemRow(item) {
  const resolution = state.resolution[item.id];
  if (resolution) return `<div class="failure-item ${resolution === 'saved' ? 'resolved-item' : ''}"><span class="item-symbol">${icon(resolution === 'saved' ? 'check' : 'close',13)}</span><div class="item-content"><h4>${escapeHtml(item.title)}</h4><p class="reason">${resolution === 'saved' ? `Saved · ${money(state.manual[item.id].amount)} ${escapeHtml(state.manual[item.id].currency)}` : 'Ignored · No expense added'}</p>${resolution === 'ignored' ? `<div class="item-actions"><button data-action="undo-ignore" data-item="${item.id}">Undo ignore</button></div>` : ''}</div></div>`;
  return `<div class="failure-item"><span class="item-symbol">${icon('alert',13)}</span><div class="item-content"><h4>${item.title}</h4><p class="reason">${item.reason}</p><blockquote class="source-quote">${item.source}</blockquote><div class="item-actions"><button data-action="fix" data-item="${item.id}">${icon('edit',11)} ${item.id === 'lunch' ? 'Add the total' : 'Choose currency'}</button><button data-action="ignore" data-item="${item.id}">Ignore</button></div></div></div>`;
}
function partialCard({forceExpanded = false} = {}) {
  const remaining = unresolved().length;
  const expanded = forceExpanded || state.expanded;
  const success = !remaining;
  const empty = !savedCount();
  return `<article class="capture-card"><header><span class="badge ${success ? 'success' : 'warning'}">${icon(success ? 'checkCircle' : 'alert',14)} ${success ? 'Capture complete' : 'Capture complete · Review needed'}</span><time>5 min ago</time></header><div class="card-body">${sourceRow('partial')}${counts()}${empty && remaining ? '<p class="error-copy">Processing finished, but neither item could be saved. Add the missing details below.</p>' : ''}</div>${expanded && state.scenario !== 'success' ? `<div class="items-panel">${failureItems.map(itemRow).join('')}</div>` : ''}<footer class="card-footer ${success ? 'success' : 'warning'}"><span class="footer-status">${icon(success ? 'check' : 'info',12)} ${success ? (savedCount() ? 'Saved expenses are ready' : 'Review finished · Nothing saved') : `${remaining} ${remaining === 1 ? 'item not' : 'items not'} saved`}</span>${remaining ? actionButton(`${expanded ? 'Hide details' : `Review ${remaining} ${remaining === 1 ? 'item' : 'items'}`} ${icon(expanded ? 'up' : 'chevron',11)}`,'expand','',`aria-expanded="${expanded}"`) : actionButton('View expenses','view-expenses','text')}</footer></article>`;
}
function currentExpenses() {
  const included = state.scenario === 'empty' ? [] : [...baseExpenses];
  return [...state.retryExpenses, ...Object.entries(state.manual).map(([id,expense]) => ({id,...expense,glyph:'receipt'})), ...included];
}
function expenseList({standalone = false} = {}) {
  const expenses = currentExpenses();
  const totalByCurrency = new Map();
  for (const expense of expenses) { const currency = expense.currency || 'NOK'; totalByCurrency.set(currency,(totalByCurrency.get(currency) || 0) + expense.amount); }
  return `<section class="expense-list" aria-label="Saved expenses"><div class="section-label"><span>${standalone ? 'Saved expenses' : 'Today'}</span><small>${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}</small></div>${expenses.map(e => `<div class="expense-row"><span class="expense-glyph">${icon(e.glyph,15)}</span><div class="expense-text"><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.category)} · Personal</small></div><span class="amount">${money(e.amount)}<small>${escapeHtml(e.currency || 'NOK')}</small></span></div>`).join('')}${expenses.length ? `<div class="expenses-total"><span>Saved total</span><strong>${[...totalByCurrency].map(([c,n]) => `${money(n)} ${c}`).join(' · ')}</strong></div>` : '<p class="error-copy">No saved expenses in this example.</p>'}</section>`;
}
function composer() {
  return `<div class="capture-column"><div class="capture-composer"><div class="composer-main"><div class="composer-icon">${icon('sparkles',17)}</div><h3>What did you spend?</h3><p>Add a receipt or describe your expenses.<br>We’ll take care of the details.</p><textarea id="capture-draft" aria-label="Describe an expense" placeholder="Coffee 58 kr, train ticket 124 kr…"></textarea><div class="composer-tools"><span>${icon('folder',12)} Personal ${icon('down',10)}</span><div><button data-action="sample-upload" aria-label="Try a sample receipt">${icon('image',16)}</button><button data-action="voice-info" aria-label="About voice capture in this prototype">${icon('mic',16)}</button></div></div></div><div class="composer-bottom"><button class="text-button" data-action="manual">${icon('plus',12)} Add manually</button>${actionButton(`${icon('arrow',12)} Capture`,'sample-capture','primary')}</div></div><p class="composer-hint">A photo, a few words, or a quick note.<br>Your expenses, without the admin.</p></div>`;
}
function sidebar() {
  const entries = [['home','Home'],['list','Expenses'],['folder','Collections'],['settings','Settings']];
  return `<aside class="app-sidebar"><div class="app-logo">expenses<span class="blue">.</span></div><nav class="app-nav" aria-label="Example app navigation">${entries.map(([glyph,label],i)=>`<button class="${i===0 && state.variant!=='C' ? 'active' : ''}" data-action="nav" data-destination="${label}">${icon(glyph,17)}${label}</button>`).join('')}${state.variant === 'C' ? `<button class="active" data-action="focus-inbox">${icon('checkCircle',17)}Capture review <span class="count">${attentionCount()}</span></button>` : ''}</nav><div><div class="collection-label">Collections</div><div class="collection-link"><span class="collection-dot"></span>Personal</div><div class="collection-link"><span class="collection-dot orange"></span>Work</div></div><div class="sidebar-bottom"><span class="avatar">KL</span>Kristian’s workspace</div></aside>`;
}
function mobileNav() {
  return `<nav class="mobile-nav" aria-label="Example mobile navigation">${[['home','Home'],['list','Expenses'],['folder','Collections'],['settings','Settings']].map(([i,l])=>`<button class="${l==='Home'?'active':''}" data-action="nav" data-destination="${l}">${icon(i,16)}${l}</button>`).join('')}</nav>`;
}
function pageTitle(title = 'Recent expenses', extra = '') { return `<div class="page-topline"><div><h2>${title}</h2>${state.variant === 'C' ? '<p class="inbox-intro">Finish the expenses that need your attention.</p>' : '<p>Capture the little things. Keep the full picture.</p>'}</div>${extra || '<span class="date-label">Sunday, 15 November</span>'}</div>`; }
function cards() { return `${activeVisible() ? activeCard() : ''}${failedVisible() ? failedCard() : ''}${partialVisible() ? partialCard() : ''}${!activeVisible() && !failedVisible() && !partialVisible() ? '<div class="empty-resolved">'+icon('checkCircle',23)+'<strong>Nothing needs your attention</strong><p>The capture was dismissed. Saved expenses stay in your list.</p></div>' : ''}`; }
function variantA() {
  return `${pageTitle()}<div class="home-grid">${composer()}<div><div class="section-label"><span>Recent captures</span><small>${attentionCount() ? `${attentionCount()} ${attentionCount() === 1 ? 'capture needs' : 'captures need'} attention` : activeVisible() ? '1 capture in progress' : 'Up to date'}</small></div>${cards()}${expenseList()}</div></div>`;
}
function variantB() {
  const trigger = `<button class="activity-trigger" data-action="toggle-panel" aria-expanded="${state.panelOpen}">${icon('clock',13)} Captures ${attentionCount() ? `<span class="count">${attentionCount()}</span>` : icon('check',12)}</button>`;
  if (!state.panelOpen) return `<div class="closed-activity">${pageTitle('Recent expenses',trigger)}${attentionCount() ? `<div class="notice-banner">${icon('alert',17)}<div><strong>${attentionCount()} ${attentionCount() === 1 ? 'capture needs' : 'captures need'} attention</strong><p>Open capture activity to pick up where you left off.</p></div><button data-action="toggle-panel">Review ${icon('arrow',12)}</button></div>` : ''}<div class="home-grid">${composer()}${expenseList()}</div></div>`;
  const showActive = activeVisible() && state.filter === 'all';
  const showFailed = failedVisible() && (state.filter === 'all' || !['saved'].includes(state.failure));
  const showPartial = partialVisible() && (state.filter === 'all' || unresolved().length);
  return `<div class="activity-layout"><div class="activity-workspace">${pageTitle('Recent expenses',trigger)}<div class="home-grid">${composer()}${expenseList()}</div></div><aside class="activity-panel" aria-label="Capture activity"><header><div class="panel-title"><span>Capture activity</span><button data-action="toggle-panel" aria-label="Close capture activity">${icon('close',15)}</button></div><p class="panel-subtitle">Your captures, from upload to saved.${activeVisible() ? ' 1 in progress.' : ''}</p><div class="activity-filters"><button data-action="filter" data-filter="attention" class="${state.filter === 'attention' ? 'selected' : ''}" aria-pressed="${state.filter === 'attention'}">Needs attention ${attentionCount()}</button><button data-action="filter" data-filter="all" class="${state.filter === 'all' ? 'selected' : ''}" aria-pressed="${state.filter === 'all'}">All captures</button></div></header><div class="activity-content"><div class="activity-day">TODAY</div>${showActive ? activeCard() : ''}${showFailed ? failedCard() : ''}${showPartial ? partialCard() : ''}${!showActive && !showFailed && !showPartial ? `<div class="empty-resolved">${icon('checkCircle',24)}<strong>${activeVisible() ? 'No captures need attention' : 'You’re all caught up'}</strong><p>Open All captures to see ${activeVisible() ? 'the capture in progress' : 'completed and resolved results'}.</p></div>` : ''}</div></aside></div>`;
}
function inboxEntry(kind) {
  if (kind === 'active') return `<button class="inbox-entry active-capture ${state.selected === kind ? 'selected' : ''}" data-action="select-capture" data-kind="active" aria-pressed="${state.selected === kind}"><span class="inbox-icon">${icon('refresh',16,'progress-spinner')}</span><span class="entry-info"><strong>Grocery receipt</strong><small>1 receipt · Just now</small><span class="badge processing">Reading receipt</span></span>${icon('chevron',12)}</button>`;
  const partial = kind === 'partial';
  const resolved = partial ? !unresolved().length : state.failure === 'saved';
  return `<button class="inbox-entry ${partial ? 'partial' : ''} ${state.selected === kind ? 'selected' : ''}" data-action="select-capture" data-kind="${kind}" aria-pressed="${state.selected === kind}"><span class="inbox-icon">${icon(resolved ? 'checkCircle' : partial ? 'alert' : 'error',16)}</span><span class="entry-info"><strong>${partial ? 'Sunday in Oslo' : 'Dinner receipt'}</strong><small>${partial ? 'Text + receipt · 5 min ago' : '1 receipt · 2 min ago'}</small><span class="badge ${resolved ? 'success' : partial ? 'warning' : 'danger'}">${resolved ? 'Review complete' : partial ? `${savedCount()} saved · ${unresolved().length} to review` : state.scenario === 'unknown' ? 'Outcome unknown' : state.failure === 'retrying' ? 'Retrying…' : 'Capture failed'}</span></span>${icon('chevron',12)}</button>`;
}
function inboxDetail() {
  if (state.selected === 'active') return `<div class="detail-eyebrow">CAPTURE / GROCERY RECEIPT</div><h3>Your receipt is being read.</h3><p class="detail-description">Saved expenses will appear when processing finishes. Any items that need your help will stay here for review.</p><div class="active-detail">${activeCard()}</div>`;
  if (state.selected === 'failed') {
    const unknown = state.scenario === 'unknown';
    const saved = state.failure === 'saved';
    return `<div class="detail-eyebrow">CAPTURE / DINNER RECEIPT</div><h3>${saved ? 'Your dinner expense is saved.' : unknown ? 'Check whether this expense saved.' : 'Let’s try that receipt again.'}</h3><p class="detail-description">${saved ? 'The retry completed successfully.' : unknown ? 'We didn’t receive confirmation from the saving step.' : 'A temporary service problem stopped this capture.'}</p>${sourceRow()}${saved ? `<div class="saved-strip">${icon('checkCircle',15)} 1 expense saved · Dinner at Hrimnir · 328.00 NOK</div>` : `<div class="danger-box ${unknown ? 'neutral' : ''}">${icon(unknown ? 'info' : 'error',15)} ${unknown ? 'Some expenses may already have been saved. Check the saved list before trying again to avoid duplicates.' : 'No expenses were added from this attempt. Your source is still available in this session.'}</div>`}<div class="detail-actions">${saved ? actionButton('View expense','view-expenses','primary') : actionButton(state.failure === 'retrying' ? 'Retrying…' : unknown ? 'Check saved expenses' : `${icon('refresh',13)} Try again`,unknown ? 'check-unknown' : 'retry','primary',state.failure === 'retrying' ? 'disabled' : '')}${!saved && !unknown ? actionButton('Add manually','manual') : ''}${!saved ? actionButton('Dismiss capture','dismiss','ghost') : ''}</div>`;
  }
  const remaining = unresolved().length;
  return `<div class="detail-eyebrow">CAPTURE / SUNDAY IN OSLO</div><h3>${remaining ? (savedCount() ? 'A few details need your help.' : 'Nothing saved yet. Let’s finish this.') : 'Everything is reviewed.'}</h3><p class="detail-description">${remaining ? 'Review each unsaved item using the original text below.' : 'Your saved expenses are ready. Ignored items have not been added.'}</p>${counts()}${savedCount() ? `<div class="saved-strip">${icon('checkCircle',15)} ${savedCount()} ${savedCount() === 1 ? 'expense is' : 'expenses are'} already saved.${actionButton('View','view-expenses','text')}</div>` : ''}<div class="items-panel">${state.scenario === 'success' ? `<div class="empty-resolved">${icon('checkCircle',24)}<strong>All 3 expenses saved</strong><p>There are no extraction failures in this capture.</p></div>` : failureItems.map(itemRow).join('')}</div><div class="detail-actions">${actionButton(`${icon('eye',13)} View original source`,'source','text','data-kind="partial"')}</div>`;
}
function variantC() {
  const visibleCaptures = [activeVisible() && 'active', failedVisible() && 'failed', partialVisible() && 'partial'].filter(Boolean);
  if (!visibleCaptures.length) return `${pageTitle('Capture review')}<div class="empty-resolved">${icon('checkCircle',24)}<strong>No captures to review</strong><p>Your saved expenses remain available.</p></div>${expenseList()}`;
  if (!visibleCaptures.includes(state.selected)) state.selected = visibleCaptures[0];
  return `${pageTitle('Capture review',`<span class="date-label">${attentionCount()} ${attentionCount() === 1 ? 'capture needs' : 'captures need'} attention</span>`)}<div class="inbox-layout"><aside class="inbox-list" aria-label="Captures to review"><div class="inbox-list-head"><span>RECENT CAPTURES</span><span>${visibleCaptures.length}</span></div>${activeVisible() ? inboxEntry('active') : ''}${failedVisible() ? inboxEntry('failed') : ''}${partialVisible() ? inboxEntry('partial') : ''}</aside><section class="inbox-detail" aria-label="Selected capture">${inboxDetail()}</section></div>`;
}
function componentLibrary() {
  const spec = (n,title,description,content) => `<article class="component-spec"><div class="spec-preview"><div>${content}</div></div><div class="spec-caption"><div class="spec-number">COMPONENT ${n}</div><h3>${title}</h3><p>${description}</p></div></article>`;
  return `<div class="component-intro"><div><h2>The recovery toolkit</h2><p>Eight components to compare. Components 7 and 8 show the two pending designs.</p></div></div><div class="component-grid">${spec('01','Persistent failure card','Capture-level failure. A plain-language reason, known save outcome, and a retry action.',failedCard() || '<div class="empty-resolved"><strong>Capture dismissed</strong><p>Reset sample data to see it again.</p></div>')}${spec('02','Completion with a review count','A completed capture keeps its saved results visible. Only unsaved items need attention.',partialCard())}${spec('03','An actionable item failure','The source text anchors the error. A targeted action starts with the fields already extracted.',itemRow(failureItems[0]))}${spec('04','A quiet attention banner','A persistent way back to unresolved captures after the activity panel is closed.',`<div class="notice-banner">${icon('alert',18)}<div><strong>${attentionCount()} ${attentionCount()===1?'capture needs':'captures need'} attention</strong><p>Saved expenses are ready. Pick up the rest when you have a moment.</p><button data-action="open-inbox">Review captures ${icon('arrow',12)}</button></div></div>`)}${spec('05','A completion notification','Useful at the moment of completion. Pair it with a persistent card or inbox so the issues remain findable.',`<div class="outcome-toast">${icon(unresolved().length?'alert':'checkCircle',19)}<div><strong>${savedCount()} saved${unresolved().length ? `, ${unresolved().length} need review` : ', review complete'}</strong><p>${unresolved().length ? 'Some details couldn’t be read.' : 'Your expenses are ready.'}</p><button data-action="open-inbox">${unresolved().length ? 'Review unsaved items' : 'View capture'} ${icon('arrow',12)}</button></div></div>`)}${spec('06','Completed with nothing saved','Processing can finish without creating an expense. Use a review state and explicitly say what was saved.',`<article class="capture-card"><header><span class="badge warning">${icon('alert',14)} Review needed</span><time>Just now</time></header><div class="card-body"><div class="source-meta"><strong>Nothing added yet</strong></div><p class="error-copy">Processing finished. Both items are missing details we need to save them.</p><div class="summary-counts"><span class="muted">0 saved</span><span class="summary-divider"></span><span class="review-count">2 need review</span></div></div><div class="card-footer warning"><span class="footer-status">2 items not saved</span>${actionButton('Review items','show-empty')}</div></article>`)}${spec('07','Capture in progress · Proposed','The same source and card layout, with a current stage. No review action is needed while the capture runs.',proposedActiveCard())}${spec('08','Pending capture · Updated','The failure card’s header and text styling, with the description below the photo. The original filename identifies the uploaded photo.',currentPendingCapture())}</div>`;
}
function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set('variant',state.variant);
  url.searchParams.set('scenario',state.scenario);
  url.searchParams.set('pending',state.pendingDesign);
  if (state.view === 'components') url.searchParams.set('view','components'); else url.searchParams.delete('view');
  try { history.replaceState(null,'',url); } catch { /* Local file previews may restrict history. */ }
}
function render() {
  const focused = document.activeElement;
  const focusAction = focused?.dataset?.action;
  const focusItem = focused?.dataset?.item;
  const draft = document.getElementById('capture-draft')?.value || '';
  const variant = variants[state.variant];
  document.getElementById('variant-number').textContent = variant.number;
  document.getElementById('variant-name').textContent = variant.name;
  document.getElementById('variant-description').textContent = variant.description;
  document.getElementById('recommendation').hidden = state.variant !== 'A';
  document.getElementById('design-note').innerHTML = `${icon('info',15)}<p>${variant.note}</p>`;
  document.getElementById('scenario').value = state.scenario;
  document.getElementById('context-view').hidden = state.view !== 'context';
  document.getElementById('components-view').hidden = state.view !== 'components';
  document.getElementById('variant-switcher').hidden = state.view !== 'context';
  document.querySelectorAll('[data-view]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.view === state.view)));
  document.querySelectorAll('[data-variant]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.variant === state.variant)));
  document.querySelectorAll('[data-device]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.device === state.device)));
  document.querySelectorAll('[data-pending]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.pending === state.pendingDesign)));
  document.getElementById('preview-wrap').classList.toggle('mobile',state.device === 'mobile');
  if (state.view === 'components') {
    document.getElementById('components-view').innerHTML = componentLibrary();
    document.getElementById('app').innerHTML = '';
  } else {
    document.getElementById('components-view').innerHTML = '';
    document.getElementById('app').innerHTML = `${sidebar()}<div class="app-main">${state.variant === 'A' ? variantA() : state.variant === 'B' ? variantB() : variantC()}</div>${mobileNav()}`;
  }
  const nextDraft = document.getElementById('capture-draft');
  if (nextDraft) nextDraft.value = draft;
  if (focusAction && !document.getElementById('review-dialog').open) {
    const match = [...document.querySelectorAll('[data-action]')].find(el => el.dataset.action === focusAction && (!focusItem || el.dataset.item === focusItem));
    match?.focus({preventScroll:true});
  }
  syncUrl();
}
let toastTimer;
let undoToast = null;
function toast(message, undo = null) {
  clearTimeout(toastTimer);
  undoToast = undo;
  const element = document.getElementById('toast');
  element.innerHTML = `${icon('checkCircle',16)}<span>${escapeHtml(message)}</span>${undo ? '<button data-action="undo-toast">Undo</button>' : ''}<button data-action="close-toast" aria-label="Close notification">${icon('close',13)}</button>`;
  element.hidden = false;
  toastTimer = setTimeout(() => { element.hidden = true; undoToast = null; },undo ? 10000 : 6000);
}
function announce(message) { document.getElementById('announcer').textContent = message; }
function resetData() {
  clearTimeout(state.retryTimer);
  state.generation++;
  state.failure='failed'; state.resolution={}; state.manual={}; state.retryExpenses=[]; state.expanded=false; state.panelOpen=true; state.filter='attention';state.selected='partial';
  document.getElementById('toast').hidden=true;
}
let dialogReturnFocus = null;
let dialogItem = null;
function showDialog(html) {
  dialogReturnFocus = {action:document.activeElement?.dataset?.action,item:document.activeElement?.dataset?.item};
  const dialog = document.getElementById('review-dialog');
  dialog.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
function dialogHead(title) { return `<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button data-action="close-dialog" aria-label="Close dialog">${icon('close',19)}</button></div>`; }
function openFix(id, manual = false) {
  dialogItem = manual ? 'manual' : id;
  const item = manual ? {title:'Dinner at Hrimnir',merchant:'Hrimnir',date:'2026-11-15',currency:'NOK',amount:'',source:'Dinner receipt · Add the details from your receipt.',suggestions:[]} : failureItems.find(x=>x.id===id);
  showDialog(`<form id="correction-form">${dialogHead(manual ? 'Add an expense' : 'Finish this expense')}<div class="dialog-body"><p>${manual ? 'Enter the receipt details. This saves to the sample list only.' : `${item.reason} The details we could read are filled in.`}</p><blockquote class="source-quote">${item.source}</blockquote><div class="field-grid"><label class="full">Title<input name="title" required maxlength="64" value="${item.title}"></label><label>Total<input name="amount" inputmode="decimal" type="number" step="0.01" min="0.01" required value="${item.amount}" placeholder="Enter total" class="${!item.amount ? 'needs-input' : ''}">${!item.amount ? '<small>Required to save this expense</small>' : ''}</label><label>Currency<select name="currency" required class="${!item.currency ? 'needs-input' : ''}"><option value="">Choose currency</option>${['NOK','EUR','USD'].map(c=>`<option ${c===item.currency?'selected':''}>${c}</option>`).join('')}</select>${!item.currency ? '<small>Required to save this expense</small>' : ''}</label><label>Merchant<input name="merchant" value="${item.merchant}"></label><label>Purchase date<input name="date" type="date" required value="${item.date}"></label></div>${!manual ? `<div class="suggestions">Suggested values ${item.suggestions.map(s=>`<button type="button" data-action="suggestion" data-value="${s}" data-field="${id === 'lunch' ? 'amount' : 'currency'}">${s}${id === 'lunch' ? ' NOK' : ''}</button>`).join('')}</div>` : ''}<p class="dialog-safety" style="margin-top:20px">${icon('shield',14)} ${manual ? 'This is a simulated manual entry.' : 'This adds only this item. Your saved expenses stay as they are.'}</p></div><div class="dialog-footer"><span>${manual ? 'Demo expense' : 'Unsaved item'} · Personal</span><button type="submit" class="button primary">${icon('check',14)} Save expense</button></div></form>`);
  document.querySelectorAll('#review-dialog button:not([type])').forEach(b=>b.type='button');
  setTimeout(()=>document.querySelector('#correction-form .needs-input')?.focus(),30);
}
function openSource(kind) {
  if (kind === 'active') {
    showDialog(`${dialogHead('Original source')}<div class="dialog-body"><p>grocery-receipt.jpg · Sample receipt</p><div class="source-sheet"><h3>KIWI</h3><div>OSLO · 15.11.2026</div><hr><div class="receipt-line"><span>Groceries</span><span>214,50</span></div><hr><div class="receipt-line"><strong>TOTAL NOK</strong><strong>214,50</strong></div><hr><div>Thank you!</div></div><p class="dialog-safety">${icon('info',14)} Illustrative source. No real receipt has been uploaded.</p></div><div class="dialog-footer"><span>Source retained for this demo</span>${actionButton('Done','close-dialog','primary')}</div>`);
    return;
  }
  const partial = kind === 'partial';
  showDialog(`${dialogHead('Original source')}<div class="dialog-body"><p>${partial ? 'Sunday in Oslo · Text + receipt' : 'dinner-receipt.jpg · Sample receipt'}</p>${partial ? '<blockquote class="source-quote">Coffee at Fuglen 58 kr, train ticket 124 kr, groceries 386.50 kr. Lunch at Lofthus, total 1?8,00 NOK. Taxi to Oslo S, 245.</blockquote>' : ''}<div class="source-sheet"><h3>${partial ? 'LOFTHUS' : 'HRIMNIR'}</h3><div>OSLO · 15.11.2026</div><hr><div class="receipt-line"><span>${partial ? 'Lunch' : 'Ramen'}</span><span>${partial ? '1?8,00' : '268,00'}</span></div>${partial ? '' : '<div class="receipt-line"><span>Drink</span><span>60,00</span></div>'}<hr><div class="receipt-line"><strong>TOTAL NOK</strong><strong>${partial ? '1?8,00' : '328,00'}</strong></div><hr><div>Thank you!</div></div><p class="dialog-safety">${icon('info',14)} Illustrative source. No real receipt has been uploaded.</p></div><div class="dialog-footer"><span>Source retained for this demo</span>${actionButton('Done','close-dialog','primary')}</div>`);
}
function openExpenses(unknown = false) {
  showDialog(`${dialogHead(unknown ? 'Check your saved expenses' : 'Saved expenses')}<div class="dialog-body"><p>${unknown ? 'Look for the dinner expense before submitting it again. An unconfirmed capture can already have saved results.' : 'Only saved expenses contribute to the total.'}</p>${expenseList({standalone:true})}${unknown ? '<p class="dialog-safety">This demo has no matching dinner expense. In production, reconcile saved records before retrying.</p>' : ''}</div><div class="dialog-footer"><span>Sample data only</span>${actionButton('Done','close-dialog','primary')}</div>`);
}
function retry() {
  if (state.failure !== 'failed' || state.scenario === 'unknown') return;
  state.failure='retrying';render();announce('Retrying dinner receipt.');
  const generation=state.generation;
  state.retryTimer=setTimeout(()=>{
    if (generation !== state.generation) return;
    state.failure='saved';state.retryExpenses=[{id:'dinner',title:'Dinner at Hrimnir',category:'Food & drink',currency:'NOK',amount:32800,glyph:'receipt'}];
    render();toast('Dinner expense saved. 328.00 NOK added.');
  },1500);
}
function selectVariant(value) { state.variant=value; render();announce(`Layout ${value}: ${variants[value].name}`); }
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.variant) return selectVariant(button.dataset.variant);
  if (button.dataset.cycle) { const keys=Object.keys(variants); return selectVariant(keys[(keys.indexOf(state.variant)+Number(button.dataset.cycle)+keys.length)%keys.length]); }
  if (button.dataset.view) { state.view=button.dataset.view;render();return; }
  if (button.dataset.device) { state.device=button.dataset.device;render();return; }
  if (button.dataset.pending) { state.pendingDesign=button.dataset.pending;render();return; }
  const action=button.dataset.action;
  const item=button.dataset.item;
  switch(action) {
    case 'retry': retry();break;
    case 'dismiss': state.failure='dismissed';render();toast('Capture dismissed. Saved expenses were kept.',()=>{state.failure='failed';render();});break;
    case 'expand': state.expanded=!state.expanded;render();announce(state.expanded ? `${unresolved().length} unsaved items shown.` : 'Item details collapsed.');break;
    case 'fix': openFix(item);break;
    case 'manual': openFix(null,true);break;
    case 'ignore': state.resolution[item]='ignored';render();toast('Item ignored. No expense added.',()=>{delete state.resolution[item];render();});break;
    case 'undo-ignore': delete state.resolution[item];render();announce('Item restored for review.');break;
    case 'source': openSource(button.dataset.kind);break;
    case 'view-expenses': openExpenses();break;
    case 'check-unknown': openExpenses(true);break;
    case 'close-dialog': document.getElementById('review-dialog').close();break;
    case 'suggestion': document.querySelector(`#correction-form [name="${button.dataset.field}"]`).value=button.dataset.value;break;
    case 'close-toast': document.getElementById('toast').hidden=true;break;
    case 'undo-toast': {const undo=undoToast;document.getElementById('toast').hidden=true;undoToast=null;undo?.();announce('Action undone.');break;}
    case 'toggle-panel': state.panelOpen=!state.panelOpen;render();break;
    case 'filter': state.filter=button.dataset.filter;render();break;
    case 'select-capture': state.selected=button.dataset.kind;render();break;
    case 'focus-inbox': document.querySelector('.inbox-detail')?.scrollIntoView({block:'nearest'});break;
    case 'open-inbox': state.view='context';state.variant='C';state.selected='partial';render();document.getElementById('preview-wrap').scrollIntoView({block:'start',behavior:'smooth'});break;
    case 'show-empty': resetData();state.scenario='empty';state.view='context';state.variant='C';render();document.getElementById('preview-wrap').scrollIntoView({block:'start',behavior:'smooth'});break;
    case 'sample-upload': openSource('failed');break;
    case 'voice-info': toast('Voice capture is illustrative. No microphone is used.');break;
    case 'sample-capture': {const draft=document.getElementById('capture-draft')?.value;resetData();state.scenario='partial';state.expanded=true;render();toast(draft ? 'Demo capture complete. Showing the sample review items.' : 'Sample capture complete. 3 saved, 2 need review.');break;}
    case 'nav': if (button.dataset.destination==='Expenses') openExpenses(); else if(button.dataset.destination==='Home') {state.variant='A';render();} else {showDialog(`${dialogHead(button.dataset.destination)}<div class="dialog-body"><p>${button.dataset.destination==='Collections' ? 'The sample workspace has Personal and Work collections. This design study focuses on capture recovery.' : 'Settings are outside this capture recovery study.'}</p></div><div class="dialog-footer"><span>Prototype navigation</span>${actionButton('Back to captures','close-dialog','primary')}</div>`);}break;
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='correction-form')return;
  event.preventDefault();
  const data=new FormData(event.target);
  const amount=Math.round(Number(data.get('amount'))*100);
  const title=String(data.get('title')).trim();
  if(!Number.isFinite(amount)||amount<=0||!title)return;
  const id=dialogItem==='manual'?`manual-${Date.now()}`:dialogItem;
  state.manual[id]={title,amount,currency:String(data.get('currency')),category:id==='taxi'?'Transport':'Food & drink',merchant:String(data.get('merchant')),date:String(data.get('date'))};
  if(dialogItem!=='manual')state.resolution[id]='saved';
  document.getElementById('review-dialog').close();
  render();toast(`${title} saved. ${money(amount)} ${data.get('currency')} added.`);
});
document.getElementById('review-dialog').addEventListener('close',()=>{
  const target=[...document.querySelectorAll('[data-action]')].find(el=>el.dataset.action===dialogReturnFocus?.action&&(!dialogReturnFocus?.item||el.dataset.item===dialogReturnFocus.item));
  if(target)target.focus({preventScroll:true});else document.getElementById('scenario').focus({preventScroll:true});
});
document.getElementById('review-dialog').addEventListener('click',event=>{
  const dialog=event.currentTarget;const bounds=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))dialog.close();
});
document.getElementById('scenario').addEventListener('change',event=>{resetData();state.scenario=event.target.value;render();announce(`Showing ${event.target.selectedOptions[0].text}.`);});
document.getElementById('reset-demo').addEventListener('click',()=>{resetData();render();toast('Sample data reset.');});
document.addEventListener('keydown',event=>{
  if(state.view!=='context'||document.getElementById('review-dialog').open||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const keys=Object.keys(variants);selectVariant(keys[(keys.indexOf(state.variant)+(event.key==='ArrowRight'?1:-1)+3)%3]);}
});
window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);if(Object.hasOwn(variants,p.get('variant')))state.variant=p.get('variant');if(scenarioNames.includes(p.get('scenario')))state.scenario=p.get('scenario');state.view=p.get('view')==='components'?'components':'context';state.pendingDesign=p.get('pending')==='proposed'?'proposed':'current';render();});
document.querySelector('[data-device="desktop"]').innerHTML=icon('desktop',15);
document.querySelector('[data-device="mobile"]').innerHTML=icon('mobile',15);
document.getElementById('reset-demo').innerHTML=icon('refresh',14);
document.querySelector('[data-cycle="-1"]').innerHTML=icon('left',14);
document.querySelector('[data-cycle="1"]').innerHTML=icon('chevron',14);
render();
