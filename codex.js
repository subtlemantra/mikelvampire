// Turns <a class="pg" data-p="119"></a> into a link to the rulebook in Google Drive.
// The PDF numbers its pages 2 higher than the printed page numbers.
(function () {
  var DRIVE = "https://drive.google.com/file/d/1vYQh5XoaK_SPEAbOwyQhH92eyqDw0E03/view";
  var OFFSET = 2;
  document.querySelectorAll("a.pg[data-p]").forEach(function (a) {
    var p = parseInt(a.getAttribute("data-p"), 10);
    var pdf = p + OFFSET;
    a.href = DRIVE + "#page=" + pdf;
    a.target = "_blank";
    a.rel = "noopener";
    if (!a.textContent.trim()) a.textContent = "p. " + p;
    a.title = "Open the Core Rulebook — printed page " + p + " (PDF page " + pdf + ")";
  });
})();
