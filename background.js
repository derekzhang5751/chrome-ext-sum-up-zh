// const apiUrlBase = 'http://192.168.0.10:8080';
const apiUrlBase = 'https://ai.mangosteen.one/apiShop';

// Description: background script
function apiGetSumupV2(operation, data, lan, token, url, sender) {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('action', operation);
    body.append('text', data);
    body.append('url', url);
    body.append('language', lan);
    body.append('type', 'text');
    // 返回一个promise
    const apiUrl = apiUrlBase + '/mylib/sum-up-create/';
    return fetch(apiUrl, {
      method: 'POST',
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
        if (data.success) {
          // Save token to chrome storage
          chrome.storage.local.set({ sumupToken: data.reply.token }, function () {
            // console.log('sumupToken is set to ' + data.reply.token);
          });
          // begin to receive data
          apiGetSumupStream(data.reply.sessionId, data.reply.token, sender);
          resolve(data);
        } else {
          // reject(data);
          console.log('apiGetSumupV2 something wrong');
        }
      })
      .catch(error => {
        console.log('There was a problem with the fetch operation: ' + error.message);
        reject(error);
      });
  });
}

function apiGetSumupStream(sessionId, token, sender) {
  let message = '';
  console.log('apiGetSumupV2', apiUrlBase)
  const apiUrl = apiUrlBase + '/mylib/sum-up-stream/';
  var source = new EventSource(apiUrl + '?token=' + token + '&sessionId=' + sessionId);

  source.addEventListener('message', function (event) {
    // console.log('Message Length:', event.data.length);
    if (event.data.length > 0) {
      message += event.data;
    } else {
      message += '\n';
    }
    chrome.tabs.sendMessage(sender.tab.id, { action: 'apiGetSumupResponse', data: message });
  });

  source.addEventListener('end', function (event) {
    console.log('End:', event.data);
    source.close();
    chrome.tabs.sendMessage(sender.tab.id, { action: 'apiGetSumupResponseEnd', data: event.data });
  });

  source.addEventListener('error', function (event) {
    chrome.tabs.sendMessage(sender.tab.id, { action: 'apiGetSumupResponse', data: event.data });
    console.log('An error occurred:', event.data);
    source.close();
  });
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  // console.log('background runtime message', request);
  if (request.method == "callApiGetSumup") {
    apiGetSumupV2(request.operation, request.data, request.lan, request.token, request.url, sender);
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
    if (namespace === 'local' && key === 'sumupToken') {
      // 首先，获取当前的tab
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // 然后，向这个tab发送一个消息
        chrome.tabs.sendMessage(tabs[0].id, { action: "StorageChanged", key: key, value: newValue });
      });
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "mangosteenTranslateContextMenu",
    title: "翻译选中的内容",
    contexts: ["selection"] // You can specify when the menu appears
  });

  chrome.contextMenus.create({
    id: "mangosteenSummarizeContextMenu",
    title: "总结提炼选中的内容",
    contexts: ["selection"] // You can specify when the menu appears
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "mangosteenTranslateContextMenu":
      // Translate the selected text
      chrome.tabs.sendMessage(tab.id, { action: "openSumUpDialog", operation: "translate" });
      break;
    case "mangosteenSummarizeContextMenu":
      // Summarize the selected text
      chrome.tabs.sendMessage(tab.id, { action: "openSumUpDialog", operation: "summarize" });
      break;
  }
});
