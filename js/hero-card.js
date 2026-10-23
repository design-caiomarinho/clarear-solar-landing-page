// Card da hero: entrada em sequência (card, tag, título/porcentagem, texto, gráfico).
// Ordem do gráfico: fundo (fade) > "Antes"/"Depois" > barras sobem > valores.
// Os estados iniciais escondidos estão em styles.css ([data-hero]); aqui só roda a sequência.
(function () {
  var card = document.querySelector(".hero-card");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!card || !window.Motion || reduceMotion.matches) { document.documentElement.classList.add("motion-off"); return; }

  var EASE = [0.46, 0.03, 0.51, 0.95]; // curva padrão do site
  var COUNT_EASE = [0.22, 1, 0.36, 1]; // contadores: rápidos no início e desacelerando bastante perto do valor final
  var DURATION = 0.9;
  var DISTANCE = 60;

  var percent = card.querySelector('[data-hero="percent"]');
  var percentFinal = percent.textContent; // "89%"
  var percentTarget = parseInt(percentFinal, 10);
  percent.textContent = "100%";

  // t = segundos desde o início da sequência
  function part(selector) { return Array.prototype.slice.call(card.querySelectorAll(selector)); }
  var tag = part(".hero-card-tag");
  var stat = part(".hero-card-stat");
  var text = part(".hero-card-content > p");
  var bars = part(".hero-card-bar");
  var labels = part(".hero-card-label");
  var rises = part('[data-hero="rise"]');
  var values = part('[data-hero="rise"] > [data-hero="reveal"]');

  function done(el) {
    el.classList.add("motion-done");
    setTimeout(function () { // a biblioteca grava o estado final inline depois do fim
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    }, 0);
  }

  function play(elements, keyframes, start, step) {
    elements.forEach(function (el, i) {
      window.Motion.animate(el, keyframes, { duration: DURATION, delay: start + i * (step || 0), ease: EASE })
        .finished.then(function () { done(el); });
    });
  }

  var revealFrames = { opacity: [0, 1], transform: ["translateY(" + DISTANCE + "px)", "translateY(0px)"] };

  var mobile = window.matchMedia("(max-width: 640px)");

  function run() {
    // No mobile o fundo verde do card já aparece sem reveal; o resto segue a sequência, sem a espera do card
    var t = mobile.matches ? 0.35 : 0;
    if (mobile.matches) done(card); else play([card], revealFrames, 0); // 1. card inteiro

    play(tag, revealFrames, 0.35 - t);   // 2. tag
    play(stat, revealFrames, 0.5 - t);   // 3. ícone + porcentagem
    play(text, revealFrames, 0.65 - t);  // 4. texto

    // 100% > 89%, começando quando a porcentagem já apareceu
    window.Motion.animate(100, percentTarget, {
      duration: 1.1,
      delay: 0.8 - t,
      ease: COUNT_EASE,
      onUpdate: function (value) { percent.textContent = Math.round(value) + "%"; },
      onComplete: function () { percent.textContent = percentFinal; }
    });

    play(bars, { opacity: [0, 1] }, 0.95 - t, 0);          // 5. fundo do gráfico (fade)
    play(labels, revealFrames, 1.25 - t, 0.12);            // 6. Antes / Depois
    play(rises, { transform: ["translateY(100%)", "translateY(0%)"] }, 1.75 - t, 0.15); // 7. barras sobem
    play(values, revealFrames, 2.0 - t, 0.15);             // 8. valores, logo atrás das barras (mesmo intervalo entre os dois)
  }

  // Gatilho. Desktop e tablet: o primeiro scroll da página.
  // Mobile: o scroll em que a parte de baixo da imagem da hero já aparece por completo.
  var image = card.closest(".hero-image");
  var MIN_SCROLL = 4; // px
  var started = false;

  function start() {
    started = true;
    window.removeEventListener("scroll", check);
    window.removeEventListener("resize", check);
    window.removeEventListener("wheel", intent);
    window.removeEventListener("touchmove", check);
    run();
  }

  function check() {
    if (started) return;
    if (window.scrollY < MIN_SCROLL) return;
    if (mobile.matches && image.getBoundingClientRect().bottom > window.innerHeight) return;
    start();
  }

  // Desktop: a rolagem da roda é suavizada (main.js) e o scroll demora a se mexer; o gatilho
  // vem da própria intenção (roda para baixo), então a animação começa no mesmo instante.
  function intent(event) {
    if (started || mobile.matches || event.deltaY <= 0 || event.ctrlKey) return;
    start();
  }

  window.addEventListener("wheel", intent, { passive: true });
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  check(); // página recarregada já rolada
})();
