import { notExist } from "./utils";

class MessageService {
  async sendToContent(tabId, message) {
    console.log("🚀 ~ MessageService ~ sendToContent ~ tabId:", tabId);
    console.log("🚀 ~ MessageService ~ sendToContent ~ message:", message);
    return chrome.tabs.sendMessage(tabId, message);
  }

  async sendToBackground(message) {
    console.log("🚀 ~ MessageService ~ sendToBackground ~ message:", message);
    return chrome.runtime.sendMessage(message);
  }

  addListener(func, errorHandler) {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      console.log(
        "🚀 ~ MessageService ~ chrome.runtime.onMessage.addListener ~ message:",
        message
      );
      if (notExist(message?.code)) {
        return;
      }

      try {
        func(message);
      } catch (error) {
        errorHandler && errorHandler(error);
      }
    });
  }
}
export const messageService = new MessageService();

export const MessageCode = {
  CreateNewTab: "bandPlay-CreateNewTab",
  NextTrack: "bandPlay-NextTrack",
  UrlChanged: "bandPlay-UrlChanged"
};
