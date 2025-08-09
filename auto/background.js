chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clearData') {
    chrome.browsingData.remove({
      since: 0
    }, {
      cookies: true,
      history: true,
      cache: true
    }, () => {
      sendResponse({ status: 'cleared' });
    });
    return true; // penting agar async sendResponse bisa dipanggil
  }
});