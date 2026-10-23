// Contagem de porcentagem ao entrar na tela: [data-count-from="100"] conta de 100% até o valor do texto.
// [data-count-delay] (segundos) espera antes de começar, para acompanhar o reveal do bloco.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-count-from]"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!items.length || !window.Motion || reduceMotion.matches) return;

  var EASE = [0.22, 1, 0.36, 1]; // rápida no início e desacelera bastante perto do valor final
  var DURATION = 1.1;

  items.forEach(function (el) {
    var final = el.textContent;                 // ex.: "80%"
    var suffix = final.replace(/[\d.,\s]/g, ""); // "%"
    var from = parseFloat(el.dataset.countFrom);
    var to = parseFloat(final.replace(",", "."));
    if (isNaN(from) || isNaN(to)) return;

    // Trava a largura do número no tamanho do valor final, para o card não variar durante a contagem.
    // Alinhado à direita: os dígitos a mais ("100%") sobram para a esquerda, sobre o padding do bloco.
    el.style.width = el.getBoundingClientRect().width + "px";
    el.style.flexShrink = "0";
    el.style.display = "flex";
    el.style.justifyContent = "flex-end";
    el.style.whiteSpace = "nowrap";

    el.textContent = from + suffix; // começa em 100%

    function release() {
      ["width", "flexShrink", "display", "justifyContent", "whiteSpace"].forEach(function (p) { el.style.removeProperty(p.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); })); });
    }

    var started = false;
    window.Motion.inView(el, function () {
      if (started) return;
      started = true;
      window.Motion.animate(from, to, {
        duration: DURATION,
        delay: parseFloat(el.dataset.countDelay) || 0,
        ease: EASE,
        onUpdate: function (value) { el.textContent = Math.round(value) + suffix; },
        onComplete: function () { el.textContent = final; release(); }
      });
    }, { margin: "0px 0px -12% 0px" });
  });
})();
