import { CapabilityInputError } from "../clients/capabilities.js";
import { createWorkbenchRuntime } from "../workbench/runtime.js";
import { defaultRuntimeDatabasePath } from "../workbench/paths.js";

const safeRuntimeError = /^(?:Position|Variation|Trajectory|Evaluation|search run|staging item) (?:not found|is unavailable):?/;
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

async function stdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const capability = args.shift();
  if (!capability) throw new CapabilityInputError("capability is required");

  let inputText = "{}";
  if (args[0] === "--input") {
    if (args.length !== 2 || args[1] === undefined) throw new CapabilityInputError("--input requires one JSON object");
    inputText = args[1];
  } else if (args[0] === "--stdin") {
    if (args.length !== 1) throw new CapabilityInputError("--stdin does not accept additional arguments");
    inputText = await stdin();
  } else if (args.length > 0) {
    throw new CapabilityInputError(`unsupported argument: ${args[0]}`);
  }

  let input: unknown;
  try {
    input = JSON.parse(inputText || "{}");
  } catch {
    throw new CapabilityInputError("input must be valid JSON");
  }

  const runtime = createWorkbenchRuntime(process.env.STOCKMESH_DB ?? defaultRuntimeDatabasePath());
  try {
    const envelope = await runtime.capabilities.execute(capability, input);
    process.stdout.write(`${JSON.stringify(envelope)}\n`);
  } finally {
    runtime.close();
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const expected = error instanceof CapabilityInputError || safeRuntimeError.test(message);
  process.stderr.write(diagnosticLine(expected ? message : "StockMesh capability failed"));
  process.exitCode = expected ? 2 : 1;
}
