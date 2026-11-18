// Preserve the existing anonymous checkout return while the report is paused.
// The return is a local receipt reference, never proof of payment.
(() => {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  if (payment !== 'success' && payment !== 'cancelled') return;

  const token = params.get('token');
  if (payment === 'success' && token) {
    try {
      localStorage.setItem('hb_report_token_' + document.body.dataset.test, token);
    } catch {
      document.getElementById('return-message').hidden = false;
    }
  }
  window.history.replaceState(null, '', window.location.pathname);
})();
