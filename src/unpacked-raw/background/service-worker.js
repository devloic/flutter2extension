console.log('background.js running');
async function postData(url, options) {
 

  var response2 = {};
  

  return response2; // parses JSON response into native JavaScript objects
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting === "example"){
      postData(request.url,request.options,request.body).then(result => sendResponse(result));
    }
    return true;
     // sendResponse({farewell: "goodbye"});
  }
);