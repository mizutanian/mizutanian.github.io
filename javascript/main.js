function submitKeyword(){
  keywords = document.formKeyword.keyword.value;
  keywords_arr = keywords.split(/\s/);
  console.log(keywords_arr);
  readHtml("http://www.yahoo.co.jp/");
};

function readHtml(url) {
  $.ajax({
    type: 'GET',
    url: url,
    success: function(data) {
      $('#content').append(data.responseText);
    },
    error: function(xhr, status, err) {
      alert('HTML読み出しで問題がありました:' + url);
    }
  });
}