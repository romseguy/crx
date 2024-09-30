import { messageService, MessageCode } from "./MessageService";

messageService.addListener((message) => {
  console.log("🚀 ~ messageService.addListener ~ message:", message);
  if (message?.code === MessageCode.CreateNewTab) {
    chrome.tabs
      .create({ url: String(message.data), active: false })
      .catch((e) => {
        console.error(e);
      });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  console.log("🚀 ~ chrome.tabs.onUpdated");
  console.log("🚀 ~ chrome.tabs.onUpdated ~ tabId:", tabId);
  console.log("🚀 ~ chrome.tabs.onUpdated ~ changeInfo:", changeInfo);
  //messageService.sendToContent(tabId, { code: MessageCode.UrlChanged });
});
