// Motion do site (biblioteca Motion em js/vendor/motion.js).
// Entrada ao rolar: elementos com [data-motion] começam invisíveis, 60px abaixo, e sobem com fade
// quando entram na tela. [data-motion-delay="0.1"] atrasa a entrada (em segundos), para criar cascata.
// A curva é a padrão do site (a mesma de --button-ease).
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-motion]"));
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var DISTANCE = 60;       // px abaixo da posição final
  var DURATION = 0.9;      // segundos
  var EASE = [0.46, 0.03, 0.51, 0.95];

  // Sem a biblioteca, mostra tudo parado
  if (!window.Motion || !items.length) { root.classList.add("motion-off"); return; }

  function reveal(el) {
    if (el._revealed) return;
    el._revealed = true;

    if (reduceMotion.matches) { el.classList.add("motion-done"); return; }

    var animation = window.Motion.animate(
      el,
      { opacity: [0, 1], transform: ["translateY(" + DISTANCE + "px)", "translateY(0px)"] },
      { duration: DURATION, delay: parseFloat(el.dataset.motionDelay) || 0, ease: EASE }
    );

    // Ao terminar, devolve o elemento ao CSS normal (sem transform fixo, para não travar hovers)
    animation.finished.then(function () {
      el.classList.add("motion-done");
      // a biblioteca grava o estado final inline depois do fim; limpa no ciclo seguinte
      setTimeout(function () {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      }, 0);
    });
  }

  items.forEach(function (el) {
    // margem negativa embaixo: o elemento só entra quando já subiu um pouco na tela
    window.Motion.inView(el, function () { reveal(el); }, { margin: "0px 0px -12% 0px" });
  });
})();
