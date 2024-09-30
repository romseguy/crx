import { MessageCode, messageService } from "./MessageService";
//import {serviceWorker}  from "./my-content-script"

import "./style.css";

document.getElementById("button").addEventListener("click", () => {
  console.log("CLICK!");

  // const element = document.createElement('span');
  // element.innerText = 'You clicked me!!:)';
  // document.body.appendChild(element)

  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  //serviceWorker.pageServices[0].playNextTrack(true)

  // chrome.tabs
  // .query({ active: true, currentWindow: true })
  // .then(async (tabs) => {
  //   console.log("🚀 ~ .then ~ tabs:", tabs[0])
  //   // await messageService.sendToContent(tabs[0].id, {
  //   //   code: MessageCode.ShowGuide,
  //   // });
  // });

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true
    },
    async (tabs) => {
      await messageService.sendToContent(tabs[0].id, {
        code: MessageCode.NextTrack
      });
    }
  );

  //   // ...and send a request for the DOM info...
  //   chrome.tabs.sendMessage(
  //       tabs[0].id,
  //       {from: 'popup', subject: 'DOMInfo'},
  //       // ...also specifying a callback to be called
  //       //    from the receiving end (content script).
  //       setDOMInfo);
  // });
});
