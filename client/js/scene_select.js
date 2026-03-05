
// vykreslování tabulky, připojování na pozice a tak...
// budou potřeba i nějaká styly, založit si pro to i speciální .css ?
// nějaký hovna na tlačítka a jiný sračky pro testování



$(function () {

  $("#sc_select_btn-ready").click(function (event) {
    alert("emit READY")
  });

  $("#sc_select_btn-start").click(function (event) {
    alert("emit start check")
  });

  $("#sc_select_btn_leve").click(function (event) {
    alert("emit leve to mm")
  });


})
