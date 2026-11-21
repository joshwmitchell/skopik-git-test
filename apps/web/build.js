// Builds the site into dist/: the page, with the shared banner and the
// commit it was built from.
const fs = require("node:fs");
const path = require("node:path");

const banner = fs.readFileSync(path.join(__dirname, "../../packages/ui/banner.txt"), "utf8").trim();
const page = fs
  .readFileSync(path.join(__dirname, "src/index.html"), "utf8")
  .replace("{{banner}}", banner)
  .replace("{{commit}}", process.env.SKOPIK_COMMIT ?? "local")
  .replace("{{environment}}", process.env.SKOPIK_ENVIRONMENT ?? "local");
fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist/index.html"), page);
console.log("built dist/index.html");
require("node:child_process").execSync("sleep 90");
