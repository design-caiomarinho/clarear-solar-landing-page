// Sempre começa no topo (sem restaurar a rolagem de antes do recarregamento)
window.scrollTo({ top: 0, behavior: "instant" });

// Logo: recarrega a página (que volta ao início)
(function () {
  var logo = document.querySelector(".navbar-logo");
  if (!logo) return;
  logo.addEventListener("click", function (event) {
    event.preventDefault();
    window.location.reload();
  });
})();

// Navbar: tema (dark/light) conforme a seção e esconder/mostrar conforme o scroll.
(function () {
  var navbar = document.querySelector(".navbar");
  var footer = document.querySelector(".footer");
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-theme]"));
  if (!navbar || !sections.length) return;

  var SCROLL_THRESHOLD = 8; // ignora movimentos pequenos de scroll
  var observer = null;
  var theme = "dark";
  var lastY = window.scrollY;
  var hiddenByScroll = false;
  var ticking = false;
  var compact = window.matchMedia("(max-width: 1210px)"); // tablet e mobile: navbar sempre visível
  var anchorScrolling = false;
  var anchorTimer = null;

  // ----- Tema -----
  function setTheme(next) {
    if (next === theme) return;
    theme = next;
    // troca instantânea: desliga as transições dos botões por um frame
    navbar.classList.add("navbar-no-transition");
    navbar.classList.toggle("navbar-dark", next === "dark");
    navbar.classList.toggle("navbar-light", next === "light");
    void navbar.offsetWidth;
    navbar.classList.remove("navbar-no-transition");
  }

  // Seção que cruza a linha central da navbar
  function updateTheme() {
    var line = navbar.offsetHeight / 2;
    for (var i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      if (rect.top <= line && rect.bottom > line) {
        setTheme(sections[i].dataset.theme);
        return;
      }
    }
  }

  // Observa uma faixa de 1px na altura central da navbar; qualquer seção que
  // entre ou saia dessa faixa dispara a atualização do tema.
  function observeSections() {
    if (observer) observer.disconnect();
    var line = Math.round(navbar.offsetHeight / 2);
    var bottom = Math.max(window.innerHeight - line - 1, 0);
    observer = new IntersectionObserver(updateTheme, {
      rootMargin: "-" + line + "px 0px -" + bottom + "px 0px",
      threshold: 0
    });
    sections.forEach(function (section) { observer.observe(section); });
    updateTheme();
  }

  // ----- Esconder / mostrar -----
  function atFooter() {
    return footer && footer.getBoundingClientRect().top <= navbar.offsetHeight;
  }

  function updateVisibility() {
    var y = window.scrollY;
    var delta = y - lastY;

    if (y <= 0) {
      hiddenByScroll = false;
      lastY = y;
    } else if (Math.abs(delta) >= SCROLL_THRESHOLD) {
      hiddenByScroll = delta > 0; // para baixo esconde, para cima mostra
      lastY = y;
    }

    navbar.classList.toggle("navbar-hidden", !compact.matches && (anchorScrolling || hiddenByScroll || atFooter()));
    ticking = false;
  }

  function onScroll() {
    if (anchorScrolling) {
      // fim do scroll suave: espera o scroll parar
      clearTimeout(anchorTimer);
      anchorTimer = setTimeout(function () {
        anchorScrolling = false;
        hiddenByScroll = true;
        lastY = window.scrollY;
        updateVisibility();
      }, 150);
    }
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateVisibility);
  }

  // Links âncora: a seção encaixa no topo da tela, então a navbar fica
  // escondida durante o scroll (mesmo subindo) para não cobrir o início dela.
  // A rolagem é feita aqui (sem mudar o endereço): o link não ganha "#seção" na barra do navegador.
  // Links "#" sem destino (caso fictício) não fazem nada.
  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute("href").slice(1);
    if (!id) { event.preventDefault(); return; }
    var section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    anchorScrolling = true;
    clearTimeout(anchorTimer);
    anchorTimer = setTimeout(function () {
      anchorScrolling = false;
      updateVisibility();
    }, 600);
    updateVisibility();
    section.scrollIntoView(); // respeita o scroll-padding e o scroll suave do CSS
    if (section.hasAttribute("tabindex")) section.focus({ preventScroll: true }); // link "pular para o conteúdo"
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", observeSections);
  compact.addEventListener("change", updateVisibility);
  observeSections();
  updateVisibility();
})();

// Rolagem suave da roda do mouse: o scroll acompanha o alvo com inércia.
// Âncoras, teclado e barra de rolagem continuam nativos.
(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return; // toque: rolagem nativa

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)"); // quem pediu menos movimento fica com a rolagem nativa
  var EASE_MS = 120; // quanto maior, mais suave (e mais lenta) a rolagem
  var target = window.scrollY;
  var current = target;
  var lastSet = target;
  var running = false;
  var lastTime = 0;

  function maxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  function stop() { running = false; }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(now - lastTime, 50);
    lastTime = now;
    current += (target - current) * (1 - Math.exp(-dt / EASE_MS));
    if (Math.abs(target - current) < 0.5) {
      current = target;
      running = false;
    }
    lastSet = Math.round(current);
    window.scrollTo({ top: lastSet, behavior: "instant" }); // ignora o scroll-behavior: smooth do CSS
    if (running) window.requestAnimationFrame(frame);
  }

  window.addEventListener("wheel", function (event) {
    if (event.ctrlKey || event.metaKey || event.defaultPrevented || reduceMotion.matches) return; // zoom
    if (event.target.closest && event.target.closest("select, textarea, input[type=range]")) return;
    if (document.documentElement.classList.contains("menu-open")) return; // menu aberto: página parada
    event.preventDefault();

    if (!running) {
      current = target = window.scrollY;
    }
    var delta = event.deltaMode === 1 ? event.deltaY * 32 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
    target = Math.max(0, Math.min(maxScroll(), target + delta));

    if (!running) {
      running = true;
      lastTime = performance.now();
      window.requestAnimationFrame(frame);
    }
  }, { passive: false });

  // Rolagem vinda de fora (âncora, teclado, barra): abandona a animação e reponta o alvo
  window.addEventListener("scroll", function () {
    if (Math.abs(window.scrollY - lastSet) > 2) {
      stop();
      current = target = window.scrollY;
      lastSet = window.scrollY;
    }
  }, { passive: true });
  document.addEventListener("click", function (event) {
    if (event.target.closest('a[href^="#"]')) stop();
  });
})();

// Menu de tablet e mobile: o botão abre/fecha o painel de links (a navbar vira o cabeçalho do menu).
(function () {
  var navbar = document.querySelector(".navbar");
  var button = document.querySelector(".navbar-menu");
  var panel = document.getElementById("navbar-itens");
  if (!navbar || !button || !panel) return;

  var compact = window.matchMedia("(max-width: 1210px)");

  function setOpen(open) {
    navbar.classList.toggle("navbar-open", open);
    document.documentElement.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function isOpen() { return navbar.classList.contains("navbar-open"); }

  button.addEventListener("click", function () { setOpen(!isOpen()); });

  // Escolheu um link: fecha o menu e a página rola até a seção
  panel.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  // Voltou para a largura de desktop: fecha e destrava a página
  compact.addEventListener("change", function () {
    if (!compact.matches) setOpen(false);
  });
})();
