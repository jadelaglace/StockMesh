import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readFileSync, realpathSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { evaluatePrivatePilot, PilotInputError } from "../pilot/index.js";

class PilotCliError extends Error {}
const MAX_DIAGNOSTIC_BYTES = 512;

function diagnosticLine(error: string): string {
  const render = (value: string): string => `${JSON.stringify({ status: "rejected", error: value })}\n`;
  if (Buffer.byteLength(render(error), "utf8") <= MAX_DIAGNOSTIC_BYTES) return render(error);
  let low = 0;
  let high = error.length;
  while (low < high) {
    const midpoint = Math.ceil((low + high) / 2);
    if (Buffer.byteLength(render(`${error.slice(0, midpoint)}...`), "utf8") <= MAX_DIAGNOSTIC_BYTES) low = midpoint;
    else high = midpoint - 1;
  }
  return render(`${error.slice(0, low)}...`);
}

function argumentsFrom(argv: string[]): { input: string; output: string } {
  let input: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if ((flag !== "--input" && flag !== "--output") || !value) throw new PilotCliError("usage: pilot --input <ignored-json> --output <ignored-json>");
    if (flag === "--input") input = value;
    else output = value;
  }
  if (!input || !output) throw new PilotCliError("usage: pilot --input <ignored-json> --output <ignored-json>");
  return { input, output };
}

function localPath(root: string, absolute: string): string {
  const local = relative(root, absolute);
  if (!local || local.startsWith("..") || resolve(root, local) !== absolute) throw new PilotCliError("pilot paths must stay inside the repository private boundary");
  const checked = spawnSync("git", ["check-ignore", "-q", "--", local], { cwd: root, stdio: "ignore" });
  if (checked.status !== 0) throw new PilotCliError("pilot input and output must be Git-ignored");
  return local;
}

function ignoredInput(root: string, candidate: string): string {
  let real: string;
  try {
    real = realpathSync(resolve(root, candidate));
  } catch {
    throw new PilotCliError("pilot input is unavailable");
  }
  localPath(root, real);
  const status = lstatSync(real);
  if (!status.isFile() || status.isSymbolicLink() || status.nlink !== 1) throw new PilotCliError("pilot input must be an unshared regular file");
  return real;
}

function ignoredOutput(root: string, candidate: string): string {
  const requested = resolve(root, candidate);
  localPath(root, requested);
  try {
    lstatSync(requested);
    throw new PilotCliError("pilot output must not already exist");
  } catch (error) {
    if (error instanceof PilotCliError) throw error;
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  let parent: string;
  try {
    parent = realpathSync(dirname(requested));
  } catch {
    throw new PilotCliError("pilot output directory is unavailable");
  }
  const real = resolve(parent, basename(requested));
  localPath(root, real);
  return real;
}

function readPrivateInput(path: string): unknown {
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(descriptor);
    const current = statSync(path);
    if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== current.dev || opened.ino !== current.ino) {
      throw new PilotCliError("pilot input changed during validation");
    }
    try {
      return JSON.parse(readFileSync(descriptor, "utf8")) as unknown;
    } catch (error) {
      if (error instanceof SyntaxError) throw new PilotCliError("pilot input must be valid JSON");
      throw error;
    }
  } finally {
    closeSync(descriptor);
  }
}

function publishPrivateReport(root: string, outputPath: string, body: string): void {
  const parent = dirname(outputPath);
  const temporary = join(parent, `.stockmesh-pilot-${randomUUID()}.tmp`);
  let descriptor: number | undefined;
  let linked = false;
  try {
    descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    const opened = fstatSync(descriptor);
    if (!opened.isFile() || opened.nlink !== 1) throw new PilotCliError("pilot temporary report must be an unshared regular file");
    writeFileSync(descriptor, body, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    if (realpathSync(parent) !== parent) throw new PilotCliError("pilot output directory changed during publication");
    localPath(root, outputPath);
    linkSync(temporary, outputPath);
    linked = true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") throw new PilotCliError("pilot output must not already exist");
    throw error;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    try {
      unlinkSync(temporary);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT") && !linked) throw error;
    }
  }
}

try {
  const root = process.cwd();
  const args = argumentsFrom(process.argv.slice(2));
  const inputPath = ignoredInput(root, args.input);
  const outputPath = ignoredOutput(root, args.output);
  if (inputPath === outputPath) throw new PilotCliError("pilot input and output must differ");
  const input = readPrivateInput(inputPath);
  const report = evaluatePrivatePilot(input);
  publishPrivateReport(root, outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ status: "succeeded", inputIdentity: report.inputIdentity, gaps: report.gaps, processor: { name: "stockmesh-private-pilot", version: "2" } })}\n`);
} catch (error) {
  const expected = error instanceof PilotCliError || error instanceof PilotInputError;
  process.stderr.write(diagnosticLine(expected ? error.message : "StockMesh private pilot failed"));
  process.exitCode = expected ? 2 : 1;
}
