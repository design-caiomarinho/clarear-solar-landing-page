// Rodar: node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const { calcularSimulacao } = require("../js/simulador-calculo.js");

function perto(real, esperado, tolerancia, rotulo) {
  assert.ok(Math.abs(real - esperado) <= tolerancia, rotulo + ": obtido " + real + ", esperado " + esperado + " ± " + tolerancia);
}
const mil = (valor) => Math.round(valor / 100) / 10; // R$ em milhares com 1 casa

test("R$ 450, Nordeste, Casa", () => {
  const r = calcularSimulacao({ conta: 450, estado: "PE", tipo: "casa" });
  assert.strictEqual(r.placas, 6);
  perto(r.investMin, 11136, 2, "investMin");
  perto(r.investMax, 15660, 2, "investMax");
  perto(r.contaDepois, 103, 2, "contaDepois");
  perto(r.economiaMin, 312, 2, "economiaMin");
  perto(r.economiaMax, 347, 2, "economiaMax");
  assert.strictEqual(r.percentualMax, 77);
  assert.ok(r.paybackMin <= r.paybackMax);
  perto(r.paybackMin, 2.8, 0.1, "paybackMin");
  perto(r.paybackMax, 4.4, 0.1, "paybackMax");
  assert.strictEqual(r.avisoContaBaixa, false);
  assert.strictEqual(r.semResultado, false);
});

test("R$ 450, sem estado, Casa = mesmo resultado do Nordeste", () => {
  const r = calcularSimulacao({ conta: 450, estado: "", tipo: "casa" });
  assert.strictEqual(r.placas, 6);
  perto(r.economiaMin, 312, 2, "economiaMin");
  perto(r.economiaMax, 347, 2, "economiaMax");
});

test("R$ 450, Sul, Casa", () => {
  const r = calcularSimulacao({ conta: 450, estado: "RS", tipo: "casa" });
  assert.strictEqual(r.placas, 7);
  assert.strictEqual(mil(r.investMin), 13.0);
  assert.strictEqual(mil(r.investMax), 18.3);
  perto(r.economiaMin, 312, 2, "economiaMin");
  perto(r.economiaMax, 347, 2, "economiaMax");
});

test("R$ 150, Sudeste, Casa", () => {
  const r = calcularSimulacao({ conta: 150, estado: "SP", tipo: "casa" });
  assert.strictEqual(r.placas, 2);
  assert.strictEqual(mil(r.investMin), 4.6);
  assert.strictEqual(mil(r.investMax), 6.4);
  perto(r.economiaMin, 64, 2, "economiaMin");
  perto(r.economiaMax, 71, 2, "economiaMax");
  assert.strictEqual(r.avisoContaBaixa, true);
});

test("R$ 1.800, Nordeste, Comércio", () => {
  const r = calcularSimulacao({ conta: 1800, estado: "BA", tipo: "comercio" });
  assert.strictEqual(r.placas, 25);
  assert.strictEqual(mil(r.investMin), 40.6);
  assert.strictEqual(mil(r.investMax), 55.1);
  perto(r.economiaMin, 1436, 2, "economiaMin");
  perto(r.economiaMax, 1595, 2, "economiaMax");
  assert.ok(r.paybackMin <= r.paybackMax);
});

test("conta muito baixa em Comércio não tem resultado", () => {
  const r = calcularSimulacao({ conta: 100, estado: "", tipo: "comercio" });
  assert.strictEqual(r.semResultado, true);
  assert.strictEqual(r.avisoContaBaixa, true);
});

test("conta zero não tem resultado", () => {
  assert.strictEqual(calcularSimulacao({ conta: 0, estado: "", tipo: "casa" }).semResultado, true);
});

test("todos os estados caem em alguma região", () => {
  const config = require("../js/simulador-config.js");
  const ufs = [].concat(...Object.values(config.estadosPorRegiao));
  assert.strictEqual(ufs.length, 27);
  assert.strictEqual(new Set(ufs).size, 27);
});
