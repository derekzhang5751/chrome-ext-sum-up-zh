
function apiGetSumup(data, lan) {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('action', 'sumup');
    body.append('text', data);
    body.append('language', lan);
    body.append('type', 'text');
    const token = 'your-token-here';
    // 返回一个promise
    // const apiUrl = 'http://localhost:8080/ai/sum-up/';
    const apiUrl = 'https://ai.mangosteen.one/apiShop/ai/sum-up/';
    return fetch(apiUrl, {
      method: 'POST',
      timeout: 180000,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: body // JSON.stringify(body), // data can be `string` or {object}!
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return { success: false, msg: `HTTP error! status: ${response.status}` };
        }
      })
      .then(data => {
        resolve(data);
      })
      .catch(error => {
        console.log('There was a problem with the fetch operation: ' + error.message);
        reject(error);
      });
  });
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  // console.log('background runtime message', request);
  if (request.method == "apiGetSumup") {
    apiGetSumup(request.data, request.lan).then(data => {
      chrome.tabs.sendMessage( sender.tab.id, { action: 'apiGetSumup', data: data } );
    });
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    // console.log(
    //   `Storage key "${key}" in namespace "${namespace}" changed.`,
    //   `Old value was "${oldValue}", new value is "${newValue}".`
    // );

    // 如果发生了你关心的变化，你可以发送一个消息到content script
    if (namespace === 'sync' && key === 'sumupLanguage') {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // 然后，向这个tab发送一个消息
        chrome.tabs.sendMessage(tabs[0].id, { action: "StorageChanged", key: key, value: newValue });
      });
    }
    if (namespace === 'sync' && key === 'sumupShowStatus') {
      // 首先，获取当前的tab
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // 然后，向这个tab发送一个消息
        chrome.tabs.sendMessage(tabs[0].id, { action: "StorageChanged", key: key, value: newValue });
      });
    }
  }
});
