import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8"));
const directDependencies = { ...manifest.dependencies, ...manifest.devDependencies };
const allowedLicenses = new Set(["Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MIT"]);
const failures = [];
const observed = new Map();

for (const name of Object.keys(directDependencies).sort()) {
  const dependencyManifest = JSON.parse(readFileSync(resolve(repositoryRoot, "node_modules", name, "package.json"), "utf8"));
  const license = dependencyManifest.license;
  if (typeof license !== "string" || !allowedLicenses.has(license)) {
    failures.push(`${name}@${dependencyManifest.version}: ${String(license ?? "missing")}`);
    continue;
  }
  observed.set(license, (observed.get(license) ?? 0) + 1);
}

if (failures.length) {
  console.error(`Direct dependencies with unapproved or missing licenses:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Direct dependency license check passed: ${Object.keys(directDependencies).length} packages; ${[...observed].map(([license, count]) => `${license}=${count}`).join(", ")}.`);
