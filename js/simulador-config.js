// Premissas do simulador de economia. Ajuste os valores aqui; a fórmula fica em simulador-calculo.js.
(function (root, factory) {
  var config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.SIMULADOR_CONFIG = config;
})(typeof self !== "undefined" ? self : this, function () {
  return {
    tarifa: 0.95,               // R$ por kWh, com impostos
    iluminacaoPublica: 25,      // R$ por mês, fixo
    eficiencia: 0.80,
    potenciaPlacaKwp: 0.58,

    // Horas de sol pleno por região (kWh/kWp/dia, antes da eficiência)
    hsp: {
      Nordeste: 5.29,
      "Centro-Oeste": 5.07,
      Sudeste: 5.06,
      Norte: 4.64,
      Sul: 4.53,
      Brasil: 4.92              // usado quando não há estado
    },

    // Taxa mínima cobrada pela distribuidora, em kWh
    disponibilidadeKwh: { mono: 30, bi: 50, tri: 100 },

    // Preço instalado por kWp, por faixa do tamanho do sistema (ate = limite superior em kWp)
    precoKwp: [
      { ate: 3, min: 4000, max: 5500 },
      { ate: 8, min: 3200, max: 4500 },
      { ate: Infinity, min: 2800, max: 3800 }
    ],

    fioBPorKwhInjetado: 0.12,   // R$ por kWh injetado
    fracaoInjetada: { casa: 0.65, comercio: 0.40, rural: 0.50 },
    ligacaoPorTipo: { casa: "bi", comercio: "tri", rural: "tri" },

    manutencaoPorPlacaAno: 30,  // R$ por placa por ano
    faixaEconomia: [0.90, 1.00], // economia mínima e máxima como fração da economia calculada
    // Piso do slider e do valor digitado, em R$. Comércio e Rural (ligação trifásica, 100 kWh de taxa mínima)
    // só têm resultado a partir de R$ 130; abaixo disso a energia a compensar é zero.
    contaMinima: { casa: 80, comercio: 130, rural: 130 },
    contaMaxima: { casa: 3000, comercio: 10000, rural: 6000 }, // teto do slider por tipo, em R$
    contaMinimaRecomendada: 200, // abaixo disso a UI mostra aviso

    // Reservados para a curva de 25 anos (ainda não usados)
    reajusteAnual: 0.06,
    degradacaoAnual: 0.005,

    estadosPorRegiao: {
      Norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
      Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
      "Centro-Oeste": ["DF", "GO", "MT", "MS"],
      Sudeste: ["ES", "MG", "RJ", "SP"],
      Sul: ["PR", "RS", "SC"]
    }
  };
});
