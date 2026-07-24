(function(){
  var f = function(id){ return document.getElementById(id); };
  var cScript=f("c-script"), cHours=f("c-hours"), cFog=f("c-fog"),
      cDrone=f("c-drone"), cTravel=f("c-travel");
  var MONTAGE_MIN = 200;
  var fromAttr = document.body.getAttribute("data-from");
  var FROM = fromAttr ? fromAttr + " " : "";
  var LOC = document.body.getAttribute("data-loc") || "en";

  function lightRate(){ return document.querySelector('input[name="light"]:checked').value*1; }
  function clampHours(){
    var v = parseInt(cHours.value,10);
    if(isNaN(v)||v<1) v=1;
    if(v>12) v=12;
    cHours.value=v;
    return v;
  }
  function euro(n){ return n.toLocaleString(LOC) + " €"; }

  function recalc(){
    var hours = clampHours();
    var shoot = hours*lightRate();
    var scriptCost = parseInt(cScript.value,10);
    var fogCost    = cFog.checked ? 20 : 0;
    var droneCost  = cDrone.checked ? 50 : 0;
    var travelCost = parseInt(cTravel.value,10);

    f("p-shoot").textContent = euro(shoot);
    f("p-fog").className   = "cprice" + (cFog.checked?" on":"");
    f("p-drone").className = "cprice" + (cDrone.checked?" on":"");

    var total = scriptCost + shoot + fogCost + droneCost + travelCost + MONTAGE_MIN;
    f("c-total").textContent = FROM + euro(total);
  }

  f("h-minus").addEventListener("click",function(){ cHours.value=clampHours()-1; recalc(); });
  f("h-plus").addEventListener("click",function(){ cHours.value=clampHours()+1; recalc(); });
  document.querySelectorAll('input[name="light"]').forEach(function(el){ el.addEventListener("change",recalc); });
  [cScript,cHours,cFog,cDrone,cTravel].forEach(function(el){
    el.addEventListener("change",recalc);
    el.addEventListener("input",recalc);
  });
  recalc();
})();
