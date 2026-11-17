const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/YX7MEERTPQ';
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NB = ' ';
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[\s ]/g, NB);
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };

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
    $('o-term').textContent = years + ' ' + (years % 10 === 1 && years !== 11 ? 'год' : [2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years) ? 'года' : 'лет');
    $('o-rate').textContent = String($('rate').value).replace('.', ',') + ' %';
    const pay = (r) => {
      const S = price * (1 - down), n = years * 12, m = r / 1200;
      return m === 0 ? S / n : S * m / (1 - Math.pow(1 + m, -n));
    };
    const p = pay(rate);
    $('pay').textContent = fmt(p);
    const diff = pay(rate + 1) - p;
    $('delta').textContent = 'Каждый лишний 1 п.п. ставки добавляет около ' + fmt(diff) + ' ₽ в месяц. Поэтому банки сравниваем.';
  };
  ['price', 'down', 'term', 'rate'].forEach(id => $(id).addEventListener('input', calc));
  calc();

  /* ---------- сомнения ---------- */
  const DOUBTS = {
    rate: ['Ставка зависит от банка, программы и первого взноса.', 'Ипотечный центр работает с 16 банками-партнёрами. Мы сравниваем их условия между собой под ваш доход, взнос и срок, а не предлагаем первый попавшийся вариант. Разница в 1 п.п. по ставке видна в калькуляторе выше.'],
    income: ['Белая зарплата не единственный способ показать доход.', 'Мы изучим ваши документы и размер первого взноса и предложим банки, где подходит ваш формат подтверждения дохода. Решение принимает банк, наша задача подготовить заявку так, чтобы шансов было больше.'],
    price: ['Дорогая квартира выбирается по условиям, а не по первой цене.', 'Мы сравниваем проекты по цене за метр, сроку сдачи, окружению и условиям ипотеки. Платить за работу брокера не нужно: её оплачивает застройщик.']
  };
  const showD = k => { $('dt').textContent = DOUBTS[k][0]; $('ds').textContent = DOUBTS[k][1]; };
  document.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-d]').forEach(x => x.setAttribute('aria-selected', x === b));
    showD(b.dataset.d);
  }));
  showD('rate');

  /* ---------- форма: Worker -> Telegram ---------- */
  safe(() => {
    const form = $('leadForm'); if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]'), orig = btn.textContent;
      const payload = {}; new FormData(form).forEach((v, k) => { payload[k] = v; });
      if (payload._gotcha) return;
      if (!payload.name || !payload.phone) { alert('Заполните имя и контакт'); return; }
      btn.disabled = true; btn.textContent = 'Отправляем...';
      try {
        const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        btn.textContent = 'Заявка отправлена'; form.reset();
      } catch (err) { console.error(err); btn.textContent = 'Ошибка, попробуйте ещё раз'; }
      finally { setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3500); }
    });
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

  /* фотографии открываются маской */
  document.querySelectorAll('.ph').forEach(ph => {
    gsap.fromTo(ph, { clipPath: 'inset(14% 14% 14% 14% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: ph, start: 'top 95%', end: 'top 45%', scrub: true } });
    gsap.fromTo(ph.querySelector('img'), { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ph, start: 'top 95%', end: 'bottom 30%', scrub: true } });
  });
  gsap.from('.hero__photo img', { scale: 1.18, duration: 1.8, ease: 'expo.out' });
  gsap.from('.tag', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', delay: .6 });

  /* сцена: прогресс скролла нарезает ключ */
  const S = { p: 0 };
  cuts.fill(0); drawBlade(); setStage(0);
  gsap.set('.cap', { opacity: 0, y: 24 });
  let cur = -1;
  const paint = () => {
    for (let i = 0; i < 6; i++) cuts[i] = Math.min(1, Math.max(0, S.p - i));
    drawBlade();
    const n = Math.min(5, Math.floor(S.p + .001)); if (n !== cur) { cur = n; setStage(n); }
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

  /* чек «печатается» при появлении */
  gsap.from('.receipt__list li', { opacity: 0, x: -20, stagger: .12, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.receipt', start: 'top 80%' } });
  gsap.from('.who__list li', { yPercent: 40, opacity: 0, stagger: .12, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.who__list', start: 'top 80%' } });
})();
