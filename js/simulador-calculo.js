// Cálculo do simulador de economia: função pura, sem acesso ao DOM.
// As premissas vêm de SIMULADOR_CONFIG (simulador-config.js).
(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require("./simulador-config.js") : root.SIMULADOR_CONFIG);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.calcularSimulacao = api.calcularSimulacao;
})(typeof self !== "undefined" ? self : this, function (CONFIG) {
  function regiaoDoEstado(uf, config) {
    if (!uf) return "Brasil";
    var regioes = config.estadosPorRegiao;
    for (var regiao in regioes) {
      if (regioes[regiao].indexOf(uf) !== -1) return regiao;
    }
    return "Brasil";
  }

  function faixaDePreco(kwp, config) {
    for (var i = 0; i < config.precoKwp.length; i++) {
      if (kwp <= config.precoKwp[i].ate) return config.precoKwp[i];
    }
    return config.precoKwp[config.precoKwp.length - 1];
  }

  function semResultado(conta, avisoContaBaixa) {
    return {
      placas: null, kWp: null, investMin: null, investMax: null, contaDepois: null,
      economiaMin: null, economiaMax: null, percentualMax: null,
      paybackMin: null, paybackMax: null,
      avisoContaBaixa: avisoContaBaixa, semResultado: true
    };
  }

  // entrada: { conta (R$/mês), estado (UF ou vazio), tipo ("casa" | "comercio" | "rural") }
  function calcularSimulacao(entrada, config) {
    config = config || CONFIG;
    var conta = entrada.conta;
    var tipo = config.fracaoInjetada[entrada.tipo] !== undefined ? entrada.tipo : "casa";
    var avisoContaBaixa = conta < config.contaMinimaRecomendada;

    var hsp = config.hsp[regiaoDoEstado(entrada.estado, config)];
    var disponibilidade = config.disponibilidadeKwh[config.ligacaoPorTipo[tipo]];

    var consumoKwh = (conta - config.iluminacaoPublica) / config.tarifa;
    var aCompensar = consumoKwh - disponibilidade;
    if (!(aCompensar > 0)) return semResultado(conta, avisoContaBaixa);

    var geracaoPorKwp = hsp * 30 * config.eficiencia;
    var quociente = Math.round(aCompensar / geracaoPorKwp / config.potenciaPlacaKwp * 1e6) / 1e6;
    var placas = Math.max(1, Math.ceil(quociente));
    var kWp = placas * config.potenciaPlacaKwp;

    var faixa = faixaDePreco(kWp, config);
    var investMin = kWp * faixa.min;
    var investMax = kWp * faixa.max;

    var injetado = aCompensar * config.fracaoInjetada[tipo];
    var contaDepois = disponibilidade * config.tarifa + config.iluminacaoPublica + injetado * config.fioBPorKwhInjetado;

    var economiaMax = (conta - contaDepois) * config.faixaEconomia[1];
    var economiaMin = (conta - contaDepois) * config.faixaEconomia[0];
    var percentualMax = Math.round(economiaMax / conta * 100);

    var manutencaoAno = placas * config.manutencaoPorPlacaAno;
    var denomMin = economiaMax * 12 - manutencaoAno;
    var denomMax = economiaMin * 12 - manutencaoAno;
    if (!(denomMin > 0) || !(denomMax > 0)) return semResultado(conta, avisoContaBaixa);

    var paybackMin = investMin / denomMin;
    var paybackMax = investMax / denomMax;
    if (!isFinite(paybackMin) || !isFinite(paybackMax)) return semResultado(conta, avisoContaBaixa);

    return {
      placas: placas, kWp: kWp, investMin: investMin, investMax: investMax,
      contaDepois: contaDepois, economiaMin: economiaMin, economiaMax: economiaMax,
      percentualMax: percentualMax, paybackMin: paybackMin, paybackMax: paybackMax,
      avisoContaBaixa: avisoContaBaixa, semResultado: false
    };
  }

  return { calcularSimulacao: calcularSimulacao };
});
