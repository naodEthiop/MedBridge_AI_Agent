import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "src", "stitch", "manifest.json");
const outDir = path.join(root, "src", "stitch", "html");

async function main() {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  await fs.mkdir(outDir, { recursive: true });

  for (const screen of manifest.screens) {
    const outPath = path.join(outDir, screen.htmlFile);
    const res = await fetch(screen.htmlDownloadUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${screen.title}: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    await fs.writeFile(outPath, html, "utf8");
    console.log(`synced ${screen.htmlFile}`);
  }

  console.log(`done: ${manifest.screens.length} screens`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

