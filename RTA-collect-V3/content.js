(function () {
  const isRecaptchaFrame = window.location.hostname.includes('google.com');

  // === [1] Kode yang berjalan di iframe ===
  if (isRecaptchaFrame) {
    window.addEventListener('message', (event) => {
      const { type } = event.data || {};

      if (type === 'START_RECAPTCHA') {
        const checkbox = document.getElementById('recaptcha-anchor');
        if (checkbox) {
          checkbox.click();
          console.log('[iframe] ✅ Checkbox diklik otomatis');
        } else {
          console.warn('[iframe] ❌ Checkbox tidak ditemukan!');
        }
      }

      if (type === 'CLICK_HELP_BUTTON') {
        console.log('[iframe] 🔎 Mencari tombol solver di shadow root…');

        const maxWait = 10000;
        let waited = 0;

        const interval = setInterval(() => {
          const helpHolder = document.querySelector('.help-button-holder');

          if (helpHolder?.shadowRoot) {
            const solverButton = helpHolder.shadowRoot.querySelector('#solver-button');
            if (solverButton && !solverButton.disabled) {
              console.log('[iframe] ✅ Tombol solver ditemukan, klik otomatis…');

              // ✅ Panggil handler langsung jika tersedia
              if (typeof solveChallenge === 'function') {
                console.log('[iframe] 🔧 Memanggil solveChallenge() langsung...');
                solveChallenge();
              } 
              // ❇️ Fallback: langsung .click()
              else {
                solverButton.click();
                console.log('[iframe] ✅ solver-button diklik via .click()');
              }

              clearInterval(interval);
            } else {
              console.log('[iframe] ⚠️ Tombol solver belum siap atau disabled');
            }
          } else {
            console.log('[iframe] ⏳ Menunggu shadowRoot…');
          }

          waited += 500;
          if (waited >= maxWait) {
            console.warn('[iframe] ⌛ Timeout: solver-button tidak ditemukan.');
            clearInterval(interval);
          }
        }, 500);
      }
    });

    return;
  }

  // === [2] Kode yang berjalan di halaman utama ===
  const button = document.createElement('button');
  button.innerText = '🤖 Jalankan reCAPTCHA Otomatis';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '9999',
    padding: '12px 18px',
    backgroundColor: '#34a853',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  });

  document.body.appendChild(button);

  button.addEventListener('click', () => {
    const iframes = document.getElementsByTagName('iframe');

    console.log('[popup] 🤖 Klik checkbox reCAPTCHA…');

    let checkboxFrameFound = false;
    let bframeFound = false;

    // Kirim START_RECAPTCHA ke iframe anchor
    for (let frame of iframes) {
      try {
        const src = frame.src || '';
        if (src.includes('/recaptcha/api2/anchor')) {
          frame.contentWindow?.postMessage({ type: 'START_RECAPTCHA' }, '*');
          checkboxFrameFound = true;
        }
      } catch (e) {
        console.warn('[popup] ❌ Gagal kirim ke iframe checkbox:', e);
      }
    }
    if (!checkboxFrameFound) {
      console.warn('[popup] ⚠️ Tidak menemukan iframe checkbox.');
    }

    // Tunggu sejenak, lalu kirim CLICK_HELP_BUTTON ke iframe tantangan
    const delayMs = 3000;
    console.log(`[popup] ⏳ Menunggu ${delayMs/1000} detik untuk klik solver…`);

    setTimeout(() => {
      for (let frame of iframes) {
        try {
          const src = frame.src || '';
          if (src.includes('/recaptcha/api2/bframe')) {
            frame.contentWindow?.postMessage({ type: 'CLICK_HELP_BUTTON' }, '*');
            bframeFound = true;
            console.log('[popup] 🧠 Perintah klik solver dikirim');
          }
        } catch (e) {
          console.warn('[popup] ❌ Gagal kirim ke iframe tantangan:', e);
        }
      }
      if (!bframeFound) {
        console.warn('[popup] ⚠️ Tidak menemukan iframe tantangan (bframe).');
      }
    }, delayMs);
  });
})();
