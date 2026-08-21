import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockfilePath = resolve(repositoryRoot, "package-lock.json");
const lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
let replacements = 0;

function normalize(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.resolved === "string") {
    const url = new URL(value.resolved);
    if (url.hostname === "registry.npmmirror.com") {
      url.hostname = "registry.npmjs.org";
      value.resolved = url.href;
      replacements += 1;
    }
  }
  for (const child of Object.values(value)) normalize(child);
}

normalize(lockfile);
writeFileSync(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
console.log(`Lockfile registry normalization complete: ${replacements} mirror URLs replaced.`);
