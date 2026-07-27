/* Универсальный калькулятор. Работает для любого блока .calc: читает
   параметры из data-атрибутов, ничего не зашито в код. Один движок на все ниши. */
(function () {
  document.querySelectorAll('.calc').forEach(function (calc) {
    var fromAttr = calc.getAttribute('data-from');
    var FROM = fromAttr ? fromAttr + ' ' : '';
    var LOC = calc.getAttribute('data-locale') || 'en';
    function euro(n) { return n.toLocaleString(LOC) + ' €'; }

    var hoursInput = calc.querySelector('[data-role="hours"]');
    var maxHours = hoursInput ? (parseInt(hoursInput.getAttribute('max'), 10) || 12) : 12;
    var minHours = hoursInput ? (parseInt(hoursInput.getAttribute('min'), 10) || 1) : 1;

    function clampHours() {
      var v = parseInt(hoursInput.value, 10);
      if (isNaN(v) || v < minHours) v = minHours;
      if (v > maxHours) v = maxHours;
      hoursInput.value = v;
      return v;
    }
    function lightRate() {
      var r = calc.querySelector('input[data-role="light"]:checked');
      return r ? (parseFloat(r.value) || 0) : 0;
    }
    function recalc() {
      var total = 0;
      if (hoursInput) {
        var shoot = clampHours() * lightRate();
        var sp = calc.querySelector('[data-role="shoot"]');
        if (sp) sp.textContent = euro(shoot);
        total += shoot;
      }
      calc.querySelectorAll('select[data-role="select"]').forEach(function (s) {
        total += parseFloat(s.value) || 0;
      });
      calc.querySelectorAll('input[data-role="toggle"]').forEach(function (t) {
        var on = t.checked;
        if (on) total += parseFloat(t.getAttribute('data-price')) || 0;
        var span = calc.querySelector('[data-price-for="' + t.getAttribute('data-key') + '"]');
        if (span) span.className = 'cprice' + (on ? ' on' : '');
      });
      var totalEl = calc.querySelector('[data-role="total"]');
      if (totalEl) totalEl.textContent = FROM + euro(total);
    }

    var minus = calc.querySelector('[data-role="h-minus"]');
    var plus = calc.querySelector('[data-role="h-plus"]');
    if (minus && hoursInput) minus.addEventListener('click', function () { hoursInput.value = clampHours() - 1; recalc(); });
    if (plus && hoursInput) plus.addEventListener('click', function () { hoursInput.value = clampHours() + 1; recalc(); });
    calc.querySelectorAll('input, select').forEach(function (el) {
      el.addEventListener('change', recalc);
      el.addEventListener('input', recalc);
    });
    recalc();
  });
})();
