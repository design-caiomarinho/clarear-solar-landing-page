# Clarear Energia Solar: landing page

**Español** · [Português](#português)

Landing page de un caso ficticio de energía solar, hecha con HTML, CSS y JavaScript puro (sin framework), a partir de un diseño en Figma. El contenido de la página está en portugués de Brasil.

> Caso ficticio: los enlaces de WhatsApp, correo y redes sociales no apuntan a destinos reales, y el número de WhatsApp del simulador es un valor de ejemplo.

## Qué incluye

- **Simulador de ahorro** funcional: factura mensual (slider o valor escrito), estado y tipo de inmueble (casa, comercio, rural). Calcula placas, inversión, ahorro mensual y retorno, con los números animados al cambiar el resultado.
- **Motion**: aparición al hacer scroll, parallax en las fotos, tarjeta animada en la portada y contadores. Usa la librería [Motion](https://motion.dev) (MIT), incluida en `js/vendor/`. Respeta `prefers-reduced-motion`.
- **Responsive**: escritorio, tablet (hasta 1210 px) y móvil (hasta 640 px), con menú propio para tablet y móvil.
- **Accesibilidad y SEO**: `<main>`, enlace para saltar al contenido, regiones `aria-live` en el simulador, meta tags y Open Graph, favicon con modo claro y oscuro.
- **Rendimiento**: imágenes WebP con `srcset`, carga diferida, CSS y JS minificados en el build.

## Cómo ejecutarlo

Requiere [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev       # servidor local en http://localhost:5173
npm test          # pruebas del cálculo del simulador
npm run build     # genera dist/ (CSS y JS unidos y minificados)
npm run preview   # sirve dist/ en http://localhost:5175
```

## Estructura

```
index.html                 página
css/                       tokens.css (colores y tipografía) y styles.css
js/main.js                 navbar, menú móvil, scroll
js/simulador-config.js     premisas del simulador (tarifa, precios, límites)
js/simulador-calculo.js    función de cálculo pura, sin DOM
js/simulador.js            interfaz del simulador
js/motion.js, parallax.js, hero-card.js, count.js    animaciones
tests/                     pruebas del cálculo
assets/source/             imágenes originales (PNG), fuera del build
build.mjs                  build de producción
```

### Cambiar una premisa del simulador

Los valores (tarifa, horas de sol por región, precio por kWp, rangos de factura, etc.) están en `js/simulador-config.js`. La fórmula está en `js/simulador-calculo.js`. Después de cambiar algo, ejecuta `npm test`.

## Publicación

El flujo `.github/workflows/pages.yml` ejecuta las pruebas, el build y publica `dist/` en GitHub Pages en cada push a `main`. En el repositorio: **Settings → Pages → Source: GitHub Actions**.

---

## Português

Landing page de um caso fictício de energia solar, feita em HTML, CSS e JavaScript puro (sem framework), a partir de um design no Figma. O conteúdo da página está em português do Brasil.

> Caso fictício: os links de WhatsApp, e-mail e redes sociais não apontam para destinos reais, e o número de WhatsApp do simulador é um valor de exemplo.

### O que inclui

- **Simulador de economia** funcional: conta mensal (slider ou valor digitado), estado e tipo de imóvel (casa, comércio, rural). Calcula placas, investimento, economia mensal e retorno, com os números animados quando o resultado muda.
- **Motion**: reveal ao rolar, parallax nas fotos, card animado na hero e contadores. Usa a biblioteca [Motion](https://motion.dev) (MIT), incluída em `js/vendor/`. Respeita `prefers-reduced-motion`.
- **Responsivo**: desktop, tablet (até 1210 px) e mobile (até 640 px), com menu próprio para tablet e mobile.
- **Acessibilidade e SEO**: `<main>`, link para pular ao conteúdo, regiões `aria-live` no simulador, meta tags e Open Graph, favicon com modo claro e escuro.
- **Desempenho**: imagens WebP com `srcset`, carregamento preguiçoso, CSS e JS minificados no build.

### Como rodar

Requer [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npm run dev       # servidor local em http://localhost:5173
npm test          # testes do cálculo do simulador
npm run build     # gera dist/ (CSS e JS unidos e minificados)
npm run preview   # serve dist/ em http://localhost:5175
```

### Mudar uma premissa do simulador

Os valores (tarifa, horas de sol por região, preço por kWp, faixas de conta etc.) ficam em `js/simulador-config.js`. A fórmula fica em `js/simulador-calculo.js`. Depois de mudar algo, rode `npm test`.

### Publicação

O fluxo `.github/workflows/pages.yml` roda os testes, o build e publica `dist/` no GitHub Pages a cada push na `main`. No repositório: **Settings → Pages → Source: GitHub Actions**.
