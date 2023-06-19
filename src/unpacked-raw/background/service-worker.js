console.log('background.js running');
async function postData(url, options) {
  // Default options are marked with *
  //method: "GET"
  var method = "POST";
  var response;
  if (options.method=="GET"){
     response = await fetch(url);
  }
 if (options.method=="POST"){
 
  response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: options.headers,
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: options.body, // body data type must match "Content-Type" header
  });
}
 if (options.method=="PUT"){
  response = await fetch(url, {
    method: "PUT", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: options.headers,
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: options.body, // body data type must match "Content-Type" header
  });
}


  var response2 = {};
  response2.data=await response.json();
  //todo not the right logic, reverse origina extension
  response2.ok=response.ok
  //response2.data.token=response2.data.auth_token;
  response2.status=response.status;

  return response2; // parses JSON response into native JavaScript objects
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting === "joplin"){
      postData(request.url,request.options,request.body).then(result => sendResponse(result));
    }
    return true;
     // sendResponse({farewell: "goodbye"});
  }
);