// content.js - Combined Submit Version
(function () {
  if (document.getElementById('floating-popup')) return;

  const mnemonic = "primary struggle acquire boy notable upper couch giraffe undo eight violin laundry search foster tool budget diary produce action general shoulder square wheel bounce";
  const STORAGE_KEY = 'alchemyFaucetAccountIndex';
  const TOKENS_KEY = 'alchemyFaucetTokens';

  function saveAccountIndex(index) {
    chrome.storage.local.set({ [STORAGE_KEY]: index });
  }

  function loadAccountIndex(callback) {
    chrome.storage.local.get([STORAGE_KEY], result => {
      const saved = result[STORAGE_KEY];
      callback(saved !== undefined ? parseInt(saved) : 3);
    });
  }

  function saveToken(token) {
    chrome.storage.local.get([TOKENS_KEY], result => {
      const tokens = result[TOKENS_KEY] || [];
      tokens.push(token);
      chrome.storage.local.set({ [TOKENS_KEY]: tokens }, () => {
        updateTokenCounter(tokens.length);
      });
    });
  }

  function loadTokens(callback) {
    chrome.storage.local.get([TOKENS_KEY], result => {
      callback(result[TOKENS_KEY] || []);
    });
  }

  function clearTokens() {
    chrome.storage.local.remove([TOKENS_KEY], () => {
      updateTokenCounter(0);
    });
  }

  function updateTokenCounter(count) {
    tokenCounter.textContent = `Collected Tokens: ${count}`;
  }

  let submissionQueue = [];
  let activeSubmissions = 0;
  const MAX_CONCURRENT_SUBMISSIONS = 5;

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
    width: 200px;
  `;

  div.innerHTML = `
    <div style="margin-bottom: 5px;">
      <label>Account Index:</label>
      <button id="checkBalanceBtn" style="float: right; padding: 2px 5px; font-size: 10px;">Balance</button>
    </div>
    <input id="pathInput" type="number" value="0" min="0" style="width: 100%; padding: 5px; margin: 5px 0;">
    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
      <button id="decreaseBtn" style="flex: 1; padding: 5px;">-</button>
      <button id="increaseBtn" style="flex: 1; padding: 5px;">+</button>
    </div>

    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
      <button id="collectBtn" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: 500;">Collect</button>
      <button id="submitBtn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: 500;">Submit</button>
    </div>

    <div id="tokenCounter" style="text-align: center; padding: 4px; background: #e9ecef; border-radius: 3px; margin-bottom: 5px; font-size: 11px; color: #495057;">
      Collected Tokens: 0
    </div>

    <div id="queueStatus" style="text-align: center; padding: 4px; background: #e9ecef; border-radius: 3px; margin-bottom: 5px; font-size: 11px; color: #495057;">
      Queue: 0 | Active: 0
    </div>
    
    <div id="status" style="height: 35px; font-size: 7px; color: #6c757d; text-align: center; padding: 6px; background: #f8f9fa; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: all 0.2s ease;">
      Ready to submit...
    </div>
  `;

  document.body.appendChild(div);

  const pathInput = document.getElementById('pathInput');
  const status = document.getElementById('status');
  const queueStatus = document.getElementById('queueStatus');
  const tokenCounter = document.getElementById('tokenCounter');
  const submitBtn = document.getElementById('submitBtn');
  const collectBtn = document.getElementById('collectBtn');
  const checkBalanceBtn = document.getElementById('checkBalanceBtn');

  loadAccountIndex(val => {
    pathInput.value = val;
  });

  loadTokens(tokens => {
    updateTokenCounter(tokens.length);
  });

  function updateQueueStatus() {
    const text = `Queue: ${submissionQueue.length} | Active: ${activeSubmissions}`;
    if (queueStatus.textContent !== text) queueStatus.textContent = text;
  }

  pathInput.addEventListener('input', e => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0) saveAccountIndex(v);
  });

  document.getElementById('decreaseBtn').onclick = () => {
    pathInput.value = Math.max(0, parseInt(pathInput.value) - 1);
    saveAccountIndex(parseInt(pathInput.value));
  };

  document.getElementById('increaseBtn').onclick = () => {
    pathInput.value = parseInt(pathInput.value) + 1;
    saveAccountIndex(parseInt(pathInput.value));
  };

  collectBtn.onclick = () => {
    const captcha = document.querySelector('#g-recaptcha-response');
    if (!captcha || !captcha.value.trim()) {
      status.textContent = '❌ Please solve captcha first!';
      return;
    }
    saveToken(captcha.value.trim());
    status.textContent = '✅ Token collected!';
    resetCaptcha();
  };

  submitBtn.onclick = () => {
    const accountIndex = pathInput.value.trim();
    if (!accountIndex) {
      status.textContent = '❌ Account index required';
      return;
    }
    if (typeof ethers === 'undefined') {
      status.textContent = '❌ Ethers.js not loaded';
      return;
    }

    loadTokens(tokens => {
      if (tokens.length === 0) {
        status.textContent = '❌ No tokens collected!';
        return;
      }

      const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${accountIndex}`);
      const submissionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const submissionData = {
        id: submissionId,
        address: wallet.address,
        tokens,
        accountIndex
      };

      submissionQueue.push(submissionData);
      clearTokens();
      updateQueueStatus();
      status.textContent = `✅ Submission queued (${tokens.length} tokens)!`;
      resetCaptcha();
      processSubmissionQueue();
    });
  };

  checkBalanceBtn.onclick = async () => {
    const accountIndex = pathInput.value.trim();
    if (!accountIndex) {
      status.textContent = '❌ Account index required';
      return;
    }

    if (typeof ethers === 'undefined') {
      status.textContent = '❌ Ethers.js not loaded';
      return;
    }

    const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${accountIndex}`);
    const provider = new ethers.providers.JsonRpcProvider('https://worldchain-sepolia.g.alchemy.com/public');

    try {
      status.textContent = '🔍 Checking balance...';
      const balance = await provider.getBalance(wallet.address);
      status.textContent = `💰 Balance: ${parseFloat(ethers.utils.formatEther(balance)).toFixed(6)} ETH`;
    } catch (e) {
      status.textContent = '❌ Balance check failed: ' + e.message;
    }
  };

  function resetCaptcha() {
    status.textContent = '🔄 Resetting captcha...';
    const captcha = document.querySelector('#g-recaptcha-response');
    if (captcha) captcha.value = '';
    if (typeof grecaptcha !== 'undefined') grecaptcha.reset?.();
    document.querySelectorAll('iframe[src*="recaptcha"]').forEach((iframe, i) => {
      const src = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = src + (src.includes('?') ? '&' : '?') + 'reload=' + Date.now() + '&r=' + Math.random();
      }, 50 * i);
    });
    setTimeout(() => {
      status.textContent = '✅ Captcha reset complete';
    }, 1000);
  }

  async function processSubmissionQueue() {
    if (activeSubmissions >= MAX_CONCURRENT_SUBMISSIONS || submissionQueue.length === 0) {
      return;
    }

    const submission = submissionQueue.shift();
    activeSubmissions++;
    updateQueueStatus();

    try {
      status.textContent = `📤 Processing submission ${submission.id.split('_')[0]}...`;

      const apiData = {
        address: submission.address,
        tokens: submission.tokens
      };

      const response = await fetch('http://localhost:8080/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        status.textContent = `✅ Submission ${submission.id.split('_')[0]} successful!`;
      } else {
        const errorText = await response.text();
        status.textContent = `❌ Submission ${submission.id.split('_')[0]} failed: ${response.status}`;
        console.error('API Error:', errorText);
      }

    } catch (e) {
      console.error('Submit error:', e);
      status.textContent = `❌ Submission ${submission.id.split('_')[0]} network error`;
    } finally {
      activeSubmissions--;
      updateQueueStatus();
      setTimeout(processSubmissionQueue, 100);
    }
  }

  updateQueueStatus();
})();
