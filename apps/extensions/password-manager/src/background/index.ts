// Background service worker for password manager extension

chrome.runtime.onInstalled.addListener(() => {
  console.log("Password Manager extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  return true;
});
