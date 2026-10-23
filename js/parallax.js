// Parallax: a imagem dentro de [data-parallax] desliza mais devagar que a página.
// O valor do atributo é a intensidade (fração da altura da moldura; padrão 0.12).
// A rolagem já é suavizada em main.js, então o deslocamento acompanha o scroll direto.
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!frames.length) return;

  var ticking = false;

  function update() {
    ticking = false;
    var viewport = window.innerHeight;

    frames.forEach(function (frame) {
      var image = frame.firstElementChild;
      if (!image) return;

      if (reduceMotion.matches) {
        image.style.removeProperty("--parallax-y");
        image.style.removeProperty("--parallax-scale");
        return;
      }

      var rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) return; // fora da tela

      var intensity = parseFloat(frame.dataset.parallax) || 0.12;
      var shift = rect.height * intensity; // deslocamento máximo para cada lado
      // -1 quando a moldura entra por baixo, 0 no centro da tela, 1 quando sai por cima
      var progress = ((rect.top + rect.height / 2) - viewport / 2) / (viewport / 2 + rect.height / 2);
      progress = Math.max(-1, Math.min(1, progress));

      image.style.setProperty("--parallax-y", (-progress * shift).toFixed(2) + "px");
      image.style.setProperty("--parallax-scale", (1 + 2 * intensity).toFixed(4)); // cobre o deslocamento sem mostrar as bordas
    });
  }

  function request() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  reduceMotion.addEventListener("change", request);
  update();
})();
