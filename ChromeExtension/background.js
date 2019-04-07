chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.executeScript({
    code: `window.getSelection().toString();`
  }, selection => {
      let url = "http://contractbuddy.herokuapp.com";
    chrome.tabs.create({"url": `javascript:function fakePost(params) {var form = document.createElement("form");  form.setAttribute("method", "post");  form.setAttribute("action", '${url}');  for(var key in params) {      var hiddenField = document.createElement("input");      hiddenField.setAttribute("type", "hidden");      hiddenField.setAttribute("name", key);      hiddenField.setAttribute("value", params[key]);      form.appendChild(hiddenField);  }  document.body.appendChild(form); form.submit();}; fakePost({ originalText: "${selection[0]}" });`})
  })
})

/*
console.log('ye');(function(url, post){
      var form = document.createElement("form")
      form.setAttribute("method", "post")
      form.setAttribute("action", url)
      for(var key in post){
          var hiddenField = document.createElement("input")
          hiddenField.setAttribute("type", "hidden")
          hiddenField.setAttribute("name", key)
          hiddenField.setAttribute("value", post[key])
          form.appendChild(hiddenField)
      }
      document.body.appendChild(form)
      form.submit()
    })('https://contractbuddy.herokuapp.com/', { originalText: window.getSelection().toString() });
*/