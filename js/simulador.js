// Simulador de economia: liga o formulário ao cálculo (simulador-calculo.js) e atualiza o painel de resultado.
(function () {
  var WHATSAPP_NUMBER = "5500000000000"; // placeholder: DDI + DDD + número, só dígitos

  var form = document.querySelector(".simulador-form");
  var result = document.querySelector(".simulador-result");
  if (!form || !result || !window.calcularSimulacao) return;

  var slider = document.getElementById("simulador-conta");
  var valueInput = document.getElementById("simulador-conta-valor");
  var select = document.getElementById("simulador-estado");
  var options = Array.prototype.slice.call(form.querySelectorAll(".simulador-option"));

  var MIN = Number(slider.min); // atualizado por tipo em applyMax()
  var MAX = Number(slider.max); // atualizado por tipo em applyMax()
  var STEP = Number(slider.step) || 1;
  // Escala do gráfico: proporção da barra = valor / teto (o teto é o máximo do slider).
  // Estática, sem transição; o CSS limita a altura a 16px abaixo do rótulo e garante um mínimo (min-height) para o valor caber.

  var TIPO_TEXTO = { casa: "casa", comercio: "comércio", rural: "imóvel rural" };
  var MSG_SEM_RESULTADO = "Com essa conta o sistema não compensa. Fale com a gente para avaliar.";
  var MSG_CONTA_BAIXA = "Com conta abaixo de R$ 200 o sistema fica pequeno e o retorno demora.";

  var state = { conta: Number(slider.value), tipo: "casa" };

  function field(name) { return result.querySelector('[data-field="' + name + '"]'); }
  var el = {
    economia: field("economia"), percentual: field("percentual"),
    hoje: field("conta-hoje"), solar: field("conta-solar"),
    sistema: field("sistema"), investimento: field("investimento"), retorno: field("retorno"),
    aviso: field("aviso"), proposta: field("proposta"), whatsapp: field("whatsapp")
  };

  // ----- Formatação -----
  var brl = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  function reais(valor) { return "R$ " + brl.format(Math.round(valor)); }
  function mil(valor) { return (valor / 1000).toFixed(1).replace(".", ","); }
  function meioAno(valor) { return Math.round(valor * 2) / 2; }
  function numero(valor) { return String(valor).replace(".", ","); }

  function textoInvestimento(r) { return "R$ " + mil(r.investMin) + " mil a " + mil(r.investMax) + " mil"; }
  function textoEconomia(r) {
    if (Math.round(r.economiaMin) === Math.round(r.economiaMax)) return reais(r.economiaMax);
    return reais(r.economiaMin) + " – " + brl.format(Math.round(r.economiaMax));
  }
  function textoRetorno(r) {
    var a = meioAno(r.paybackMin);
    var b = meioAno(r.paybackMax);
    if (a === b) return "cerca de " + numero(a) + (a === 1 ? " ano" : " anos");
    return numero(a) + " a " + numero(b) + " anos";
  }

  // ----- Entrada -----
  function clamp(valor) {
    valor = Math.round(valor / STEP) * STEP;
    return Math.min(MAX, Math.max(MIN, valor));
  }

  function writeValue(valor) {
    valueInput.value = brl.format(valor);
    valueInput.style.width = (valueInput.value.length + 0.2) + "ch";
  }

  function syncSlider() {
    slider.value = state.conta;
    slider.style.setProperty("--progress", (state.conta - MIN) / (MAX - MIN));
  }

  // O piso e o teto do slider (e da escala do gráfico) varia conforme o tipo de imóvel
  function applyMax() {
    var config = window.SIMULADOR_CONFIG;
    MAX = config.contaMaxima[state.tipo] || MAX;
    MIN = config.contaMinima[state.tipo] || MIN;
    slider.max = MAX;
    slider.min = MIN;
  }

  // O resultado só atualiza depois que o usuário define o valor (soltar o slider, parar de digitar);
  // enquanto arrasta, só o valor grande e o slider mudam.
  var typingTimer = null;
  var TYPING_DELAY = 500;

  function setConta(valor, updateInput, deferRender) {
    state.conta = clamp(valor);
    syncSlider();
    if (updateInput) writeValue(state.conta);
    clearTimeout(typingTimer);
    if (deferRender === "slider") return;
    if (deferRender === "typing") typingTimer = setTimeout(render, TYPING_DELAY);
    else render();
  }

  // ----- Saída -----
  // Proporção (0 a 1) da área útil do gráfico; cada barra usa o próprio valor na mesma escala
  function barRatio(valor) {
    return Math.min(1, Math.sqrt(Math.max(0, valor) / MAX)); // raiz: valores baixos continuam visíveis ao lado do teto
  }

  function setBars(r) {
    el.hoje.style.setProperty("--bar-ratio", barRatio(state.conta));
    el.solar.style.setProperty("--bar-ratio", barRatio(r.semResultado ? state.conta : r.contaDepois));
  }

  function mensagemWhatsapp(r) {
    var estado = select.value ? select.options[select.selectedIndex].text : "";
    var imovel = TIPO_TEXTO[state.tipo] + (estado ? " em " + estado : "");
    var texto = "Olá! Fiz a simulação no site da Clarear: conta de " + reais(state.conta) + " por mês, " + imovel + ". ";
    if (r.semResultado) return texto + "Quero avaliar com vocês se vale a pena para o meu caso.";
    return texto + "Resultado: " + r.placas + (r.placas === 1 ? " placa" : " placas") +
      ", investimento de " + textoInvestimento(r) +
      ", economia de " + reais(r.economiaMin) + " a " + brl.format(Math.round(r.economiaMax)) + " por mês. " +
      "Quero receber uma proposta sem compromisso.";
  }

  // ----- Contagem dos números -----
  // Ao mudar o resultado, cada número do texto conta do valor anterior até o novo
  // (mesma curva dos botões). Textos sem a mesma quantidade de números trocam direto.
  var COUNT_MS = 600;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var NUM = /\d[\d.]*(?:,\d+)?/g;
  var running = 0;

  // cubic-bezier(0.22, 1, 0.36, 1): começa rápida e desacelera bastante perto do valor final
  function ease(t) {
    var x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
    function bez(a, b, u) { return 3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u; }
    var lo = 0, hi = 1, u = t;
    for (var i = 0; i < 24; i++) {
      u = (lo + hi) / 2;
      if (bez(x1, x2, u) < t) lo = u; else hi = u;
    }
    return bez(y1, y2, u);
  }

  function parseNumbers(text) {
    return (text.match(NUM) || []).map(function (token) {
      var comma = token.indexOf(",");
      return { value: parseFloat(token.replace(/\./g, "").replace(",", ".")), decimals: comma === -1 ? 0 : token.length - comma - 1 };
    });
  }

  function formatNumber(value, decimals) {
    if (decimals) return value.toFixed(decimals).replace(".", ",");
    return brl.format(Math.round(value));
  }

  function setText(node, text) {
    var previous = node._count ? node.textContent : node.dataset.target; // interrompida: parte do que está na tela
    node.dataset.target = text;
    if (node._count) { cancelAnimationFrame(node._count); node._count = 0; running--; if (!running) result.setAttribute("aria-busy", "false"); }

    var from = previous === undefined ? [] : parseNumbers(previous);
    var to = parseNumbers(text);
    var same = from.length && from.length === to.length && previous !== text;
    if (!same || reduceMotion.matches) { node.textContent = text; return; }

    var parts = text.split(NUM);
    var start = performance.now();
    running++;
    result.setAttribute("aria-busy", "true");

    function frame(now) {
      var t = Math.min(1, (now - start) / COUNT_MS);
      var k = ease(t);
      var out = parts[0];
      for (var i = 0; i < to.length; i++) {
        out += (t === 1 ? formatNumber(to[i].value, to[i].decimals) : formatNumber(from[i].value + (to[i].value - from[i].value) * k, to[i].decimals)) + parts[i + 1];
      }
      node.textContent = out;
      if (node === el.economia) fitSaving();
      if (t < 1) {
        node._count = requestAnimationFrame(frame);
      } else {
        node._count = 0;
        running--;
        if (!running) result.setAttribute("aria-busy", "false");
      }
    }
    node._count = requestAnimationFrame(frame);
  }

  // Mantém o valor em uma linha: reduz a fonte só quando o texto não cabe
  function fitSaving() {
    el.economia.style.fontSize = "";
    var available = el.economia.clientWidth;
    var needed = el.economia.scrollWidth;
    if (needed > available && available > 0) {
      var size = parseFloat(getComputedStyle(el.economia).fontSize);
      el.economia.style.fontSize = Math.floor(size * available / needed * 10) / 10 + "px";
    }
  }

  function render() {
    var r = window.calcularSimulacao({ conta: state.conta, estado: select.value, tipo: state.tipo });

    setText(el.hoje, reais(state.conta));
    setBars(r);

    if (r.semResultado) {
      setText(el.economia, "—");
      setText(el.percentual, "—");
      setText(el.solar, "—");
      setText(el.sistema, "—");
      setText(el.investimento, "—");
      setText(el.retorno, "—");
      el.aviso.textContent = MSG_SEM_RESULTADO;
      el.aviso.hidden = false;
    } else {
      setText(el.economia, textoEconomia(r));
      setText(el.percentual, "até " + r.percentualMax + "% menos na conta de luz.");
      setText(el.solar, reais(r.contaDepois));
      setText(el.sistema, r.placas + (r.placas === 1 ? " placa" : " placas"));
      setText(el.investimento, textoInvestimento(r));
      setText(el.retorno, textoRetorno(r));
      el.aviso.textContent = MSG_CONTA_BAIXA;
      el.aviso.hidden = !r.avisoContaBaixa;
    }

    fitSaving();

    var link = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensagemWhatsapp(r));
    [el.proposta, el.whatsapp].forEach(function (a) {
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  // ----- Eventos -----
  slider.addEventListener("input", function () { setConta(Number(slider.value), true, "slider"); });
  slider.addEventListener("change", function () { setConta(Number(slider.value), true); });

  valueInput.addEventListener("input", function () {
    var digitos = valueInput.value.replace(/\D/g, "").slice(0, 5);
    valueInput.value = digitos;
    valueInput.style.width = (Math.max(digitos.length, 1) + 0.2) + "ch";
    if (digitos) setConta(Number(digitos), false, "typing");
  });
  valueInput.addEventListener("blur", function () { setConta(state.conta, true); });
  valueInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") { event.preventDefault(); setConta(state.conta, true); }
  });
  valueInput.addEventListener("focus", function () { valueInput.select(); });

  select.addEventListener("change", render);

  options.forEach(function (option) {
    option.addEventListener("click", function () {
      state.tipo = option.dataset.tipo;
      applyMax();
      setConta(state.conta, true);
      options.forEach(function (o) { o.setAttribute("aria-pressed", String(o === option)); });
      render();
    });
  });

  window.addEventListener("resize", fitSaving);
  applyMax();
  setConta(state.conta, true);
})();
