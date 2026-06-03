const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const entries = [
  "index.html",
  "about.html",
  "services.html",
  "portfolio.html",
  "gallery.html",
  "contact.html",
  "style.css",
  "assets",
  "main",
  "portfolio-images",
  "slideshow-images"
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of entries) {
  const from = path.join(root, entry);
  const to = path.join(dist, entry);

  if (!fs.existsSync(from)) {
    throw new Error(`Missing required deploy asset: ${entry}`);
  }

  fs.cpSync(from, to, { recursive: true });
}

console.log(`Built static site into ${path.relative(root, dist)}`);
