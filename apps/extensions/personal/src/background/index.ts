// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Chrome extension installed");
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GREETING") {
    console.log("Received greeting:", message.data);
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});
