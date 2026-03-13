/* app.js — SAFETI by UNOCU — Standalone Site JavaScript */
(function() {
  'use strict';

  /* ============================================================
     DARK MODE TOGGLE
     ============================================================ */
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Default to light theme; user can toggle to dark
  if (!html.getAttribute('data-theme')) {
    html.setAttribute('data-theme', 'light');
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

    // ---- Gather form values ----
    var coName    = get('co-name') || 'Company';
    var invName   = get('inv-name') || 'Investor';
    var invType   = getRadio('inv-type') || 'individual';
    var amount    = parseCurrencyInput(get('sf-amount'));
    var invDate   = get('sf-inv-date') || new Date().toISOString().slice(0, 10);
    var multiple  = parseFloat(get('sf-multiple')) || 1.5;
    var closeDate = get('sf-close-date') || '';
    var interestRate = parseFloat(get('sf-interest')) || 10;
    var eventDate = get('sf-event-date') || '';

    var amountFmt   = formatCurrency(amount);
    var returnedAmt = formatCurrency(amount * multiple);
    var multipleStr = multiple + 'x';
    var invDateFmt  = formatDateDisplay(invDate);
    var closeDateFmt = formatDateDisplay(closeDate);
    var eventDateFmt = formatDateDisplay(eventDate);
    var interestStr  = interestRate + '%';

    var coSigner  = get('co-signer') || '___________________';
    var coTitle   = get('co-title') || '___________________';
    var coEmail   = get('co-email') || '___________________';
    var invSigner = get('inv-signer') || invName;
    var invTitle  = get('inv-title') || '___________________';
    var invEmail  = get('inv-email') || '___________________';

    // ---- Shared text-run helpers ----
    var FONT = 'Calibri';
    var SZ = 20; // 10pt

    function t(text, opts) {
      opts = opts || {};
      return new D.TextRun({
        text: text,
        font: FONT,
        size: opts.size || SZ,
        bold: !!opts.bold,
        italics: !!opts.italics,
        underline: opts.underline ? {} : undefined,
        allCaps: !!opts.allCaps,
        break: opts.break ? 1 : undefined,
      });
    }

    function tb(text) { return t(text, { bold: true }); }
    function ti(text) { return t(text, { italics: true }); }
    function tbi(text) { return t(text, { bold: true, italics: true }); }
    function tu(text) { return t(text, { underline: true }); }
    function tbu(text) { return t(text, { bold: true, underline: true }); }

    // Highlighted placeholder (yellow shading to match original .docx)
    function th(text) {
      return new D.TextRun({
        text: text,
        font: FONT,
        size: SZ,
        shading: { type: D.ShadingType.CLEAR, fill: 'FFFF00' },
      });
    }

    function thb(text) {
      return new D.TextRun({
        text: text,
        font: FONT,
        size: SZ,
        bold: true,
        shading: { type: D.ShadingType.CLEAR, fill: 'FFFF00' },
      });
    }

    function p(children, opts) {
      opts = opts || {};
      var pOpts = {
        children: children,
        spacing: { after: opts.after !== undefined ? opts.after : 120, before: opts.before || 0, line: opts.line || 276 },
      };
      if (opts.alignment) pOpts.alignment = opts.alignment;
      if (opts.indent) pOpts.indent = opts.indent;
      if (opts.bullet) pOpts.bullet = opts.bullet;
      return new D.Paragraph(pOpts);
    }

    function pCenter(children, opts) {
      opts = opts || {};
      opts.alignment = D.AlignmentType.CENTER;
      return p(children, opts);
    }

    function emptyPara() {
      return p([t('')], { after: 0 });
    }

    // Indented paragraph (for sub-sections a, b, c, etc.)
    function pIndent(children, opts) {
      opts = opts || {};
      opts.indent = { left: 720 }; // 0.5 inch
      return p(children, opts);
    }

    // ---- Build document content ----
    var content = [];

    // ========== SECURITIES DISCLAIMER (ALL CAPS) ==========
    content.push(p([
      t('THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "ACT"), OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR HYPOTHECATED EXCEPT AS PERMITTED UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.'),
    ], { after: 240 }));

    // ========== COMPANY NAME (centered, bold) ==========
    content.push(pCenter([thb(coName)], { before: 240 }));

    // ========== SAFETI (centered, bold) ==========
    content.push(pCenter([tb('SAFETI')]));

    // ========== Subtitle ==========
    content.push(pCenter([tb('(Simple Agreement for Future Equity, Token or Interest)')], { after: 240 }));

    // ========== PREAMBLE ==========
    content.push(p([
      t('THIS CERTIFIES THAT in exchange for the payment by '),
      th(invName),
      t(' (the "'),
      tb('Investor'),
      t('", a '),
      th(invType),
      t(') of US$'),
      th(amountFmt.replace('$', '')),
      t(' (the "'),
      tb('Purchase Amount'),
      t('") on or about '),
      th(invDateFmt),
      t(', '),
      th(coName),
      t('., a Delaware corporation (the "'),
      tb('Company'),
      t('"), hereby issues to the Investor the right to certain equity, token, or interest conversion rights pursuant to this SAFETI, subject to the terms set forth below.'),
    ], { after: 200 }));

    content.push(p([
      t('The settlement of this SAFETI will be as follows:'),
    ], { after: 120 }));

    content.push(p([
      t('The Investor at the Interest Event Date can select one of the following options:'),
    ], { after: 200 }));

    // ========== INVESTOR CONVERSION TERMS ==========
    content.push(p([tb('Investor Conversion Terms')], { after: 200 }));

    // 1) INTEREST
    content.push(p([
      t('1)  '),
      tb('INTEREST'),
    ], { after: 40 }));
    content.push(pIndent([
      t('Convert the purchase amount into debt in the Company before the close of business on '),
      th(invDateFmt),
      t(' with a multiple rate return of this SAFETI is '),
      thb(multipleStr),
      t(' of the investment amount (US$'),
      th(amountFmt.replace('$', '')),
      t('), for a total of US$'),
      th(returnedAmt.replace('$', '')),
      t(' returned capital at the interest event date. The interest event date is the date on which the next equity round change must occur. The subscription and confirmation of payment of this SAFETI must occur on or before '),
      th(closeDateFmt),
      t('.'),
    ], { after: 200 }));

    // 2) TOKEN
    content.push(p([
      t('2)  '),
      tb('TOKEN'),
    ], { after: 40 }));
    content.push(pIndent([
      t('Convert the purchase amount into tokens of the Company before the close of business on '),
      th(invDateFmt),
      t(' with a multiple rate return of this SAFETI is '),
      thb(multipleStr),
      t(' of the investment amount (US$'),
      th(amountFmt.replace('$', '')),
      t('), for a total of US$'),
      th(returnedAmt.replace('$', '')),
      t(' returned capital in tokens of '),
      thb(coName),
      t(' at the interest event date. The interest event date is the date on which the next equity round change must occur. This Token conversion option is only available to non-US investors and entities, consistent with the Initial Token Offering restrictions set forth in Section 2. The subscription and confirmation of payment of this SAFETI must occur on or before '),
      th(closeDateFmt),
      t('.'),
    ], { after: 200 }));

    // 3) EQUITY
    content.push(p([
      t('3)  EQUITY'),
    ], { after: 40 }));
    content.push(pIndent([
      t('Convert the purchase amount into equity in the Company before termination date of this SAFETI of the investment amount (US$'),
      th(amountFmt.replace('$', '')),
      t('), If there is an Equity Financing on the initial closing of such Equity Financing, this SAFETI will automatically convert into the greater of: (1) the number of shares of Standard Preferred Stock equal to the Purchase Amount divided by the lowest price per share of the Standard Preferred Stock; or (2) the number of shares of SAFETI Preferred Stock equal to the Purchase Amount divided by the SAFETI Price.'),
    ], { after: 200 }));

    // 4) Fallback clause
    content.push(p([
      t('4)  If the Company fails to complete the financing event on or before the Interest Event date, the Company shall immediately pay the Investor the purchase amount with an interest rate of 10% per annum accrued thereon.'),
    ], { after: 240 }));

    // ========== DEFINED TERM VARIABLES ==========
    content.push(p([
      t('For purposes of clarification, the defined term variables are set forth below:'),
    ], { after: 200 }));

    content.push(p([
      t('The "'),
      tb('Multiple Rate'),
      t('" of this SAFETI is '),
      thb(multipleStr),
      t(' if subscribed prior to '),
      th(closeDateFmt),
      t('.'),
    ], { after: 120 }));

    content.push(p([
      t('The "'),
      tb('Interest Rate'),
      t('" of this SAFETI is '),
      th(interestStr),
      t('.'),
    ], { after: 120 }));

    content.push(p([
      t('The "'),
      tb('Interest Event'),
      t('" of this SAFETI is on or before '),
      th(eventDateFmt),
      t(' at 5pm PST.'),
    ], { after: 120 }));

    content.push(p([
      t('The "'),
      tb('Returned Capital'),
      t('" of this SAFETI is '),
      th(returnedAmt),
    ], { after: 120 }));

    content.push(p([
      t('See '),
      tb('Section 2'),
      t(' for certain additional defined terms.'),
    ], { after: 240 }));

    // ========== SECTION 1: EVENTS ==========
    content.push(p([tbi('1. Events')], { before: 200, after: 200 }));

    // 1(a) Equity Financing
    content.push(pIndent([
      t('(a) '),
      tb('Equity Financing.'),
      t(' If there is an Equity Financing Event before the expiration or termination of this instrument, the Company will automatically issue to the Investor a debt repayment of the investor\u2019s investment stated in the purchase amount of '),
      th(amountFmt.replace('$', '')),
      t(' and return interest of '),
      th(interestStr),
      t(' within 30 days of conclusion of the equity financing event. This instrument will expire and terminate once the Company has made payment to the Investor.'),
    ], { after: 200 }));

    // 1(b) Liquidity Event
    content.push(pIndent([
      tb('(b) '),
      tbu('Liquidity Event'),
      tb('.'),
      t(' If there is a Liquidity Event before the expiration or termination of this instrument, the Investor will, at its option, either (i) receive a cash payment equal to the Returned Capital (subject to the following paragraph); or (ii) receive a number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price'),
    ], { after: 200 }));

    content.push(pIndent([
      t('In connection with Section (b)(i), the Returned Capital will be due and payable by the Company to the Investor immediately prior to, or in agreement with, the consummation of the Liquidity Event. If there are not enough funds to pay the Investor and holders of other SAFETIs (collectively, the "'),
      tb('Cash-Out Investors'),
      t('") in full, then all of the Company\u2019s available funds will be distributed with equal priority and '),
      ti('pro rata'),
      t(' among the Cash-Out Investors in proportion to their Purchase Amounts, and the Cash-Out Investors will automatically receive the number of shares of Common Stock equal to the remaining unpaid Purchase Amount divided by the Liquidity Price. In connection with a Change of Control intended to qualify as a tax-free reorganization, the Company may reduce, '),
      ti('pro rata'),
      t(', the Purchase Amounts payable to the Cash-Out Investors by the amount determined by its board of directors in good faith to be advisable for such Change of Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, and in such case, the Cash-Out Investors will automatically receive the number of shares of Common Stock equal to the remaining unpaid Purchase Amount divided by the Liquidity Price.'),
    ], { after: 200 }));

    // 1(c) Dissolution Event
    content.push(pIndent([
      tb('(c) '),
      tbu('Dissolution Event'),
      tb('.'),
      t(' If there is a Dissolution Event before this instrument expires or terminates, the Company will pay the Investor an amount equal to the Purchase Amount, due and payable to the Investor immediately prior to, or concurrent with, the consummation of the Dissolution Event. The Purchase Amount will be paid prior and in preference to any Distribution of any of the assets of the Company to holders of the Company\u2019s capital stock by reason of their ownership of such stock. If immediately prior to the consummation of the Dissolution Event, the assets of the Company legally available for distribution to the Investor and all holders of all other SAFETIs (the "'),
      tb('Dissolving Investors'),
      t('"), as determined in good faith by the Company\u2019s board of directors, are insufficient to permit the payment to the Dissolving Investors of their respective Purchase Amounts, then the entire assets of the Company legally available for distribution will be distributed with equal priority and '),
      ti('pro rata'),
      t(' among the Dissolving Investors in proportion to the Purchase Amounts they would otherwise be entitled to receive pursuant to this Section 1(c). After the payment, or setting aside payment, to the Investor, this instrument will expire and terminate.'),
    ], { after: 200 }));

    // 1(d) Interest Event
    content.push(pIndent([
      tb('(d) '),
      tbu('Interest Event.'),
      t(' The Company will pay an amount equal to the Purchase Amount in cash or cash equivalent including all accrued and unpaid interest thereon calculated at the Interest Rate, due and payable to the Investor immediately prior to, or concurrent with, the consummation of the Interest Event. The Purchase Amount will be paid prior and in preference to any distribution of any of the assets (including token or stock deliverables) of the Company or creditors of the Company. The Investor can elect to reject the interest event, and send written notice to the Company at least 4 weeks prior to the Interest Event and elect to change the conversion of their SAFETI to either Token Financing (subject to the non-US investor restriction set forth in the Initial Token Offering definition in Section 2) or Equity Financing, with the consent of the Company board. The Investor is allowed to voluntarily convert into equity in the event of no equity financing or token financing.'),
    ], { after: 200 }));

    // 1(e) Termination Event
    content.push(pIndent([
      tb('(e) '),
      tbu('Termination Event.'),
      t(' This instrument will expire and terminate (without relieving the Company of any obligations arising from a prior breach of or non-compliance with this instrument) upon either (i) the issuance of stock or payment to the Investor pursuant to Section 1(a) or Section 1(b); (ii) the payment, or setting aside for payment, of amounts due the Investor pursuant to Section 1(c) or Section 1(d); or (iii) the conversion of this SAFETI into tokens pursuant to the Investor Conversion Terms.'),
    ], { after: 240 }));

    // ========== SECTION 2: DEFINITIONS ==========
    content.push(p([tbi('2. Definitions')], { before: 200, after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Change of Control'),
      t('\u201D means (i) a transaction or series of related transactions in which any \u201Cperson\u201D or \u201Cgroup\u201D (within the meaning of Section 13(d) and 14(d) of the Securities Exchange Act of 1934, as amended), becomes the \u201Cbeneficial owner\u201D (as defined in Rule 13d-3 under the Securities Exchange Act of 1934, as amended), directly or indirectly, of more than 50% of the outstanding voting securities of the Company having the right to vote for the election of members of the Company\u2019s board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a transaction or series of related transactions in which the holders of the voting securities of the Company outstanding immediately prior to such transaction or series of related transactions retain, immediately after such transaction or series of related transactions, at least a majority of the total voting power represented by the outstanding voting securities of the Company or such other surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially all of the assets of the Company.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Common Stock'),
      t('\u201D means the common stock of the Company.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Company Capitalization'),
      t('\u201D means the sum of: (i) all shares of the Company\u2019s capital stock (on an as-converted basis) issued and outstanding, assuming exercise or conversion of all outstanding vested and unvested options, warrants and other convertible securities, and including (A) this instrument, (B) all other SAFETIs and (C) convertible promissory notes; and (ii) all shares of Common Stock reserved and available for future grant under any equity incentive or similar plan of the Company to the extent necessary to cover Promised Options, but excluding any equity incentive or similar plan created or increased in connection with the Equity Financing (except to the extent necessary to cover Promised Options).'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Distribution'),
      t('\u201D means the transfer to holders of the Company\u2019s capital stock by reason of their ownership of such stock of cash or other property without consideration whether by way of dividend or otherwise, other than dividends on the Common Stock payable in Common Stock, or the purchase or redemption of shares of the Company by the Company or its subsidiaries for cash or property other than: (i) repurchases of the Common Stock issued to or held by employees, officers, directors or consultants of the Company or its subsidiaries upon termination of their employment or services pursuant to agreements providing for the right of said repurchase, (ii) repurchases of Common Stock issued to or held by employees, officers, directors or consultants of the Company or its subsidiaries pursuant to rights of first refusal contained in agreements providing for such right and (iii) repurchases of capital stock of the Company in connection with the settlement of disputes with any stockholder.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Dissolution Event'),
      t('\u201D means (i) a voluntary termination of operations, (ii) a general assignment for the benefit of the Company\u2019s creditors or (iii) any other liquidation, dissolution or winding up of the Company ('),
      tu('excluding'),
      t(' a Liquidity Event), whether voluntary or involuntary.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Equity Financing'),
      t('\u201D means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells shares of preferred stock of the Company at a fixed pre-money valuation.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Financing Event'),
      t('\u201D means an Equity Financing, an Initial Public Offering, an Acquisition, a Liquidity Event, or any other financial event that materially affects the business.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Initial Public Offering'),
      t('\u201D means the closing of the Company\u2019s first firm commitment underwritten initial public offering of the Common Stock pursuant to a registration statement filed under the Securities Act of 1933, as amended (the \u201C'),
      tb('Securities Act'),
      t('\u201D).'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Initial Token Offering'),
      t('\u201D means the closing of the Company\u2019s first token event offering of the cryptocurrency. Only offered to non-US investors, entities. Any initial token offering will not be conducted or involve Oddup Inc or its US based affiliates.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Liquidity Capitalization'),
      t('\u201D means all shares of the Company\u2019s capital stock (on an as-converted basis) issued and outstanding, assuming exercise or conversion of all outstanding vested and unvested options, warrants and other convertible securities, but excluding: (i) all shares of the Common Stock reserved and available for future grant under any equity incentive or similar plan of the Company; (ii) this instrument; (iii) all other SAFETIs; and (iv) convertible promissory notes.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Liquidity Event'),
      t('\u201D means a Change of Control or an Initial Public Offering.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Liquidity Price'),
      t('\u201D means the price per share equal to the quotient obtained by dividing (i) the Valuation Cap by (ii) the Liquidity Capitalization as of immediately prior to the Liquidity Event.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Options'),
      t('\u201D includes options, restricted stock awards or purchases, RSUs, SARs, warrants or similar securities, vested or unvested.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Promised Options'),
      t('\u201D means promised but ungranted Options that are the greater of those (i) promised pursuant to agreements or understandings made prior to the execution of, or in connection with, the term sheet or letter of intent for the Equity Financing or Liquidity Event, as applicable (or the initial closing of the Equity Financing or consummation of the Liquidity Event, if there is no term sheet or letter of intent), (ii) in the case of an Equity Financing, treated as outstanding Options in the calculation of the Standard Preferred Stock\u2019s price per share, or (iii) in the case of a Liquidity Event, treated as outstanding Options in the calculation of the distribution of the Proceeds.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Pro Rata Rights Agreement'),
      t('\u201D means a written agreement between the Company and the Investor (and holders of other SAFETIs, as appropriate) giving the Investor a right to purchase its '),
      ti('pro rata'),
      t(' share of private placements of securities by the Company '),
      tu('occurring after the Equity Financing'),
      t(', subject to customary exceptions. '),
      ti('Pro rata'),
      t(' for purposes of the Pro Rata Rights Agreement will be calculated based on the ratio of (a) the number of shares of capital stock of the Company owned by the Investor immediately prior to the issuance of the securities to (b) the total number of shares of outstanding capital stock of the Company on a fully diluted basis, calculated as of immediately prior to the issuance of the securities.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('SAFETI'),
      t('\u201D means an instrument containing a future right to the Company\u2019s capital stock, cryptocurrency tokens or interest, similar in form and content to this instrument, purchased by investors for the purpose of funding the Company\u2019s business operations.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('SAFETI Preferred Stock'),
      t('\u201D means the shares of a series of the Company\u2019s preferred stock issued to the Investor in an Equity Financing, having the identical rights, privileges, preferences and restrictions as the shares of Standard Preferred Stock, '),
      tu('other than with respect to the per share liquidation preference, which will equal the SAFETI Price'),
      t(', as well as price-based antidilution protection and dividend rights, which will be based on such SAFETI Price.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('SAFETI Price'),
      t('\u201D means the price per share equal to the quotient obtained by dividing (i) the Valuation Cap by (ii) either (A) the Company Capitalization as of immediately prior to the Equity Financing or (B) the capitalization of the Company used to calculate the price per share of the Standard Preferred Stock, whichever calculation results in a lower price.'),
    ], { after: 200 }));

    content.push(p([
      t('\u201C'),
      tb('Standard Preferred Stock'),
      t('\u201D means the shares of a series of the Company\u2019s preferred stock issued to the investors investing new money in the Company in connection with the initial closing of the Equity Financing.'),
    ], { after: 240 }));

    // ========== SECTION 3: COMPANY REPRESENTATIONS ==========
    content.push(p([tbi('3. Company Representations')], { before: 200, after: 200 }));

    content.push(pIndent([
      t('(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of the state of its incorporation, and has the power and authority to own, lease and operate its properties and carry on its business as now conducted.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(b) The execution, delivery and performance by the Company of this instrument is within the power of the Company and, other than with respect to the actions to be taken when equity is to be issued to the Investor, has been duly authorized by all necessary actions on the part of the Company. This instrument constitutes a legal, valid and binding obligation of the Company, enforceable against the Company in accordance with its terms, except as limited by bankruptcy, insolvency or other laws of general application relating to or affecting the enforcement of creditors\u2019 rights generally and general principles of equity. To the knowledge of the Company, it is not in violation of (i) its current certificate of incorporation or bylaws, (ii) any material statute, rule or regulation applicable to the Company or (iii) any material indenture or contract to which the Company is a party or by which it is bound, where, in each case, such violation or default, individually, or together with all such violations or defaults, could reasonably be expected to have a material adverse effect on the Company.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(c) The performance and consummation of the transactions contemplated by this instrument do not and will not: (i) violate any material judgment, statute, rule or regulation applicable to the Company; (ii) result in the acceleration of any material indenture or contract to which the Company is a party or by which it is bound; or (iii) result in the creation or imposition of any lien upon any property, asset or revenue of the Company or the suspension, forfeiture, or nonrenewal of any material permit, license or authorization applicable to the Company, its business or operations.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(d) No consents or approvals are required in connection with the performance of this instrument, other than: (i) the Company\u2019s corporate approvals; (ii) any qualifications or filings under applicable securities laws; and (iii) necessary corporate approvals for the authorization of any shares of capital stock of the Company issued pursuant to Section 1.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(e) To its knowledge, the Company owns or possesses (or can obtain on commercially reasonable terms) sufficient legal rights to all patents, trademarks, service marks, trade names, copyrights, trade secrets, licenses, information, processes and other intellectual property rights necessary for its business as now conducted and as currently proposed to be conducted, without any conflict with, or infringement of the rights of, others.'),
    ], { after: 240 }));

    // ========== SECTION 4: INVESTOR REPRESENTATIONS ==========
    content.push(p([tbi('4. Investor Representations')], { before: 200, after: 200 }));

    content.push(pIndent([
      t('(a) The Investor has full legal capacity, power and authority to execute and deliver this instrument and to perform its obligations hereunder. This instrument constitutes a valid and binding obligation of the Investor, enforceable in accordance with its terms, except as limited by bankruptcy, insolvency or other laws of general application relating to or affecting the enforcement of creditors\u2019 rights generally and general principles of equity.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act. The Investor has been advised that this instrument and the underlying securities have not been registered under the Securities Act, or any state securities laws and, therefore, cannot be resold unless they are registered under the Securities Act and applicable state securities laws or unless an exemption from such registration requirements is available. The Investor is purchasing this instrument and the securities to be acquired by the Investor hereunder for its own account for investment, not as a nominee or agent, and not with a view to, or for resale in connection with, the distribution thereof, and the Investor has no present intention of selling, granting any participation in, or otherwise distributing the same. The Investor has such knowledge and experience in financial and business matters that the Investor is capable of evaluating the merits and risks of such investment, is able to incur a complete loss of such investment without impairing the Investor\u2019s financial condition and is able to bear the economic risk of such investment for an indefinite period of time.'),
    ], { after: 240 }));

    // ========== SECTION 5: MISCELLANEOUS ==========
    content.push(p([tbi('5. Miscellaneous')], { before: 200, after: 200 }));

    content.push(pIndent([
      t('(a) Any provision of this instrument may be amended, waived or modified only upon the written consent of the Company and the Investor.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(b) Any notice required or permitted by this instrument will be deemed sufficient when delivered personally or by overnight courier or sent by email to the relevant address listed on the signature page, or 48 hours after being deposited in the U.S. mail as certified or registered mail with postage prepaid, addressed to the party to be notified at such party\u2019s address listed on the signature page, as subsequently modified by written notice.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(c) The Investor is not entitled, as a holder of this instrument, to vote or receive dividends or be deemed the holder of the Company\u2019s capital stock for any purpose, nor will anything contained herein be construed to confer upon the Investor, as such, any of the rights of a stockholder of the Company or any right to vote for the election of directors or upon any matter submitted to stockholders at any meeting thereof, or to give or withhold consent to any corporate action or to receive notice of meetings, or to receive subscription rights or otherwise until shares have been issued upon the terms as described herein.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(d) Neither this instrument nor the rights contained herein may be assigned, by operation of law or otherwise, by either party without the prior written consent of the other; '),
      ti('provided, however'),
      t(', that the rights of the Investor may be assigned without the Company\u2019s consent by the Investor to any other entity who directly or indirectly, controls, is controlled by or is under common control with the Investor, including, without limitation, any general partner, managing member, officer or director of the Investor, or any venture capital fund now or hereafter existing which is controlled by one or more general partners or managing members of, or shares the same management company with, the Investor; and '),
      ti('provided, further'),
      t(', that the Company may assign this instrument in whole, without the consent of the Investor, in connection with a reincorporation to change the Company\u2019s domicile.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(e) In the event any one or more of the provisions of this instrument is for any reason held to be invalid, illegal or unenforceable, in whole or in part or in any respect, or in the event that any one or more of the provisions of this instrument operate or would prospectively operate to invalidate this instrument, then and in any such event, such provision(s) only will be deemed null and void and will not affect any other provision of this instrument and the remaining provisions of this instrument will remain operative and in full force and effect and will not be affected, prejudiced, or disturbed thereby.'),
    ], { after: 200 }));

    content.push(pIndent([
      t('(f) All rights and obligations hereunder will be governed by the laws of the State of Delaware, without regard to the conflicts of law provisions of such jurisdiction.'),
    ], { after: 240 }));

    // ========== SIGNATURE PAGE ==========
    content.push(p([ti('(Signature page follows)')], { before: 200, after: 200 }));

    content.push(p([
      t('IN WITNESS WHEREOF, the undersigned have caused this instrument to be duly executed and delivered.'),
    ], { after: 300 }));

    // Signature table: 2 columns — Company | Investor
    var sigTable = new D.Table({
      rows: [
        new D.TableRow({
          children: [
            new D.TableCell({
              children: [
                p([thb(coName)], { after: 120 }),
                p([tb('Signed By:')], { after: 60 }),
                p([t('_______________________________')], { after: 120 }),
                p([tb('Name: '), t(coSigner)], { after: 60 }),
                p([tb('Title: '), t(coTitle)], { after: 60 }),
                p([tb('Email: '), t(coEmail)], { after: 60 }),
              ],
              width: { size: 4800, type: D.WidthType.DXA },
              verticalAlign: D.VerticalAlign.TOP,
            }),
            new D.TableCell({
              children: [
                p([tb('Investor: '), th(invSigner)], { after: 120 }),
                p([tb('Signed By:')], { after: 60 }),
                p([t('_______________________________')], { after: 120 }),
                p([tb('Name: '), t(invSigner)], { after: 60 }),
                p([tb('Title: '), t(invTitle)], { after: 60 }),
                p([tb('Email: '), t(invEmail)], { after: 60 }),
              ],
              width: { size: 4800, type: D.WidthType.DXA },
              verticalAlign: D.VerticalAlign.TOP,
            }),
          ],
        }),
      ],
      width: { size: 9600, type: D.WidthType.DXA },
    });
    content.push(sigTable);

    // ========== APPENDIX 1: INVESTMENT CLOSING INFORMATION ==========
    content.push(emptyPara());
    content.push(p([tb('Appendix 1: Investment Closing Information')], { before: 300, after: 200 }));

    content.push(p([
      t('The investor, '),
      th(invName),
      t(', agrees to pay US$'),
      th(amountFmt.replace('$', '')),
      t(' to the following bank account or USD digital account.'),
    ], { after: 200 }));

    content.push(p([tb('Company Details:')], { after: 120 }));

    var bankTable = new D.Table({
      rows: [
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('For Credit of:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Address:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Account No:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Bank Name:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Bank Address:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Swift Code:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Routing and Transit No.:')])], width: { size: 3000, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 6600, type: D.WidthType.DXA } }),
        ]}),
      ],
      width: { size: 9600, type: D.WidthType.DXA },
    });
    content.push(bankTable);

    content.push(p([
      tb('IMPORTANT: '),
      t('Wire instructions MUST designate FULL TEN-DIGIT ACCOUNT NUMBER. Wires received with INCOMPLETE or INVALID ACCOUNT NUMBERS may be delayed and could possibly be returned to the sending bank.'),
    ], { before: 200, after: 240 }));

    // ========== APPENDIX 2: INVESTMENT CONFIRMATION ==========
    content.push(p([tb('Appendix 2: Investment Confirmation')], { before: 300, after: 120 }));

    content.push(p([tb('Payment Receipt')], { after: 200 }));

    var receiptTable = new D.Table({
      rows: [
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Received by Company')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([tb('Date')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([tb('Name')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([tb('Signed by')])], width: { size: 3200, type: D.WidthType.DXA } }),
        ]}),
        new D.TableRow({ children: [
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
          new D.TableCell({ children: [p([t('')])], width: { size: 3200, type: D.WidthType.DXA } }),
        ]}),
      ],
      width: { size: 9600, type: D.WidthType.DXA },
    });
    content.push(receiptTable);

    // ========== BUILD & DOWNLOAD ==========
    var doc = new D.Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: content,
      }],
    });

    D.Packer.toBlob(doc).then(function(blob) {
      var filename = 'SAFETI-' + coName.replace(/[^a-zA-Z0-9]/g, '_') + '.docx';
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
