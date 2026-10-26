// Builds index.html (GitHub Pages, modular) and dist/milk_slip.html (single file, for the Claude artifact).
import fs from "fs"; import { execSync } from "child_process";
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap">';
const META = '<title>Palamalai Milk Slip</title><meta name="claude:viewport-fit-sides" content="cover"><meta name="description" content="Voice milk slip and dashboard for a tribal desi-dairy producer company (CTRD Trust, Palamalai). Prototype with sample data.">';
const shell = fs.readFileSync("tools/shell.html", "utf8");
fs.writeFileSync("index.html", `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${META}${FONTS}<link rel="stylesheet" href="css/app.css"></head>\n<body>\n${shell}<script type="module" src="js/app.js"></script>\n</body></html>\n`);
fs.mkdirSync("dist", { recursive: true });
execSync("npx --yes esbuild@0.23.1 js/app.js --bundle --format=esm --minify --target=es2020 --outfile=dist/app.bundle.js", { stdio: "inherit" });
const js = fs.readFileSync("dist/app.bundle.js", "utf8").replace(/<\/script/g, "<\\/script");
const css = fs.readFileSync("css/app.css", "utf8");
fs.writeFileSync("dist/milk_slip.html", `${META}\n${FONTS}\n<style>${css}</style>\n${shell}<script type="module">${js}</script>\n`);
fs.unlinkSync("dist/app.bundle.js");
console.log("built index.html and dist/milk_slip.html", fs.statSync("dist/milk_slip.html").size, "bytes");
