// 在页面加载时获取保存的checkbox状态
window.onload = function () {
  chrome.storage.sync.get('sumupShowStatus', function (data) {
    let checkboxStatus = true;
    if (data.sumupShowStatus === false) {
      checkboxStatus = false;
    }
    document.getElementById('checkbox-show-btn').checked = checkboxStatus;
  });
  chrome.storage.sync.get('sumupLanguage', function(data) {
    let language = data.sumupLanguage || 'en';
    document.getElementById('language').value = language;
  });
}

document.getElementById('btn-show').addEventListener('click', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "openSumUpDialog" });
    window.close();
  });
});

// 监听checkbox状态改变
document.getElementById('checkbox-show-btn').addEventListener('change', function () {
  var checkboxStatus = this.checked;
  // 将新的状态保存到chrome.storage
  chrome.storage.sync.set({ sumupShowStatus: checkboxStatus }, function () {
    console.log('Checkbox status is set to ' + checkboxStatus);
  });
});

// 监听select状态改变
document.getElementById('language').addEventListener('change', function() {
  var language = this.value;
  // 将新的状态保存到chrome.storage
  chrome.storage.sync.set({sumupLanguage: language}, function() {
    console.log('Select language is set to ' + language);
  });
});
