// Build de produção: junta e minifica o CSS e o JS e copia o site para dist/.
// Uso: npm run build   (o site de desenvolvimento continua usando os arquivos de css/ e js/)
import { transform } from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "dist";
const html = readFileSync("index.html", "utf8");

// Arquivos locais, na ordem em que aparecem no HTML
const styles = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)">/g)].map((m) => m[1]);
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "css"), { recursive: true });
mkdirSync(join(OUT, "js"), { recursive: true });

// CSS
let css = "";
for (const file of styles) css += (await transform(readFileSync(file, "utf8"), { loader: "css", minify: true })).code;
writeFileSync(join(OUT, "css/styles.min.css"), css);

// JS (a biblioteca em js/vendor já vem minificada)
let js = "";
for (const file of scripts) {
  const code = readFileSync(file, "utf8");
  js += file.startsWith("js/vendor/") ? code : (await transform(code, { minify: true, target: "es2018" })).code;
  js += "\n;";
}
writeFileSync(join(OUT, "js/app.min.js"), js);

// HTML: um CSS e um JS no lugar dos vários arquivos
let out = html;
styles.forEach((file, i) => {
  out = out.replace(`<link rel="stylesheet" href="${file}">`, i === 0 ? '<link rel="stylesheet" href="css/styles.min.css">' : "");
});
scripts.forEach((file, i) => {
  out = out.replace(`<script src="${file}"></script>`, i === 0 ? '<script src="js/app.min.js"></script>' : "");
});
out = out.replace(/\n[ \t]*\n(?=[ \t]*(<script|<\/body|<link))/g, "\n"); // linhas vazias deixadas pelas trocas
writeFileSync(join(OUT, "index.html"), out);

// Assets (sem os PNGs originais de assets/source)
cpSync("assets", join(OUT, "assets"), { recursive: true, filter: (src) => !src.replace(/\\/g, "/").includes("assets/source") });

const kb = (text) => (Buffer.byteLength(text) / 1024).toFixed(0) + " KB";
console.log(`CSS: ${styles.length} arquivos -> styles.min.css (${kb(css)})`);
console.log(`JS:  ${scripts.length} arquivos -> app.min.js (${kb(js)})`);
console.log(`Saída em ${OUT}/`);
