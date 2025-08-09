(function () {
  const isRecaptchaFrame = window.location.hostname.includes('google.com');

  // === 📦 JALANKAN DI IFRAME ===
  if (isRecaptchaFrame) {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'START_RECAPTCHA') {
        const checkbox = document.getElementById('recaptcha-anchor');
        if (checkbox) {
          checkbox.click();
          console.log('[iframe] ✅ Checkbox diklik otomatis');
        } else {
          console.warn('[iframe] ❌ Checkbox tidak ditemukan!');
        }
      }
    });
    return; // Jangan jalankan kode halaman utama
  }

  // === 🌐 JALANKAN DI HALAMAN UTAMA ===
  function waitForToken(timeout = 120000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        const token = document.querySelector('#g-recaptcha-response')?.value?.trim();
        if (token) {
          clearInterval(check);
          resolve(token);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          reject('⏰ Token tidak ditemukan dalam 2 menit.');
        }
      }, 1000);
    });
  }

  async function handleAutoSubmit() {
    const statusBox = document.getElementById('status');
    const pathInput = document.getElementById('pathInput');
    const collectBtn = document.getElementById('collectBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (!pathInput || !collectBtn || !submitBtn || !statusBox) {
      console.warn('❌ Beberapa elemen UI tidak ditemukan.');
      return;
    }

    const iframe = document.querySelector('iframe[src*="recaptcha"]');
    if (iframe) {
      iframe.contentWindow.postMessage({ type: 'START_RECAPTCHA' }, '*');
      iframe.scrollIntoView({ behavior: 'smooth', block: 'center' });
      iframe.focus();
      statusBox.textContent = '📤 Mengirim perintah ke reCAPTCHA iframe...';
    } else {
      statusBox.textContent = '❌ Iframe reCAPTCHA tidak ditemukan!';
      return;
    }

    statusBox.textContent = '⏳ Menunggu token... Selesaikan CAPTCHA secara manual.';
    try {
      const token = await waitForToken();
      statusBox.textContent = '🧩 Token ditemukan, memproses...';

      const currentIndex = parseInt(pathInput.value || '0', 10);

      if (typeof collectBtn.onclick === 'function') collectBtn.onclick();
      else collectBtn.click();

      await new Promise((r) => setTimeout(r, 1000));

      if (typeof submitBtn.onclick === 'function') submitBtn.onclick();
      else submitBtn.click();

      const nextIndex = currentIndex + 1;
      pathInput.value = nextIndex;
      chrome.storage.local.set({ alchemyFaucetAccountIndex: nextIndex });

      statusBox.textContent = `✅ Selesai. Index sekarang: ${nextIndex}`;
    } catch (err) {
      statusBox.textContent = `❌ ${err}`;
    }
  }

  function createAutoSubmitButton() {
    const popup = document.getElementById('floating-popup');
    if (!popup || document.getElementById('autoSubmitBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'autoSubmitBtn';
    btn.textContent = 'Auto Submit';
    btn.style.cssText = `
      padding: 8px;
      width: 100%;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 3px;
      margin-top: 5px;
      cursor: pointer;
      font-weight: 500;
    `;

    btn.onclick = handleAutoSubmit;
    popup.appendChild(btn);
  }

  document.addEventListener('DOMContentLoaded', createAutoSubmitButton);
  window.addEventListener('load', createAutoSubmitButton);
})();
