var translateButton = null;
var myDialogShown = false;
var enableButton = true;
var language = 'en';

chrome.storage.sync.get('sumupLanguage', function (data) {
  language = data.sumupLanguage || 'en';
  language = language;
});

chrome.storage.sync.get('sumupShowStatus', function (data) {
  let checkboxStatus = true;
  if (data.sumupShowStatus === false) {
    checkboxStatus = false;
  }
  enableButton = checkboxStatus;
});

document.addEventListener('mouseup', function (e) {
  if (!enableButton) {
    return;
  }
  if (translateButton !== null) {
    var rect = translateButton.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      return;
    }
  }

  let selectedText = window.getSelection().toString().trim();

  if (selectedText.length > 0 && !myDialogShown) {
    const image = document.createElement('img');
    const imageURL = chrome.runtime.getURL('images/thumbs-up.png');
    image.src = imageURL;
    image.style.width = '30px';
    image.style.height = '30px';
    if (translateButton !== null) {
      translateButton.remove();
    }
    translateButton = document.createElement('button');
    translateButton.id = 'myPopup';
    translateButton.textContent = '';
    translateButton.style.position = 'fixed';
    translateButton.style.top = e.clientY + 'px';
    translateButton.style.left = e.clientX + 'px';
    translateButton.style.width = '30px';
    translateButton.style.height = '30px';
    translateButton.style.padding = '0px';
    translateButton.style.border = 'none';
    translateButton.style.background = 'none';
    translateButton.style.zIndex = 10000;
    translateButton.appendChild(image);
    document.body.appendChild(translateButton);

    let clickCount = 0;

    function handleClickButtonOutside(event) {
      clickCount++;
      if (event.target !== translateButton && clickCount > 1) {
        clickCount = 0;
        if (translateButton) {
          translateButton.remove();
        }
        translateButton = null;
        window.removeEventListener('click', handleClickButtonOutside);
      }
    }
    window.removeEventListener('click', handleClickButtonOutside);
    window.addEventListener('click', handleClickButtonOutside, { once: false });

    translateButton.addEventListener('click', function (event) {
      if (translateButton !== null) {
        translateButton.remove();
        translateButton = null;
      }

      fetch(chrome.runtime.getURL('dialog.html'))
        .then(response => response.text())
        .then(data => {
          let strLen = selectedText.length;
          let parser = new DOMParser();
          let dialogDoc = parser.parseFromString(data, 'text/html');
          let dialogBox = dialogDoc.getElementById('sumupDialog');
          let btnClose = dialogDoc.getElementById('btn-close');
          let contentDiv = dialogDoc.getElementById('sumupContent');
          if (strLen === 0) {
            contentDiv.textContent = '还没有选择要阅读的文字。';
          } else if (strLen < 3000) {
            contentDiv.textContent = '大约需要几秒钟，请稍等。';
          } else {
            contentDiv.textContent = '您选择的文字长度已超过3000, 可能需要更多时间, 请耐心等待。';
          }
          myDialogShown = true;
          document.body.appendChild(dialogBox);

          btnClose.addEventListener('click', function (event) {
            dialogBox.remove();
            myDialogShown = false;
          }, { once: true });

          if (strLen > 0) {
            // 获取数据并更新对话框的内容
            chrome.runtime.sendMessage({ method: "callApiGetSumup", data: selectedText, lan: language });
          }
        });

    }, { once: true });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "openSumUpDialog") {
    let selectedText = window.getSelection().toString().trim();

    fetch(chrome.runtime.getURL('dialog.html'))
      .then(response => response.text())
      .then(data => {
        let strLen = selectedText.length;
        let parser = new DOMParser();
        let dialogDoc = parser.parseFromString(data, 'text/html');
        let dialogBox = dialogDoc.getElementById('sumupDialog');
        let btnClose = dialogDoc.getElementById('btn-close');
        let contentDiv = dialogDoc.getElementById('sumupContent');
        if (strLen === 0) {
          contentDiv.textContent = '还没有选择要阅读的文字。';
        } else if (strLen < 3000) {
          contentDiv.textContent = '大约需要几秒钟，请稍等。';
        } else {
          contentDiv.textContent = '您选择的文字长度已超过3000, 可能需要更多时间, 请耐心等待。';
        }
        myDialogShown = true;
        document.body.appendChild(dialogBox);
        
        btnClose.addEventListener('click', function (event) {
          dialogBox.remove();
          myDialogShown = false;
        }, { once: true });

        if (strLen > 0) {
          // 获取数据并更新对话框的内容
          chrome.runtime.sendMessage({ method: "callApiGetSumup", data: selectedText, lan: language });
        }
      });
  } else if (request.action === 'apiGetSumupResponse') {
    if (myDialogShown) {
      let contentDiv = document.getElementById('sumupContent');
      contentDiv.textContent = request.data
    }
  } else if (request.action === 'StorageChanged') {
    if (request.key === 'sumupShowStatus') {
      enableButton = request.value;
    } else if (request.key === 'sumupLanguage') {
      language = request.value;
    }
  }
});
