// ============================================================
// Hjernebarometeret — Kuponkode-modul (HB_COUPON)
// ============================================================
// Load efter auth.js:
//   <script src="/shared/coupon.js"></script>
//
// Brug:
//   HB_COUPON.showRedeemModal()   — åbn kuponkode-dialog
//   HB_COUPON.injectMenuItem()    — tilføj "Indløs kode" til user-menu
// ============================================================

(function () {
  'use strict';

  const SUPABASE_URL = 'https://pmbbachqedomvixvvfpj.supabase.co';

  // ── State ──────────────────────────────────────────────
  let modalEl = null;
  let isSubmitting = false;

  // ── Styles ─────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('hb-coupon-styles')) return;
    const style = document.createElement('style');
    style.id = 'hb-coupon-styles';
    style.textContent = `
      /* Overlay */
      .hb-coupon-overlay {
        position: fixed; inset: 0;
        background: rgba(28,27,26,.45);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 1rem;
        opacity: 0;
        transition: opacity .25s ease;
      }
      .hb-coupon-overlay.visible { opacity: 1; }

      /* Modal */
      .hb-coupon-modal {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 24px 64px rgba(28,27,26,.18);
        width: 100%; max-width: 420px;
        padding: 2rem 2rem 1.75rem;
        transform: translateY(12px) scale(.97);
        transition: transform .3s cubic-bezier(.16,1,.3,1);
        font-family: var(--sans, 'Figtree', system-ui, sans-serif);
      }
      .hb-coupon-overlay.visible .hb-coupon-modal {
        transform: translateY(0) scale(1);
      }

      /* Header */
      .hb-coupon-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .hb-coupon-title {
        font-family: var(--serif, 'Source Serif 4', Georgia, serif);
        font-size: 1.35rem; font-weight: 600;
        letter-spacing: -.03em;
        color: var(--text, #1c1b1a);
        margin: 0;
      }
      .hb-coupon-subtitle {
        font-size: .875rem; color: var(--text-2, #5a5650);
        margin: .35rem 0 0; line-height: 1.45;
      }
      .hb-coupon-close {
        background: none; border: none; cursor: pointer;
        padding: 4px; margin: -4px -4px 0 0;
        color: var(--text-3, #8a857e);
        transition: color .15s;
      }
      .hb-coupon-close:hover { color: var(--text, #1c1b1a); }
      .hb-coupon-close svg { display: block; }

      /* Input group */
      .hb-coupon-input-group {
        display: flex; gap: .625rem;
        margin-bottom: 1rem;
      }
      .hb-coupon-input {
        flex: 1;
        padding: .75rem 1rem;
        font-family: var(--sans, 'Figtree', system-ui, sans-serif);
        font-size: 1rem; font-weight: 500;
        letter-spacing: .08em;
        text-transform: uppercase;
        border: 1.5px solid var(--border, #e8e5e0);
        border-radius: 10px;
        background: var(--bg, #faf9f7);
        color: var(--text, #1c1b1a);
        outline: none;
        transition: border-color .2s, box-shadow .2s;
      }
      .hb-coupon-input:focus {
        border-color: var(--accent, #2c5f4b);
        box-shadow: 0 0 0 3px rgba(44,95,75,.1);
      }
      .hb-coupon-input::placeholder {
        text-transform: none;
        letter-spacing: 0;
        font-weight: 400;
        color: var(--text-4, #b5b0a8);
      }
      .hb-coupon-input.error {
        border-color: #c2553a;
        box-shadow: 0 0 0 3px rgba(194,85,58,.1);
      }

      /* Submit button */
      .hb-coupon-btn {
        padding: .75rem 1.25rem;
        font-family: var(--sans, 'Figtree', system-ui, sans-serif);
        font-size: .9rem; font-weight: 600;
        color: #fff;
        background: var(--accent, #2c5f4b);
        border: none; border-radius: 10px;
        cursor: pointer;
        white-space: nowrap;
        transition: background .2s, transform .1s;
      }
      .hb-coupon-btn:hover { background: #245040; }
      .hb-coupon-btn:active { transform: scale(.97); }
      .hb-coupon-btn:disabled {
        opacity: .55; cursor: not-allowed;
        transform: none;
      }

      /* Feedback messages */
      .hb-coupon-feedback {
        font-size: .875rem; line-height: 1.45;
        padding: .75rem 1rem;
        border-radius: 10px;
        display: none;
      }
      .hb-coupon-feedback.visible { display: block; }
      .hb-coupon-feedback.success {
        background: #e8f5e9; color: #2e7d32;
        border: 1px solid #c8e6c9;
      }
      .hb-coupon-feedback.error {
        background: #fbe9e7; color: #c2553a;
        border: 1px solid #ffccbc;
      }

      /* Success animation */
      .hb-coupon-success-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 28px; height: 28px;
        background: #2e7d32; border-radius: 50%;
        margin-right: .5rem; vertical-align: middle;
      }
      .hb-coupon-success-icon svg {
        width: 16px; height: 16px;
      }

      /* Credits badge */
      .hb-coupon-credits {
        display: inline-flex; align-items: center; gap: .35rem;
        padding: .25rem .65rem;
        background: var(--accent-light, #e8f0ec);
        color: var(--accent, #2c5f4b);
        border-radius: 6px;
        font-size: .8rem; font-weight: 600;
        margin-top: .5rem;
      }

      /* Divider */
      .hb-coupon-divider {
        height: 1px;
        background: var(--border, #e8e5e0);
        margin: 1.25rem 0;
      }

      /* Info text */
      .hb-coupon-info {
        font-size: .8rem;
        color: var(--text-3, #8a857e);
        line-height: 1.5;
      }

      /* Spinner */
      @keyframes hb-spin { to { transform: rotate(360deg); } }
      .hb-coupon-spinner {
        display: inline-block;
        width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: hb-spin .6s linear infinite;
        vertical-align: middle;
        margin-right: .35rem;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Modal HTML ─────────────────────────────────────────
  function createModal() {
    if (modalEl) return modalEl;

    injectStyles();

    const overlay = document.createElement('div');
    overlay.className = 'hb-coupon-overlay';
    overlay.innerHTML = `
      <div class="hb-coupon-modal" role="dialog" aria-labelledby="hb-coupon-title">
        <div class="hb-coupon-header">
          <div>
            <h2 class="hb-coupon-title" id="hb-coupon-title">Indløs kuponkode</h2>
            <p class="hb-coupon-subtitle">Har du fået en kode? Indtast den herunder for at få rapport-credits.</p>
          </div>
          <button class="hb-coupon-close" aria-label="Luk">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="hb-coupon-input-group">
          <input class="hb-coupon-input" type="text" placeholder="Fx VENNER2026" maxlength="30" autocomplete="off" spellcheck="false" />
          <button class="hb-coupon-btn">Indløs</button>
        </div>

        <div class="hb-coupon-feedback"></div>

        <div class="hb-coupon-divider"></div>
        <p class="hb-coupon-info">
          Credits bruges til at låse op for fulde rapporter efter endt test. Hver rapport koster 1 credit.
        </p>
      </div>
    `;

    // Event listeners
    const closeBtn = overlay.querySelector('.hb-coupon-close');
    const input = overlay.querySelector('.hb-coupon-input');
    const submitBtn = overlay.querySelector('.hb-coupon-btn');
    const feedback = overlay.querySelector('.hb-coupon-feedback');

    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideModal();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitCode();
    });
    input.addEventListener('input', () => {
      input.classList.remove('error');
      feedback.classList.remove('visible');
    });

    submitBtn.addEventListener('click', submitCode);

    document.body.appendChild(overlay);
    modalEl = overlay;
    return overlay;
  }

  // ── Show / Hide ────────────────────────────────────────
  function showModal() {
    // Tjek om brugeren er logget ind
    if (typeof HB_AUTH !== 'undefined' && !HB_AUTH.user) {
      HB_AUTH.showLogin();
      // Lyt efter login og åbn så kupon-modal
      const handler = (e) => {
        if (e.detail?.user) {
          window.removeEventListener('hb-auth-change', handler);
          setTimeout(showModal, 300);
        }
      };
      window.addEventListener('hb-auth-change', handler);
      return;
    }

    const overlay = createModal();
    const input = overlay.querySelector('.hb-coupon-input');
    const feedback = overlay.querySelector('.hb-coupon-feedback');

    // Reset state
    input.value = '';
    input.classList.remove('error');
    feedback.className = 'hb-coupon-feedback';
    feedback.textContent = '';
    isSubmitting = false;

    // Show with animation
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
        input.focus();
      });
    });
  }

  function hideModal() {
    if (!modalEl) return;
    modalEl.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (modalEl) modalEl.style.display = 'none';
    }, 250);
  }

  // ── Submit ─────────────────────────────────────────────
  async function submitCode() {
    if (isSubmitting) return;

    const input = modalEl.querySelector('.hb-coupon-input');
    const submitBtn = modalEl.querySelector('.hb-coupon-btn');
    const feedback = modalEl.querySelector('.hb-coupon-feedback');
    const code = input.value.trim();

    if (!code) {
      input.classList.add('error');
      input.focus();
      return;
    }

    // Loading state
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="hb-coupon-spinner"></span>Tjekker...';
    feedback.classList.remove('visible');

    try {
      // Hent JWT fra HB_AUTH
      const session = HB_AUTH.supabase
        ? (await HB_AUTH.supabase.auth.getSession()).data.session
        : null;

      if (!session) {
        showFeedback(feedback, 'error', 'Du skal være logget ind for at indløse en kode.');
        return;
      }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/hjernebarometeret-redeem-coupon`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': session.access_token,
          },
          body: JSON.stringify({ code }),
        }
      );

      const data = await res.json();

      if (data.success) {
        showFeedback(
          feedback,
          'success',
          `<span class="hb-coupon-success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
           ${data.message}
           <br><span class="hb-coupon-credits">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 8h20"/></svg>
             ${data.total_credits} credits i alt
           </span>`
        );
        input.value = '';
        input.disabled = true;
        submitBtn.style.display = 'none';

        // Dispatch event så andre moduler kan reagere (fx opdatere user-menu)
        window.dispatchEvent(new CustomEvent('hb-credits-change', {
          detail: { credits: data.total_credits, granted: data.credits_granted }
        }));
      } else {
        // Vis fejlbesked fra serveren
        const messages = {
          'INVALID_CODE': 'Koden findes ikke. Tjek at du har tastet den korrekt.',
          'INACTIVE_CODE': 'Denne kode er ikke længere aktiv.',
          'EXPIRED_CODE': 'Denne kode er udløbet.',
          'MAX_USES_REACHED': 'Denne kode er allerede brugt det maksimale antal gange.',
          'ALREADY_REDEEMED': 'Du har allerede indløst denne kode.',
        };
        showFeedback(feedback, 'error', messages[data.error] || data.message || 'Noget gik galt.');
        input.classList.add('error');
        input.select();
      }
    } catch (err) {
      console.error('Coupon redeem error:', err);
      showFeedback(feedback, 'error', 'Kunne ikke forbinde til serveren. Prøv igen.');
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      if (submitBtn.style.display !== 'none') {
        submitBtn.textContent = 'Indløs';
      }
    }
  }

  function showFeedback(el, type, html) {
    el.className = `hb-coupon-feedback ${type} visible`;
    el.innerHTML = html;
  }

  // ── Integration: Tilføj menuitem ───────────────────────
  // Kalder denne for at tilføje "Indløs kode" til user-menu dropdown
  function injectMenuItem() {
    // Vent på at user-menu renders (det sker dynamisk)
    const observer = new MutationObserver(() => {
      const menu = document.querySelector('.hb-user-menu');
      if (menu && !menu.querySelector('.hb-coupon-menu-item')) {
        // Find logout-knappen og indsæt inden
        const logoutBtn = menu.querySelector('[data-action="logout"]') ||
                          Array.from(menu.querySelectorAll('button')).pop();
        
        if (logoutBtn) {
          const item = document.createElement('button');
          item.className = 'hb-coupon-menu-item';
          item.style.cssText = `
            display: flex; align-items: center; gap: .5rem;
            width: 100%; padding: .625rem .875rem;
            font-family: var(--sans, 'Figtree', system-ui, sans-serif);
            font-size: .875rem; color: var(--text, #1c1b1a);
            background: none; border: none; cursor: pointer;
            text-align: left; transition: background .15s;
          `;
          item.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h14v4"/>
              <path d="M20 12v4H6a2 2 0 0 0 0 4h14v-4"/>
              <circle cx="16" cy="12" r="1"/>
            </svg>
            Indløs kode
          `;
          item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-warm, #f5f2ee)');
          item.addEventListener('mouseleave', () => item.style.background = 'none');
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            showModal();
          });

          logoutBtn.parentNode.insertBefore(item, logoutBtn);

          // Tilføj divider
          const divider = document.createElement('div');
          divider.style.cssText = 'height:1px; background:var(--border,#e8e5e0); margin:.25rem 0;';
          logoutBtn.parentNode.insertBefore(divider, logoutBtn);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Public API ─────────────────────────────────────────
  window.HB_COUPON = {
    showRedeemModal: showModal,
    hideRedeemModal: hideModal,
    injectMenuItem: injectMenuItem,
  };

  // Auto-inject menu item when loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMenuItem);
  } else {
    injectMenuItem();
  }

})();
