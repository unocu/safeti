/* app.js — SAFETI by UNOCU — Standalone Site JavaScript */
(function() {
  'use strict';

  /* ============================================================
     DARK MODE TOGGLE
     ============================================================ */
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Check for saved theme or system preference
  let savedTheme = null;
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.setAttribute('data-theme', 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      // Theme state is transient (no persistence)
    });
  }

  /* ============================================================
     MOBILE NAV TOGGLE
     ============================================================ */
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });

    // Close mobile nav when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
      });
    });
  }

  /* ============================================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL without triggering scroll
        history.pushState(null, '', link.getAttribute('href'));
      }
    });
  });

  /* ============================================================
     SCROLL REVEAL ANIMATION
     ============================================================ */
  const revealElements = document.querySelectorAll('.reveal');

  function checkReveal() {
    const windowHeight = window.innerHeight;
    const revealPoint = 60;

    revealElements.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < windowHeight - revealPoint) {
        el.classList.add('revealed');
      }
    });
  }

  // Initial check
  checkReveal();
  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal, { passive: true });

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  document.querySelectorAll('.faq-item__trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const body = item.querySelector('.faq-item__body');
      const isOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('open');
        const otherBody = other.querySelector('.faq-item__body');
        if (otherBody) otherBody.classList.remove('open');
        const otherTrigger = other.querySelector('.faq-item__trigger');
        if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        if (body) body.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ============================================================
     ACTIVE NAV LINK ON SCROLL
     ============================================================ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav-link');

  function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  /* ============================================================
     SAFETI WIZARD
     ============================================================ */

  // ---- Helpers ----
  function formatCurrency(val) {
    if (isNaN(val) || val === null || val === '') return '—';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function parseCurrencyInput(str) {
    return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(m,10)-1] + ' ' + parseInt(d,10) + ', ' + y;
  }

  // ---- Selected investment type ----
  let safetiSelectedType = null; // 'safe' | 'token' | 'interest'

  // ---- Type card selection ----
  document.querySelectorAll('.safeti-type-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.safeti-type-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      safetiSelectedType = card.getAttribute('data-safeti-type');

      // Enable the next button
      const nextBtn = document.getElementById('safeti-step1-next');
      if (nextBtn) nextBtn.disabled = false;

      // Update conditional fields for Step 2
      safetiShowTypeFields(safetiSelectedType);

      // Reset calc grids
      safetiUpdateCalc();
    });
  });

  // ---- Show/hide conditional fields ----
  function safetiShowTypeFields(type) {
    // Show/hide fields based on type
    document.querySelectorAll('.safeti-field[data-show-for]').forEach(field => {
      const showFor = field.getAttribute('data-show-for');
      field.style.display = showFor === type ? 'flex' : 'none';
    });

    // SAFE sub-field visibility (valuation cap / discount) based on safe-type dropdown
    if (type === 'safe') {
      safetiUpdateSafeSubFields();
    }

    // Switch calc grids
    const grids = { interest: 'calc-grid-interest', safe: 'calc-grid-safe', token: 'calc-grid-token' };
    Object.entries(grids).forEach(([t, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = (t === type) ? '' : 'none';
    });
  }

  // ---- SAFE sub-field visibility (cap/discount based on safe type) ----
  function safetiUpdateSafeSubFields() {
    const safeTypeEl = document.getElementById('sf-safe-type');
    if (!safeTypeEl) return;
    const safeType = safeTypeEl.value;

    const showCap = safeType === 'cap' || safeType === 'cap-discount';
    const showDiscount = safeType === 'discount' || safeType === 'cap-discount';

    const capField = document.getElementById('sf-field-valcap');
    const discountField = document.getElementById('sf-field-discount');
    if (capField) capField.style.display = showCap ? 'flex' : 'none';
    if (discountField) discountField.style.display = showDiscount ? 'flex' : 'none';
  }

  // Listen to SAFE type dropdown
  const sfSafeType = document.getElementById('sf-safe-type');
  if (sfSafeType) {
    sfSafeType.addEventListener('change', () => {
      safetiUpdateSafeSubFields();
      safetiUpdateCalc();
    });
  }

  // Listen to discount input to update effective rate display
  const sfDiscount = document.getElementById('sf-discount');
  if (sfDiscount) {
    sfDiscount.addEventListener('input', () => {
      const effectiveEl = document.getElementById('sf-discount-effective');
      if (effectiveEl) effectiveEl.textContent = 100 - (parseFloat(sfDiscount.value) || 0);
      safetiUpdateCalc();
    });
  }

  // ---- Step switching ----
  function safetiGoToStep(step) {
    // Update panels
    document.querySelectorAll('.safeti-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('safeti-panel-' + step);
    if (panel) panel.classList.add('active');

    // Update step buttons
    document.querySelectorAll('.safeti-step-btn').forEach(btn => {
      const s = parseInt(btn.getAttribute('data-safeti-step'));
      btn.classList.remove('active', 'completed');
      if (s === step) btn.classList.add('active');
      if (s < step) btn.classList.add('completed');
      btn.setAttribute('aria-selected', s === step ? 'true' : 'false');
    });

    // If step 4, update preview
    if (step === 4) {
      safetiUpdatePreview();
    }

    // Scroll builder into view
    const builder = document.querySelector('.safeti-builder');
    if (builder) builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Attach step nav buttons ----
  document.querySelectorAll('[data-safeti-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.getAttribute('data-safeti-next'));
      if (nextStep === 2 && safetiSelectedType) {
        safetiShowTypeFields(safetiSelectedType);
        safetiUpdateCalc();
      }
      safetiGoToStep(nextStep);
    });
  });

  document.querySelectorAll('[data-safeti-prev]').forEach(btn => {
    btn.addEventListener('click', () => {
      safetiGoToStep(parseInt(btn.getAttribute('data-safeti-prev')));
    });
  });

  // Step tab clicks
  document.querySelectorAll('.safeti-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-safeti-step'));
      if (targetStep === 1 || safetiSelectedType) {
        if (targetStep === 2 && safetiSelectedType) {
          safetiShowTypeFields(safetiSelectedType);
          safetiUpdateCalc();
        }
        safetiGoToStep(targetStep);
      }
    });
  });

  // ---- Live Calculation (Step 2) ----
  function safetiUpdateCalc() {
    const amountRaw = document.getElementById('sf-amount');
    if (!amountRaw) return;
    const amount = parseCurrencyInput(amountRaw.value);
    const type = safetiSelectedType || 'interest';

    if (type === 'interest') {
      const multipleEl = document.getElementById('sf-multiple');
      const interestEl = document.getElementById('sf-interest');
      const eventDateEl = document.getElementById('sf-event-date');

      const multiple = parseFloat(multipleEl ? multipleEl.value : 1.5) || 1.5;
      const interestRate = parseFloat(interestEl ? interestEl.value : 10) || 0;
      const eventDate = eventDateEl ? eventDateEl.value : '';

      const returned = amount * multiple;
      const interestAmt = amount * (interestRate / 100);

      const calcAmountEl = document.getElementById('calc-amount');
      const calcReturnedEl = document.getElementById('calc-returned');
      const calcReturnedSub = document.getElementById('calc-returned-sub');
      const calcInterestEl = document.getElementById('calc-interest');
      const calcInterestSub = document.getElementById('calc-interest-sub');
      const calcDateEl = document.getElementById('calc-date');

      if (calcAmountEl) calcAmountEl.textContent = formatCurrency(amount);
      if (calcReturnedEl) calcReturnedEl.textContent = formatCurrency(returned);
      if (calcReturnedSub) calcReturnedSub.textContent = '\u00d7 ' + multiple + 'x multiple';
      if (calcInterestEl) calcInterestEl.textContent = formatCurrency(interestAmt);
      if (calcInterestSub) calcInterestSub.textContent = interestRate + '% per annum';
      if (calcDateEl) calcDateEl.textContent = formatDateDisplay(eventDate);

    } else if (type === 'safe') {
      const safeTypeEl = document.getElementById('sf-safe-type');
      const valCapEl = document.getElementById('sf-val-cap');
      const discountEl = document.getElementById('sf-discount');
      const safeType = safeTypeEl ? safeTypeEl.value : 'cap';

      const valCap = parseCurrencyInput(valCapEl ? valCapEl.value : 5000000);
      const discountRate = parseFloat(discountEl ? discountEl.value : 20) || 20;
      const effectiveRate = 100 - discountRate;

      const showCap = safeType === 'cap' || safeType === 'cap-discount';
      const showDiscount = safeType === 'discount' || safeType === 'cap-discount';

      const ownership = (showCap && valCap > 0) ? (amount / valCap * 100) : null;

      const calcSafeAmountEl = document.getElementById('calc-safe-amount');
      const calcSafeCapEl = document.getElementById('calc-safe-cap');
      const calcSafeCapCard = document.getElementById('calc-safe-cap-card');
      const calcSafeDiscountEl = document.getElementById('calc-safe-discount');
      const calcSafeDiscountCard = document.getElementById('calc-safe-discount-card');
      const calcSafeOwnershipEl = document.getElementById('calc-safe-ownership');

      if (calcSafeAmountEl) calcSafeAmountEl.textContent = formatCurrency(amount);
      if (calcSafeCapCard) calcSafeCapCard.style.display = showCap ? '' : 'none';
      if (calcSafeCapEl) calcSafeCapEl.textContent = formatCurrency(valCap);
      if (calcSafeDiscountCard) calcSafeDiscountCard.style.display = showDiscount ? '' : 'none';
      if (calcSafeDiscountEl) {
        calcSafeDiscountEl.textContent = effectiveRate + '%';
        if (calcSafeDiscountEl.nextElementSibling) {
          calcSafeDiscountEl.nextElementSibling.textContent = '(100 \u2212 ' + discountRate + '% discount)';
        }
      }
      if (calcSafeOwnershipEl) {
        calcSafeOwnershipEl.textContent = (ownership !== null) ? ownership.toFixed(2) + '%' : 'N/A';
      }

    } else if (type === 'token') {
      const tokenPriceEl = document.getElementById('sf-token-price');
      const tokenCountEl = document.getElementById('sf-token-count');
      const vestingEl = document.getElementById('sf-vesting');

      const tokenPrice = parseCurrencyInput(tokenPriceEl ? tokenPriceEl.value : 0.1);
      const tokenCount = tokenPrice > 0 ? Math.floor(amount / tokenPrice) : 0;
      const vesting = parseInt(vestingEl ? vestingEl.value : 12) || 12;

      // Update auto-calculated token count field
      if (tokenCountEl) {
        tokenCountEl.value = tokenCount > 0 ? tokenCount.toLocaleString('en-US') : '—';
      }

      const calcTokenAmountEl = document.getElementById('calc-token-amount');
      const calcTokenPriceEl = document.getElementById('calc-token-price');
      const calcTokenCountEl = document.getElementById('calc-token-count');
      const calcTokenVestingEl = document.getElementById('calc-token-vesting');

      if (calcTokenAmountEl) calcTokenAmountEl.textContent = formatCurrency(amount);
      if (calcTokenPriceEl) calcTokenPriceEl.textContent = tokenPrice > 0 ? '$' + tokenPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—';
      if (calcTokenCountEl) calcTokenCountEl.textContent = tokenCount > 0 ? tokenCount.toLocaleString('en-US') : '—';
      if (calcTokenVestingEl) calcTokenVestingEl.textContent = vesting + ' months';
    }
  }

  // Format amount field with commas on blur
  const sfAmount = document.getElementById('sf-amount');
  if (sfAmount) {
    sfAmount.addEventListener('input', () => {
      safetiUpdateCalc();
    });
    sfAmount.addEventListener('blur', () => {
      const val = parseCurrencyInput(sfAmount.value);
      if (val > 0) sfAmount.value = val.toLocaleString('en-US');
      safetiUpdateCalc();
    });
  }

  // Valuation cap field
  const sfValCap = document.getElementById('sf-val-cap');
  if (sfValCap) {
    sfValCap.addEventListener('input', safetiUpdateCalc);
    sfValCap.addEventListener('blur', () => {
      const val = parseCurrencyInput(sfValCap.value);
      if (val > 0) sfValCap.value = val.toLocaleString('en-US');
      safetiUpdateCalc();
    });
  }

  // Token price field
  const sfTokenPrice = document.getElementById('sf-token-price');
  if (sfTokenPrice) {
    sfTokenPrice.addEventListener('input', safetiUpdateCalc);
    sfTokenPrice.addEventListener('blur', safetiUpdateCalc);
  }

  ['sf-multiple', 'sf-interest', 'sf-event-date', 'sf-inv-date', 'sf-close-date',
   'sf-vesting', 'sf-tge-date', 'sf-token-network'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', safetiUpdateCalc);
    if (el) el.addEventListener('input', safetiUpdateCalc);
  });

  // Initial calc
  safetiUpdateCalc();

  // ---- SAFE type label helper ----
  function getSafeTypeLabel(val) {
    const map = {
      'cap': 'Valuation Cap, no Discount',
      'discount': 'Discount, no Valuation Cap',
      'cap-discount': 'Valuation Cap and Discount',
      'mfn': 'MFN (no Cap, no Discount)',
    };
    return map[val] || val;
  }

  // ---- Review Preview (Step 4) ----
  function safetiUpdatePreview() {
    const get = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    const getRadio = name => { const el = document.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ''; };
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };

    const type = safetiSelectedType || 'interest';
    const amount = parseCurrencyInput(get('sf-amount'));
    const invType = getRadio('inv-type');
    const invName = get('inv-name');
    const coName = get('co-name');

    // Common fields
    set('preview-co', coName || '—');
    set('preview-company-name', coName || 'Your Company');
    set('preview-state', get('co-state'));
    set('preview-inv', invName + (invType ? ' (' + invType + ')' : ''));
    set('preview-amount', formatCurrency(amount));
    set('preview-inv-date', formatDateDisplay(get('sf-inv-date')));
    set('preview-close-date', formatDateDisplay(get('sf-close-date')));

    // Investment type label
    const typeLabels = { safe: 'SAFE', token: 'Token', interest: 'Interest' };
    set('preview-inv-type', typeLabels[type] || '—');

    // Instrument type in preview header
    set('preview-instrument-type', 'SAFETI');
    set('preview-instrument-subtitle', 'Simple Agreement for Future Equity, Token or Interest');

    // Download button text
    const downloadBtn = document.getElementById('safeti-download-btn');
    if (downloadBtn) {
      const typeNames = { safe: 'SAFE', token: 'Token', interest: 'Interest' };
      const svg = downloadBtn.querySelector('svg');
      downloadBtn.textContent = 'Generate ' + (typeNames[type] || 'SAFETI') + ' Document';
      if (svg) downloadBtn.prepend(svg);
    }

    // Hide all type-specific preview rows first
    document.querySelectorAll('.safeti-doc-term[data-preview-for]').forEach(el => {
      el.style.display = 'none';
    });
    // Show rows for selected type
    document.querySelectorAll('.safeti-doc-term[data-preview-for="' + type + '"]').forEach(el => {
      el.style.display = 'flex';
    });

    // Universal SAFETI values
    const multiple = parseFloat(get('sf-multiple')) || 1.5;
    const interestRate = parseFloat(get('sf-interest')) || 0;
    set('preview-multiple', multiple + 'x');
    set('preview-returned', formatCurrency(amount * multiple));
    set('preview-interest', interestRate + '%');
    set('preview-event-date', formatDateDisplay(get('sf-event-date')));

    // Type-specific values
    if (type === 'safe') {
      const safeType = get('sf-safe-type');
      const valCap = parseCurrencyInput(get('sf-val-cap'));
      const discountRate = parseFloat(get('sf-discount')) || 20;
      const showCap = safeType === 'cap' || safeType === 'cap-discount';
      const showDiscount = safeType === 'discount' || safeType === 'cap-discount';
      const ownership = (showCap && valCap > 0) ? (amount / valCap * 100).toFixed(2) + '%' : 'N/A';

      set('preview-safe-type', getSafeTypeLabel(safeType));
      set('preview-val-cap', showCap ? formatCurrency(valCap) : 'N/A');
      set('preview-discount', showDiscount ? (100 - discountRate) + '% effective (' + discountRate + '% discount)' : 'N/A');
      set('preview-safe-ownership', ownership);

    } else if (type === 'token') {
      const tokenPrice = parseCurrencyInput(get('sf-token-price'));
      const tokenCount = tokenPrice > 0 ? Math.floor(amount / tokenPrice) : 0;
      const vesting = parseInt(get('sf-vesting')) || 12;

      set('preview-token-price', tokenPrice > 0 ? '$' + tokenPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—');
      set('preview-token-count', tokenCount > 0 ? tokenCount.toLocaleString('en-US') : '—');
      set('preview-token-network', get('sf-token-network') || '—');
      set('preview-tge-date', formatDateDisplay(get('sf-tge-date')));
      set('preview-vesting', vesting + ' months');
    }
  }

  // ---- SAFETI Signup Modal ----
  const downloadBtn = document.getElementById('safeti-download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', safetiShowModal);
  }

  function safetiShowModal() {
    const modal = document.getElementById('safeti-signup-modal');
    if (!modal) return;
    // Reset to form view each time
    var formEl = document.getElementById('safeti-modal-form');
    var successEl = document.getElementById('safeti-modal-success');
    if (formEl) formEl.style.display = '';
    if (successEl) successEl.style.display = 'none';
    modal.style.display = 'flex';
  }

  // ---- Email form submission ----
  var emailForm = document.getElementById('safeti-email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var emailInput = document.getElementById('safeti-email');
      var submitBtn = document.getElementById('safeti-submit-btn');
      var errorEl = document.getElementById('safeti-form-error');
      var email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;

      // Disable button while submitting
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }
      if (errorEl) errorEl.style.display = 'none';

      // Post to Google Form in background
      var formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdECSl1Bq25340rO6kHadmZ_9QUpX1e_eOj9oVvZgJftXo14A/formResponse';
      var formData = new URLSearchParams();
      formData.set('entry.326847177', email.split('@')[0]); // Name = email prefix
      formData.set('entry.1914696198', email);

      fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      }).then(function() {
        // Show success (no-cors always resolves, even on success)
        var formView = document.getElementById('safeti-modal-form');
        var successView = document.getElementById('safeti-modal-success');
        if (formView) formView.style.display = 'none';
        if (successView) successView.style.display = '';
      }).catch(function() {
        // Still show success — no-cors doesn't give us error info
        var formView = document.getElementById('safeti-modal-form');
        var successView = document.getElementById('safeti-modal-success');
        if (formView) formView.style.display = 'none';
        if (successView) successView.style.display = '';
      }).finally(function() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download document';
        }
      });
    });
  }

  // ---- Document Download Handler ----
  (function() {
    var dlBtn = document.getElementById('safeti-download-doc-btn');
    if (!dlBtn) return;
    dlBtn.addEventListener('click', function() {
      safetiGenerateDoc();
    });
  })();

  function safetiGenerateDoc() {
    var D = window.docx;
    if (!D) { alert('Document library failed to load. Please try again.'); return; }

    var get = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var getRadio = function(name) { var el = document.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ''; };

    var type = safetiSelectedType || 'interest';
    var coName = get('co-name') || 'Company';
    var coState = get('co-state') || 'Delaware';
    var invName = get('inv-name') || 'Investor';
    var invType = getRadio('inv-type') || 'Individual';
    var amount = parseCurrencyInput(get('sf-amount'));
    var invDate = get('sf-inv-date') || new Date().toISOString().slice(0, 10);
    var closeDate = get('sf-close-date') || '';

    var typeLabels = { safe: 'SAFE', token: 'Token Side Letter', interest: 'Interest Agreement' };
    var docTitle = typeLabels[type] || 'SAFETI Agreement';

    // Heading style
    function heading(text, level) {
      return new D.Paragraph({
        children: [new D.TextRun({ text: text, bold: true, size: level === 1 ? 32 : 26, font: 'Calibri' })],
        spacing: { before: level === 1 ? 400 : 300, after: 200 },
        alignment: level === 1 ? D.AlignmentType.CENTER : D.AlignmentType.LEFT,
      });
    }

    function para(text, opts) {
      opts = opts || {};
      return new D.Paragraph({
        children: [new D.TextRun({ text: text, bold: !!opts.bold, italics: !!opts.italic, size: opts.size || 22, font: 'Calibri' })],
        spacing: { before: 100, after: 100 },
        alignment: opts.center ? D.AlignmentType.CENTER : D.AlignmentType.LEFT,
      });
    }

    function termRow(label, value) {
      return new D.Paragraph({
        children: [
          new D.TextRun({ text: label + ': ', bold: true, size: 22, font: 'Calibri' }),
          new D.TextRun({ text: value, size: 22, font: 'Calibri' }),
        ],
        spacing: { before: 60, after: 60 },
      });
    }

    function signBlock(role, name) {
      return [
        new D.Paragraph({ children: [], spacing: { before: 600 } }),
        new D.Paragraph({
          children: [new D.TextRun({ text: '______________________________', size: 22, font: 'Calibri' })],
          spacing: { after: 40 },
        }),
        new D.Paragraph({
          children: [new D.TextRun({ text: name || '[Name]', bold: true, size: 22, font: 'Calibri' })],
          spacing: { after: 20 },
        }),
        para(role, { italic: true }),
      ];
    }

    var sections = [];

    // Title page
    sections.push(heading(docTitle, 1));
    sections.push(para('Generated by SAFETI (safeti.co)', { center: true, italic: true, size: 18 }));
    sections.push(para(formatDateDisplay(invDate), { center: true, size: 20 }));
    sections.push(new D.Paragraph({ children: [], spacing: { before: 400 } }));

    // Parties
    sections.push(heading('1. Parties', 2));
    sections.push(termRow('Company', coName));
    sections.push(termRow('State of Incorporation', coState));
    sections.push(termRow('Investor', invName + ' (' + invType + ')'));
    sections.push(termRow('Investment Amount', formatCurrency(amount)));
    sections.push(termRow('Investment Date', formatDateDisplay(invDate)));
    if (closeDate) sections.push(termRow('Closing Date', formatDateDisplay(closeDate)));

    // Type-specific terms
    sections.push(heading('2. Terms', 2));

    if (type === 'interest') {
      var multiple = parseFloat(get('sf-multiple')) || 1.5;
      var interestRate = parseFloat(get('sf-interest')) || 10;
      var eventDate = get('sf-event-date') || '';

      sections.push(termRow('Multiple', multiple + 'x'));
      sections.push(termRow('Total Return', formatCurrency(amount * multiple)));
      sections.push(termRow('Interest Rate', interestRate + '% per annum'));
      sections.push(termRow('Annual Interest', formatCurrency(amount * (interestRate / 100))));
      if (eventDate) sections.push(termRow('Liquidity Event Date', formatDateDisplay(eventDate)));

      sections.push(heading('3. Agreement', 2));
      sections.push(para('This Interest Agreement (the "Agreement") is entered into as of ' + formatDateDisplay(invDate) + ' by and between ' + coName + ' (the "Company"), a ' + coState + ' corporation, and ' + invName + ' (the "Investor").'));
      sections.push(para('The Investor agrees to invest ' + formatCurrency(amount) + ' (the "Investment Amount") in the Company. In consideration, the Company agrees to repay the Investor a total of ' + formatCurrency(amount * multiple) + ' (the "Return Amount"), representing a ' + multiple + 'x multiple on the Investment Amount.'));
      sections.push(para('Additionally, the Company shall pay interest on the outstanding Investment Amount at a rate of ' + interestRate + '% per annum, calculated from the date of investment until the Return Amount is paid in full.'));
      if (eventDate) {
        sections.push(para('The Return Amount and any accrued interest shall become due and payable upon the earlier of: (a) a Liquidity Event (as defined below), or (b) ' + formatDateDisplay(eventDate) + '.'));
      } else {
        sections.push(para('The Return Amount and any accrued interest shall become due and payable upon a Liquidity Event, which includes a Change of Control, an IPO, or a dissolution of the Company.'));
      }
      sections.push(para('A "Liquidity Event" means: (i) a Change of Control, meaning a transaction or series of transactions in which any person or group acquires more than 50% of the outstanding voting power of the Company; (ii) an Initial Public Offering ("IPO"), meaning the closing of the Company\'s first firm commitment underwritten initial public offering of its common stock; or (iii) a Dissolution Event, meaning a voluntary or involuntary liquidation, dissolution, or winding up of the Company.'));

    } else if (type === 'safe') {
      var safeType = get('sf-safe-type') || 'cap';
      var valCap = parseCurrencyInput(get('sf-val-cap'));
      var discountRate = parseFloat(get('sf-discount')) || 20;
      var showCap = safeType === 'cap' || safeType === 'cap-discount';
      var showDiscount = safeType === 'discount' || safeType === 'cap-discount';

      sections.push(termRow('SAFE Type', getSafeTypeLabel(safeType)));
      if (showCap) {
        sections.push(termRow('Valuation Cap', formatCurrency(valCap)));
        var ownership = valCap > 0 ? (amount / valCap * 100).toFixed(2) + '%' : 'N/A';
        sections.push(termRow('Implied Ownership at Cap', ownership));
      }
      if (showDiscount) {
        sections.push(termRow('Discount Rate', discountRate + '%'));
        sections.push(termRow('Effective Price', (100 - discountRate) + '% of price per share'));
      }

      sections.push(heading('3. Agreement', 2));
      sections.push(para('This SAFE (Simple Agreement for Future Equity) is entered into as of ' + formatDateDisplay(invDate) + ' by and between ' + coName + ' (the "Company"), a ' + coState + ' corporation, and ' + invName + ' (the "Investor").'));
      sections.push(para('The Investor agrees to pay ' + formatCurrency(amount) + ' (the "Purchase Amount") to the Company in exchange for the right to receive shares of the Company\'s capital stock, subject to the terms set forth below.'));

      if (showCap && showDiscount) {
        sections.push(para('Upon an Equity Financing, the Investor will receive shares of Safe Preferred Stock at the lower of: (a) a price per share based on the Valuation Cap of ' + formatCurrency(valCap) + ', or (b) a price per share equal to the price paid by new investors multiplied by ' + (100 - discountRate) + '% (reflecting a ' + discountRate + '% discount).'));
      } else if (showCap) {
        sections.push(para('Upon an Equity Financing, the Investor will receive shares of Safe Preferred Stock at a price per share based on the Valuation Cap of ' + formatCurrency(valCap) + ', or the price per share paid by new investors, whichever is lower.'));
      } else if (showDiscount) {
        sections.push(para('Upon an Equity Financing, the Investor will receive shares of Safe Preferred Stock at a price per share equal to the price paid by new investors multiplied by ' + (100 - discountRate) + '% (reflecting a ' + discountRate + '% discount).'));
      } else {
        sections.push(para('This SAFE operates on a Most Favored Nation ("MFN") basis. If the Company issues any subsequent SAFEs with more favorable terms prior to the Equity Financing, the terms of this SAFE shall automatically be amended to match those more favorable terms.'));
      }

      sections.push(para('"Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed valuation, including but not limited to a pre-money or post-money valuation.'));
      sections.push(para('Upon a Liquidity Event, the Investor will receive the greater of: (i) the Purchase Amount, or (ii) a number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price. "Liquidity Price" means the price per share at the Valuation Cap' + (showDiscount ? ' or the Discount Rate, whichever is lower' : '') + '.'));
      sections.push(para('Upon a Dissolution Event, the Company shall pay the Investor an amount equal to the Purchase Amount, prior to any distribution to holders of Common Stock.'));

    } else if (type === 'token') {
      var tokenPrice = parseCurrencyInput(get('sf-token-price'));
      var tokenCount = tokenPrice > 0 ? Math.floor(amount / tokenPrice) : 0;
      var vesting = parseInt(get('sf-vesting')) || 12;
      var tgeDate = get('sf-tge-date') || '';
      var tokenNetwork = get('sf-token-network') || '';

      sections.push(termRow('Token Price', tokenPrice > 0 ? '$' + tokenPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 'TBD'));
      sections.push(termRow('Token Allocation', tokenCount > 0 ? tokenCount.toLocaleString('en-US') + ' tokens' : 'TBD'));
      sections.push(termRow('Vesting Period', vesting + ' months'));
      if (tokenNetwork) sections.push(termRow('Token Network', tokenNetwork));
      if (tgeDate) sections.push(termRow('Token Generation Event', formatDateDisplay(tgeDate)));

      sections.push(heading('3. Agreement', 2));
      sections.push(para('This Token Side Letter (the "Agreement") is entered into as of ' + formatDateDisplay(invDate) + ' by and between ' + coName + ' (the "Company"), a ' + coState + ' corporation, and ' + invName + ' (the "Investor").'));
      sections.push(para('In consideration of the Investor\'s investment of ' + formatCurrency(amount) + ' (the "Purchase Amount"), the Company agrees to deliver to the Investor ' + (tokenCount > 0 ? tokenCount.toLocaleString('en-US') : '[TBD]') + ' tokens (the "Token Allocation") at a price of ' + (tokenPrice > 0 ? '$' + tokenPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '[TBD]') + ' per token.'));
      sections.push(para('The Token Allocation shall vest over a period of ' + vesting + ' months following the Token Generation Event ("TGE")' + (tgeDate ? ', which is currently expected on or about ' + formatDateDisplay(tgeDate) : '') + '. Vesting shall occur on a monthly, pro-rata basis.'));
      if (tokenNetwork) {
        sections.push(para('Tokens shall be issued on the ' + tokenNetwork + ' network and delivered to a wallet address provided by the Investor.'));
      }
      sections.push(para('If the TGE does not occur within 36 months of the date of this Agreement, the Investor may elect to receive a refund of the Purchase Amount in lieu of the Token Allocation.'));
    }

    // Governing law
    sections.push(heading('4. Governing Law', 2));
    sections.push(para('This Agreement shall be governed by and construed in accordance with the laws of the State of ' + coState + ', without regard to its conflict of laws provisions.'));

    // Disclaimer
    sections.push(heading('5. Disclaimer', 2));
    sections.push(para('This document was generated using SAFETI (safeti.co), a product of UNOCU Inc. This document is provided for informational purposes only and does not constitute legal advice. Both parties should consult with qualified legal counsel before executing this agreement.', { italic: true, size: 20 }));

    // Signature blocks
    sections.push(heading('Signatures', 2));
    sections = sections.concat(signBlock('The Company — ' + coName, ''));
    sections = sections.concat(signBlock('The Investor — ' + invName, ''));

    // Build document
    var doc = new D.Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: sections,
      }],
    });

    // Generate and download
    D.Packer.toBlob(doc).then(function(blob) {
      var filename = 'SAFETI-' + type.toUpperCase() + '-' + coName.replace(/[^a-zA-Z0-9]/g, '_') + '.docx';
      window.saveAs(blob, filename);
    }).catch(function(err) {
      console.error('Document generation failed:', err);
      alert('Document generation failed. Please try again.');
    });
  }

  // Modal close handlers
  (function() {
    const modal = document.getElementById('safeti-signup-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.safeti-modal__close');
    const backdrop = modal.querySelector('.safeti-modal__backdrop');
    function closeModal() { modal.style.display = 'none'; }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
    });
  })();

})();
