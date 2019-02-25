function submitKeyword(){
  keywords = document.formKeyword.keyword.value;
  keywords_arr = keywords.split(/\s/);
  console.log(keywords_arr);
  readHtml("http://www.yahoo.co.jp/");
};

function readHtml(url) {
  $.ajax({  
      url: url,
      type: 'GET',
      success: function(data) {
          content = $($(data.responseText).text());
          $('body').append(content);
      },
      error: function(xhr, status, err) {
        alert('HTML読み出しで問題がありました:' + url);
      }
  });
}

function validateContent(){
  content = document.getElementsByName("mail_content")[0].value;
  arr = content.split(/\r\n|\r|\n/);
  good = true;
  for (i = 0; i < arr.length; i++) {
    if (arr[i].indexOf("http") != -1){
      num_question = arr[i].split("?").length - 1;
      if (num_question > 1){
        good = false;
        alert("1つのURLに?が2つ以上ありませんか？\n該当URL:"+arr[i]);
      }
    };
  }
  if(good == true){
    alert("URLに?が正常に設置されています");
  }
};
