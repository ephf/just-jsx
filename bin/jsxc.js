#!node
const fs = require("fs");
const path = require("path");
require("../src/jsx.js");

const [, , ...args] = process.argv;
const tags = { "-o": "out" };

args.forEach((arg, i) => arg.startsWith("-") && (tags[arg] = args[i + 1]));
args[0] ??= ".";

const ignore = ["node_modules", ".git", ".vscode", tags["-o"]];

if (!fs.existsSync(tags["-o"])) fs.mkdirSync(tags["-o"]);
(function parseRecursive(p) {
  const o = path.join(tags["-o"], p);

  if (fs.lstatSync(p).isDirectory()) {
    if (ignore.find((i) => p.endsWith(i))) return;
    if (!fs.existsSync(o)) fs.mkdirSync(o);
    fs.readdirSync(p).forEach((f) => parseRecursive(path.join(p, f)));
    return;
  }

  const c = fs.readFileSync(p, "utf-8");
  const e = path.extname(p);

  if ([".js", ".jsx", ".ts", ".tsx"].includes(e)) {
    fs.writeFileSync(o, jsx.parse(c));
    return;
  }

  if (e == ".html") {
    fs.writeFileSync(
      o,
      c.replace(
        /<script(.*?) jsx(.*?)>((?:.|[\r\n])+?)<\/script>/g,
        (_, a, b, c) => `<script${a}${b}>${jsx.parse(c)}</script>`
      )
    );
    return;
  }

  fs.writeFileSync(o, c);
})(args[0]);

console.log(`Compiled ${args[0]} into ${tags["-o"]}`);
