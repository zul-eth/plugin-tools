(function () {
  if (document.getElementById('floating-popup')) return;

  let submitCount = 0;
  const MAX_SUBMIT = 25;
  const TIMEOUT_LIMIT = 180000; // 1 menit
  let tokenTimeout;

  function startTokenTimeout() {
    clearTimeout(tokenTimeout);
    tokenTimeout = setTimeout(() => {
      status.textContent = '⏱️ Timeout! Reloading...';
      location.reload();
    }, TIMEOUT_LIMIT);
  }

  function resetCaptcha() {
    status.textContent = '🔄 Resetting captcha...';

    const script = document.createElement('script');
    script.textContent = `
      try {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
          grecaptcha.reset();
        }
      } catch(e) { console.error('grecaptcha.reset() gagal:', e); }
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();

    const captcha = document.querySelector('#g-recaptcha-response');
    if (captcha) captcha.value = '';

    document.querySelectorAll('iframe[src*="recaptcha"]').forEach((iframe) => {
      const src = iframe.src;
      iframe.src = 'about:blank';
      iframe.src = src.split('#')[0] + (src.includes('?') ? '&' : '?') + 'reload=' + Date.now();
    });

    status.textContent = '✅ Captcha reset done';
  }

  async function submitToken(token) {
    if (!token) return;
    status.textContent = '📤 Sending...';

    try {
      const response = await fetch('https://serverfaucet.my.id/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        submitCount++;
        status.textContent = `✅ Sent (${submitCount}/${MAX_SUBMIT})`;
        resetCaptcha();

        // Restart timeout timer karena berhasil dapat token
        startTokenTimeout();

        if (submitCount >= MAX_SUBMIT) {
          status.textContent = '🧹 Clearing data...';

          if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'clearData' }, () => {
              status.textContent = '🔄 Reloading...';
              setTimeout(() => {
                location.reload();
              }, 300);
            });
          } else {
            location.reload();
          }

          submitCount = 0;
        }
      } else {
        status.textContent = `❌ Submit failed: ${response.status}`;
        console.error(await response.text());
      }
    } catch (e) {
      status.textContent = `❌ Network error: ${e.message}`;
    }
  }

  // UI
  const div = document.createElement('div');
  div.id = 'floating-popup';
  div.style.cssText = `
    position: fixed;
    bottom: 60px;
    right: 20px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    z-index: 99999;
    font-family: Arial, sans-serif;
    font-size: 12px;
    width: 220px;
  `;
  div.innerHTML = `<div id="status" style="margin-top:8px; font-size:10px; text-align:center; color:#555;">Auto Mode Active...</div>`;
  document.body.appendChild(div);

  const status = document.getElementById('status');
  let submitting = false;

  // Mulai timeout dari awal
  startTokenTimeout();

  // Interval pengecekan captcha
  setInterval(() => {
    if (submitting) return;
    const captcha = document.querySelector('#g-recaptcha-response');
    if (captcha && captcha.value.trim()) {
      submitting = true;
      submitToken(captcha.value.trim()).finally(() => {
        submitting = false;
      });
    }
  }, 500);
})();