const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/YX7MEERTPQ';
/* Номер счётчика Яндекс.Метрики. Пока не создан: оставить 0, цели и события уже готовы.
   Когда появится номер, вписать сюда, счётчик подключится после согласия на cookie. */
const YM_ID = 0;
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NB = ' ';
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[\s ]/g, NB);
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- цели Метрики ---------- */
  const goal = (name, params) => { safe(() => { if (YM_ID && window.ym) window.ym(YM_ID, 'reachGoal', name, params); }); };
  const loadMetrika = () => {
    if (!YM_ID || window.__ymLoaded) return; window.__ymLoaded = true;
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  };

  /* ---------- общее состояние заявки ---------- */
  const lead = { interest: 'Подбор квартиры', place: null, calc: null };

  /* ---------- cookie ---------- */
  safe(() => {
    const ck = $('cookie'); let v = null;
    try { v = localStorage.getItem('cookie_choice'); } catch (e) {}
    if (v === 'yes') loadMetrika();
    if (!v) ck.hidden = false;
    const set = x => { ck.hidden = true; try { localStorage.setItem('cookie_choice', x); } catch (e) {} if (x === 'yes') loadMetrika(); };
    $('cookieOk').addEventListener('click', () => set('yes'));
    $('cookieNo').addEventListener('click', () => set('no'));
  });

  /* ---------- ключ: геометрия лезвия ---------- */
  const NOTCH = [26, 34, 18, 30, 22, 38];
  const X0 = 236, W = 56, YB = 142, YT = 90, XEND = 580;
  const blade = $('blade'), marks = $('marks');
  const cuts = new Array(6).fill(1);
  const drawBlade = () => {
    let d = `M230 ${YT}H${XEND}V${YB - 4}`;
    for (let i = 5; i >= 0; i--) {
      const x1 = X0 + (i + 1) * W - 4, x0 = X0 + i * W + 4, y = YB - NOTCH[i] * cuts[i];
      d += `L${x1} ${YB}L${x1 - 7} ${y}L${x0 + 7} ${y}L${x0} ${YB}`;
    }
    d += `L230 ${YB}Z`;
    blade.setAttribute('d', d);
  };
  marks.innerHTML = NOTCH.map((_, i) => `<text x="${X0 + i * W + W / 2}" y="188" data-m="${i}">${i + 1}</text>`).join('');
  const setStage = n => {
    $('stn').textContent = n + 1;
    marks.querySelectorAll('text').forEach((t, i) => t.classList.toggle('on', i === n));
  };
  drawBlade(); setStage(5);

  /* ---------- калькулятор ---------- */
  const calc = () => {
    const price = +$('price').value * 1e6, down = +$('down').value / 100, years = +$('term').value, rate = +$('rate').value;
    $('o-price').textContent = ($('price').value).replace('.', ',') + ' млн ₽';
    $('o-down').textContent = $('down').value + ' %';
    const yw = years % 10 === 1 && years !== 11 ? 'год' : [2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years) ? 'года' : 'лет';
    $('o-term').textContent = years + ' ' + yw;
    $('o-rate').textContent = String($('rate').value).replace('.', ',') + ' %';
    const pay = (r) => {
      const S = price * (1 - down), n = years * 12, m = r / 1200;
      return m === 0 ? S / n : S * m / (1 - Math.pow(1 + m, -n));
    };
    const p = pay(rate);
    $('pay').textContent = fmt(p);
    const diff = pay(rate + 1) - p;
    $('delta').textContent = 'Каждый лишний 1 п.п. ставки добавляет около ' + fmt(diff) + ' ₽ в месяц. Поэтому помогаю сравнивать банки.';
    lead.calc = `квартира ${$('o-price').textContent}, взнос ${$('o-down').textContent}, срок ${$('o-term').textContent}, ставка ${$('o-rate').textContent}, платёж около ${fmt(p)} ₽ в месяц (предварительно)`;
  };
  let calcTouched = false;
  ['price', 'down', 'term', 'rate'].forEach(id => $(id).addEventListener('input', () => { calc(); if (!calcTouched) { calcTouched = true; goal('calc_used'); } }));
  calc();

  /* ---------- вопросы и сомнения ---------- */
  const DOUBTS = [
    ['rate', 'Высокая ставка', 'Ставка зависит от банка, программы и первого взноса.', 'Работаю через ипотечный центр с 16 банками-партнёрами. Сравниваю их условия между собой под ваш доход, взнос и срок, а не предлагаю первый попавшийся вариант. Разница в 1 п.п. по ставке видна в калькуляторе выше.'],
    ['income', 'Нет белой зарплаты', 'Белая зарплата не единственный способ показать доход.', 'Изучу ваши документы и размер первого взноса и подскажу банки, где подходит ваш формат подтверждения дохода. Решение принимает банк, моя задача подготовить заявку так, чтобы шансов было больше.'],
    ['price', 'Дорогие квартиры', 'Дорогая квартира выбирается по условиям, а не по первой цене.', 'Я сравниваю проекты по цене за метр, сроку сдачи, окружению и условиям ипотеки. Платить за работу брокера не нужно: её оплачивает застройщик.'],
    ['district', 'Не могу определиться с районом', 'Не могу определиться с районом', 'Помогу разобраться в особенностях разных районов Санкт-Петербурга и Ленинградской области. Сравним транспортную доступность, инфраструктуру, окружение и стоимость жилья, чтобы выбрать подходящее место для жизни или инвестиций.'],
    ['down', 'Не хватает первоначального взноса', 'Не хватает первоначального взноса', 'Посмотрим, какие варианты покупки доступны с учётом вашей финансовой ситуации. Проверим возможные ипотечные программы и условия банков, чтобы понять, какие решения можно рассмотреть в вашем случае.'],
    ['which', 'Не знаю, какую ипотеку выбрать', 'Не знаю, какую ипотеку выбрать', 'Помогу сравнить предложения разных банков, разобраться в процентных ставках, первоначальном взносе и ежемесячных платежах. Подберём варианты, которые соответствуют вашим возможностям.'],
    ['dev', 'Боюсь ошибиться с застройщиком', 'Боюсь ошибиться с застройщиком', 'Помогу сравнить застройщиков и жилые комплексы, обратить внимание на репутацию компании, документы проекта, сроки строительства и условия покупки. Это позволит принять более взвешенное решение.'],
    ['profit', 'Не понимаю, какую квартиру выгоднее покупать', 'Не понимаю, какую квартиру выгоднее покупать', 'Сравним доступные варианты по стоимости, планировке, расположению, характеристикам жилого комплекса и перспективам района. Помогу оценить, какой вариант лучше соответствует вашим целям и бюджету.'],
    ['start', 'Не знаю, с чего начать покупку', 'Не знаю, с чего начать покупку', 'Начнём с определения бюджета, желаемого района и требований к квартире. Затем подберу подходящие новостройки, помогу разобраться с ипотекой и проведу вас через основные этапы покупки до получения ключей.']
  ];
  const dp = $('dpills');
  dp.innerHTML = DOUBTS.map((d, i) => `<button type="button" role="tab" data-d="${d[0]}" aria-selected="${i === 0}">${esc(d[1])}</button>`).join('');
  const showD = k => { const d = DOUBTS.find(x => x[0] === k); $('dt').textContent = d[2]; $('ds').textContent = d[3]; };
  dp.addEventListener('click', e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    $$('[data-d]', dp).forEach(x => x.setAttribute('aria-selected', x === b));
    showD(b.dataset.d); goal('doubt_open', { topic: b.textContent });
  });
  showD('rate');

  /* ---------- карта ---------- */
  const places = [];
  safe(() => {
    const svg = $('mapSvg'), data = window.MAP_DATA; if (!svg || !data) return;
    const NS = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', data.viewBox.join(' '));
    const vb0 = data.viewBox.slice();
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = '<clipPath id="land"><path clip-rule="evenodd" d="M0 0H' + vb0[2] + 'V' + vb0[3] + 'H0Z' + data.sea + '"/></clipPath>';
    svg.appendChild(defs);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('clip-path', 'url(#land)'); svg.appendChild(g);
    const sea = document.createElementNS(NS, 'path'); sea.setAttribute('d', data.sea); sea.setAttribute('class', 'sea'); sea.setAttribute('fill-rule', 'evenodd'); sea.setAttribute('aria-hidden', 'true');
    svg.insertBefore(sea, g);
    const label = document.createElementNS(NS, 'text'); label.setAttribute('class', 'map__label'); label.setAttribute('aria-hidden', 'true');
    let selected = null;
    const byId = {};
    data.items.forEach(it => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', it.d); p.setAttribute('class', 'zone zone--' + it.g);
      p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button');
      p.setAttribute('aria-label', it.name); p.dataset.id = it.id;
      g.appendChild(p); byId[it.id] = { it, p };
      places.push({ id: it.id, name: it.name, group: it.g });
    });
    svg.appendChild(label);
    const showLabel = it => {
      label.textContent = it.name;
      label.setAttribute('x', it.c[0]); label.setAttribute('y', it.c[1]);
      label.classList.add('on');
    };
    const hideLabel = () => { if (selected) showLabel(byId[selected].it); else label.classList.remove('on'); };
    const hint = $('mapHint');
    const select = (id, fromChip) => {
      selected = id; $$('.zone', svg).forEach(z => z.classList.toggle('sel', z.dataset.id === id));
      const it = byId[id].it; showLabel(it);
      setPlace({ name: it.name, group: it.g });
      hint.textContent = it.name;
      goal('map_select', { place: it.name });
    };
    svg.addEventListener('pointerover', e => { const z = e.target.closest('.zone'); if (z) showLabel(byId[z.dataset.id].it); });
    svg.addEventListener('pointerout', e => { if (e.target.closest('.zone')) hideLabel(); });
    svg.addEventListener('focusin', e => { const z = e.target.closest('.zone'); if (z) showLabel(byId[z.dataset.id].it); });
    svg.addEventListener('focusout', hideLabel);
    svg.addEventListener('click', e => { const z = e.target.closest('.zone'); if (z) select(z.dataset.id); });
    svg.addEventListener('keydown', e => { const z = e.target.closest('.zone'); if (z && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(z.dataset.id); } });
    /* приближение центра города */
    const zb = $('mapZoom'); let zoomed = false, raf = 0;
    let baseFs = 0;
    const tweenVB = (to) => {
      if (!baseFs) { label.style.fontSize = ''; baseFs = parseFloat(getComputedStyle(label).fontSize) || 21; }
      const from = svg.getAttribute('viewBox').split(' ').map(Number), t0 = performance.now(), dur = reduce ? 1 : 450;
      cancelAnimationFrame(raf);
      const f = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        const vb = from.map((v, i) => v + (to[i] - v) * e); svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' ')); label.style.fontSize = (baseFs * vb[2] / vb0[2]).toFixed(2) + 'px'; label.style.strokeWidth = (6 * vb[2] / vb0[2]).toFixed(2) + 'px'; if (k < 1) raf = requestAnimationFrame(f); };
      raf = requestAnimationFrame(f);
    };
    if (zb) zb.addEventListener('click', () => {
      zoomed = !zoomed; zb.setAttribute('aria-pressed', zoomed);
      zb.textContent = zoomed ? 'Вся карта' : 'Центр крупнее';
      tweenVB(zoomed ? [430, 330, 300, 255] : vb0);
      svg.classList.toggle('zoomed', zoomed);
    });
    window.__mapSelect = id => select(id, true);
    window.__mapClear = () => { selected = null; $$('.zone', svg).forEach(z => z.classList.remove('sel')); hideLabel(); hint.textContent = 'Нажмите на район'; };
  });

  const pickV = $('pickV'), pickS = $('pickS');
  const GROUP_NAME = { spb: 'Санкт-Петербург', lo: 'Ленинградская область', msk: 'Москва' };
  function setPlace(p) {
    lead.place = p;
    if (p.group === 'msk') { pickV.textContent = 'Москва'; pickS.textContent = 'Москва доступна для подбора. Нажмите кнопку, и я учту это в заявке.'; }
    else { pickV.textContent = p.name; pickS.textContent = GROUP_NAME[p.group] + '. Нажмите кнопку, и я учту это в подборе.'; }
    $$('#chips [data-pl]').forEach(c => c.setAttribute('aria-pressed', c.dataset.pl === (p.group === 'msk' ? 'msk' : p.name)));
  }
  safe(() => {
    const chips = $('chips');
    const items = [{ id: 'msk', name: 'Москва', group: 'msk' }].concat(places.filter(p => p.group === 'spb'), places.filter(p => p.group === 'lo'));
    chips.innerHTML = items.map(p => `<button type="button" data-pl="${p.group === 'msk' ? 'msk' : esc(p.name)}" data-id="${p.id}" aria-pressed="false">${esc(p.name)}</button>`).join('');
    chips.addEventListener('click', e => {
      const b = e.target.closest('[data-pl]'); if (!b) return;
      if (b.dataset.id === 'msk') { if (window.__mapClear) window.__mapClear(); setPlace({ name: 'Москва', group: 'msk' }); goal('map_select', { place: 'Москва' }); }
      else if (window.__mapSelect) window.__mapSelect(b.dataset.id);
    });
  });

  /* ---------- пошаговая заявка ---------- */
  const STEPS = [
    { key: 'Где покупка', q: 'Где планируете покупать квартиру?', opts: ['Санкт-Петербург', 'Ленинградская область', 'Москва'] },
    { key: 'budget', q: 'Какой бюджет рассматриваете?', opts: ['8–10 млн ₽', '10–12 млн ₽', '12–15 млн ₽', '15–20 млн ₽', 'Более 20 млн ₽'] },
    { key: 'Первоначальный взнос', q: 'Какой первоначальный взнос у вас есть?', opts: ['Пока нет первоначального взноса', 'До 1 млн ₽', '1–2 млн ₽', '2–3 млн ₽', '3–5 млн ₽', 'Более 5 млн ₽'] },
    { key: 'Комфортный платёж по ипотеке', q: 'Какой ежемесячный платёж по ипотеке для вас комфортен?', opts: ['До 40 тысяч ₽', '40–60 тысяч ₽', '60–80 тысяч ₽', '80–100 тысяч ₽', 'Более 100 тысяч ₽'] },
    { key: 'Когда планируют покупку', q: 'Когда планируете покупку?', opts: ['В ближайший месяц', 'В течение 3 месяцев', 'В течение 6 месяцев', 'Позже, пока изучаю рынок'] },
    { key: 'contact', q: 'Как с вами связаться?' }
  ];
  const form = $('leadForm'), qBody = $('qBody'), qStep = $('qStep'), qBar = $('qBar'), qLeft = $('qLeft'), qStatus = $('qStatus');
  const ans = {}; const contact = { name: '', phone: '', comment: '', consent: false };
  let cur = 0, started = false, sent = false;

  const priority = () => {
    const down = ans['Первоначальный взнос'] || '', pay = ans['Комфортный платёж по ипотеке'] || '', when = ans['Когда планируют покупку'] || '';
    const downBig = /^(3–5|Более 5)/.test(down), downNone = /^(Пока нет|До 1 млн)/.test(down);
    const payLow = /^До 40/.test(pay), soon = /^(В ближайший|В течение 3)/.test(when), later = /^Позже/.test(when);
    if (downBig && soon && !payLow) return 'Высокий';
    if (downNone || payLow || later) return 'Низкий';
    return 'Средний';
  };

  const renderStep = (focus) => {
    const s = STEPS[cur], n = STEPS.length;
    qStep.textContent = 'Шаг ' + (cur + 1) + ' из ' + n;
    qLeft.textContent = cur < n - 1 ? 'Осталось ' + (n - 1 - cur) + ' ' + (n - 1 - cur === 1 ? 'вопрос' : [2, 3, 4].includes(n - 1 - cur) ? 'вопроса' : 'вопросов') : 'Последний шаг';
    qBar.setAttribute('aria-valuenow', cur + 1); qBar.firstElementChild.style.width = ((cur + 1) / n * 100) + '%';
    qStatus.textContent = '';
    let h = '';
    if (s.key !== 'contact') {
      const pre = (cur === 0 && lead.place) ? lead.place : null;
      h += `<fieldset class="q"><legend class="q__t">${esc(s.q)}</legend>`;
      if (pre && cur === 0) h += `<p class="q__pre">Вы выбрали на схеме: ${esc(pre.name)}</p>`;
      h += `<div class="q__opts">` + s.opts.map(o => `<button type="button" class="opt${ans[s.key] === o ? ' on' : ''}" data-o="${esc(o)}" aria-pressed="${ans[s.key] === o}">${esc(o)}</button>`).join('') + `</div>`;
      h += `<div class="q__nav">${cur > 0 ? '<button type="button" class="back" data-back>Назад</button>' : '<span></span>'}${ans[s.key] ? '<button type="button" class="btn btn--sm" data-next>Далее</button>' : ''}</div></fieldset>`;
    } else {
      h += `<fieldset class="q"><legend class="q__t">${esc(s.q)}</legend>
        <label for="f-name">Имя</label>
        <input id="f-name" name="name" type="text" autocomplete="given-name" placeholder="Как к вам обращаться" required value="${esc(contact.name)}">
        <label for="f-phone">Номер телефона</label>
        <input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" required value="${esc(contact.phone)}">
        <label for="f-comment">Комментарий <span class="opt-note">не обязательно</span></label>
        <textarea id="f-comment" name="comment" rows="2" placeholder="Например: район, срок сдачи, этаж">${esc(contact.comment)}</textarea>
        <label class="consent"><input type="checkbox" id="f-consent" ${contact.consent ? 'checked' : ''}><span>Даю согласие на обработку персональных данных и принимаю <a href="privacy.html" target="_blank" rel="noopener">политику конфиденциальности</a></span></label>
        <div class="q__nav"><button type="button" class="back" data-back>Назад</button><button class="btn" type="submit" id="qSubmit" data-magnetic>Отправить заявку</button></div></fieldset>`;
    }
    qBody.innerHTML = h;
    if (focus) { const t = qBody.querySelector('.opt.on, .opt, #f-name'); if (t && !matchMedia('(pointer:coarse)').matches) t.focus({ preventScroll: true }); }
  };

  const goStep = i => { cur = Math.max(0, Math.min(STEPS.length - 1, i)); renderStep(true); };
  const startOnce = () => { if (!started) { started = true; goal('quiz_start', { from: lead.interest }); } };

  qBody.addEventListener('click', e => {
    if (sent) return;
    const o = e.target.closest('.opt');
    if (o) {
      startOnce();
      const s = STEPS[cur]; ans[s.key] = o.dataset.o;
      goal('quiz_step_' + (cur + 1), { answer: o.dataset.o });
      $$('.opt', qBody).forEach(x => { x.classList.toggle('on', x === o); x.setAttribute('aria-pressed', x === o); });
      setTimeout(() => goStep(cur + 1), reduce ? 0 : 220);
      return;
    }
    if (e.target.closest('[data-next]')) { goStep(cur + 1); return; }
    if (e.target.closest('[data-back]')) { keepContact(); goStep(cur - 1); }
  });
  const keepContact = () => {
    const f = id => form.querySelector('#' + id);
    if (f('f-name')) { contact.name = f('f-name').value; contact.phone = f('f-phone').value; contact.comment = f('f-comment').value; contact.consent = f('f-consent').checked; }
  };
  qBody.addEventListener('input', e => { if (e.target.id === 'f-name' || e.target.id === 'f-phone') startOnce(); });

  const source = () => {
    const q = new URLSearchParams(location.search), parts = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'yclid'].forEach(k => { if (q.get(k)) parts.push(k + '=' + q.get(k)); });
    try { if (document.referrer) { const h = new URL(document.referrer).hostname; if (h && h !== location.hostname) parts.push('переход с ' + h); } } catch (e) {}
    return parts.join(', ');
  };

  form.addEventListener('submit', async e => {
    e.preventDefault(); if (sent) return;
    keepContact();
    const fail = (m, id) => { qStatus.textContent = m; qStatus.className = 'lead-form__status err'; const el = id && $(id); if (el) el.focus(); };
    if (!contact.name.trim()) return fail('Напишите, как к вам обращаться.', 'f-name');
    if (contact.phone.replace(/\D/g, '').length < 10) return fail('Проверьте номер телефона: нужно минимум 10 цифр.', 'f-phone');
    if (!contact.consent) return fail('Нужно согласие на обработку персональных данных.', 'f-consent');
    if (form.querySelector('[name=_gotcha]').value) return;
    const payload = { name: contact.name.trim(), phone: contact.phone.trim() };
    payload['Интерес'] = lead.interest;
    if (lead.place && lead.place.group !== 'msk') payload['Район на схеме'] = lead.place.name;
    STEPS.slice(0, 5).forEach(s => { if (ans[s.key]) payload[s.key] = ans[s.key]; });
    payload['Приоритет заявки'] = priority() + ' (предварительная оценка по ответам)';
    const cm = []; if (contact.comment.trim()) cm.push(contact.comment.trim());
    if (lead.interest === 'Расчёт ипотеки' && lead.calc) payload['Расчёт на сайте'] = lead.calc;
    if (cm.length) payload.comment = cm.join(' ');
    const src = source(); if (src) payload['Источник'] = src;
    const btn = $('qSubmit'), orig = btn.textContent; btn.disabled = true; btn.textContent = 'Отправляем...';
    try {
      const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      sent = true; goal('lead', { priority: priority() });
      qBar.firstElementChild.style.width = '100%';
      qStep.textContent = 'Готово'; qLeft.textContent = '';
      qBody.innerHTML = `<div class="q q--ok"><p class="q__t">Заявка отправлена</p><p>Спасибо, ${esc(contact.name.trim())}. Я получил ваши ответы и свяжусь с вами по номеру ${esc(contact.phone.trim())}.</p><p>Если вопрос срочный, напишите в <a href="https://t.me/+79119518186" target="_blank" rel="noopener" data-goal="tg_click">Telegram</a> или <a href="https://wa.me/79119518186" target="_blank" rel="noopener" data-goal="wa_click">WhatsApp</a>.</p></div>`;
      qStatus.textContent = '';
    } catch (err) {
      console.error(err); goal('lead_error');
      btn.disabled = false; btn.textContent = orig;
      qStatus.className = 'lead-form__status err';
      qStatus.innerHTML = 'Не получилось отправить. Нажмите ещё раз или позвоните: <a href="tel:+79119518186">+7 911 951-81-86</a>.';
    }
  });
  renderStep(false);

  /* ---------- кнопки обращения: интерес, цели, предзаполнение ---------- */
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cta]');
    if (c) {
      lead.interest = c.dataset.interest || lead.interest;
      goal('cta_click', { place: c.dataset.cta, text: c.textContent.trim() });
      if (c.dataset.cta === 'calc') goal('calc_cta');
      if (!sent && cur === 0 && lead.place && !ans[STEPS[0].key] && lead.place.group !== 'msk') {
        ans[STEPS[0].key] = lead.place.group === 'spb' ? 'Санкт-Петербург' : 'Ленинградская область'; renderStep(false);
      } else if (!sent && cur === 0 && lead.place && lead.place.group === 'msk' && !ans[STEPS[0].key]) { ans[STEPS[0].key] = 'Москва'; renderStep(false); }
    }
    const g = e.target.closest('[data-goal]'); if (g) goal(g.dataset.goal);
  });

  /* ---------- фиксированная кнопка на телефоне ---------- */
  safe(() => {
    const st = $('stickyCta'), ct = $('contact'), hero = document.querySelector('.hero');
    let heroOut = false, contactIn = false;
    const upd = () => { st.hidden = !(heroOut && !contactIn); };
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(es => { heroOut = !es[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(es => { contactIn = es[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -20% 0px' }).observe(ct);
  });

  /* ---------- анимации ---------- */
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  document.documentElement.classList.add('scene');
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: .09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href'); if (h.length < 2) return;
    const t = document.querySelector(h); if (!t) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: -60 });
  }));

  document.querySelectorAll('h2.mask').forEach(h => {
    const t = h.textContent; h.setAttribute('aria-label', t);
    h.innerHTML = `<span class="ln" aria-hidden="true"><i>${t}</i></span>`;
    gsap.from(h.querySelector('i'), { yPercent: 110, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });

  const m = $('manifest'), words = m.textContent.trim().split(/\s+/);
  m.setAttribute('aria-label', m.textContent.trim());
  m.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  gsap.to('#manifest .w', { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: m, start: 'top 80%', end: 'bottom 50%', scrub: true } });

  gsap.from('.hero__photo img', { scale: 1.18, duration: 1.8, ease: 'expo.out' });
  gsap.from('.tag', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', delay: .6 });

  /* сцена: прогресс скролла нарезает ключ */
  const S = { p: 0 };
  cuts.fill(0); drawBlade(); setStage(0);
  gsap.set('.cap', { opacity: 0, y: 24 });
  let curS = -1;
  const paint = () => {
    for (let i = 0; i < 6; i++) cuts[i] = Math.min(1, Math.max(0, S.p - i));
    drawBlade();
    const n = Math.min(5, Math.floor(S.p + .001)); if (n !== curS) { curS = n; setStage(n); }
    const key = $('key');
    key.style.transform = `rotateY(${(-9 + S.p * 2.4).toFixed(2)}deg) rotateZ(${(-2 + S.p * .6).toFixed(2)}deg)`;
  };
  paint();
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.story', start: 'top top', end: '+=520%', pin: '.story__pin', scrub: .6, anticipatePin: 1 } });
  tl.to(S, { p: 6, duration: 6, onUpdate: paint }, 0).to('#bar', { scaleX: 1, duration: 6 }, 0);
  for (let i = 0; i < 6; i++) {
    tl.to(`.cap[data-i="${i}"]`, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, i + .02);
    if (i < 5) tl.to(`.cap[data-i="${i}"]`, { opacity: 0, y: -24, duration: .22, ease: 'power2.in' }, i + .76);
  }
  tl.to({}, { duration: .35 });

  const mq = $('marq'); let x = 0;
  gsap.ticker.add(() => {
    x -= .6 + Math.abs(lenis.velocity) * .35;
    const half = mq.scrollWidth / 2; if (-x >= half) x += half;
    mq.style.transform = `translate3d(${x}px,0,0)`;
  });

  gsap.from('.receipt__list li', { opacity: 0, x: -20, stagger: .12, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.receipt', start: 'top 80%' } });
  gsap.from('.who__list li', { yPercent: 40, opacity: 0, stagger: .12, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.who__list', start: 'top 80%' } });
})();
