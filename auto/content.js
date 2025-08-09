(function () {
  if (document.getElementById('floating-popup')) return;

  const TIMEOUT_LIMIT = 120000;
  let tokenTimeout;
  let submitting = false;

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
    status.textContent = '📤 Sending token...';

    try {
      const postResp = await fetch('https://serverfaucet.my.id/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!postResp.ok) {
        status.textContent = `❌ Gagal kirim token: ${postResp.status}`;
        console.error(await postResp.text());
        return;
      }

      status.textContent = '⏳ Menunggu hasil...';

      // Cek hasil setiap 1 detik
      const maxTries = 60; // 60 detik max
      for (let attempt = 0; attempt < maxTries; attempt++) {
        const resultResp = await fetch(`https://serverfaucet.my.id/api/token/result/${token}`);
        const resultData = await resultResp.json();

        if (resultData.success && resultData.result !== null) {
          const result = resultData.result;
          if (result === true) {
            status.textContent = '✅ Token valid. Melanjutkan...';
            resetCaptcha();
            startTokenTimeout(); // restart timeout
          } else {
            status.textContent = '❌ Token tidak valid. Reloading...';
            clearDataAndReload();
          }
          return;
        }

        await new Promise((res) => setTimeout(res, 1000)); // tunggu 1 detik
      }

      status.textContent = '⏰ Timeout menunggu hasil. Reloading...';
      clearDataAndReload();

    } catch (e) {
      status.textContent = `❌ Network error: ${e.message}`;
      console.error(e);
    }
  }

  function clearDataAndReload() {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'clearData' }, () => {
        status.textContent = '🔄 Reloading...';
        setTimeout(() => location.reload(), 500);
      });
    } else {
      location.reload();
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