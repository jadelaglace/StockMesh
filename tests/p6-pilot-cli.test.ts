import { linkSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];

function opaque(namespace: string, digit: string): string {
  return `${namespace}-${digit.repeat(64)}`;
}

function privateRoot(): string {
  const root = mkdtempSync(join(process.cwd(), "private", "p6-cli-test-"));
  roots.push(root);
  return root;
}

function input(): object {
  return {
    schema: "stockmesh.private-pilot-bundle/v2",
    authorization: {
      explicitlyAuthorized: true,
      purposeRef: opaque("purpose", "1"),
      authorizedAt: "2026-08-22T00:00:00Z",
      retentionPolicyRef: opaque("retention", "2"),
      deletionPolicyRef: opaque("deletion", "3"),
      publication: "private-only",
    },
    coverageBasis: {
      identity: "b".repeat(64), authority: "authorized-source-inventory", establishedAt: "2026-08-22T00:01:00Z", expectedRoles: 1, expectedSteps: 1,
    },
    preparedAt: "2026-08-22T00:02:00Z",
    sourceRefs: [opaque("source", "1")],
    roles: [{ id: opaque("role", "1"), sourceRefs: [opaque("source", "1")], claimCount: 1 }],
    steps: [{ id: opaque("step", "1"), sourceRefs: [opaque("source", "1")] }],
    unresolvedItems: [],
    branches: [],
  };
}

function run(inputPath: string, outputPath: string) {
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm.cmd", "run", "--silent", "pilot", "--", "--input", inputPath, "--output", outputPath]
    : ["run", "--silent", "pilot", "--", "--input", inputPath, "--output", outputPath];
  return spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 });
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
  rmSync(join(process.cwd(), "p6-public-report.json"), { force: true });
});

describe("P6 private pilot CLI", () => {
  it("atomically creates a body-free report only at an ignored path", () => {
    const root = privateRoot();
    const source = join(root, "input.json");
    const report = join(root, "report.json");
    writeFileSync(source, JSON.stringify(input()), "utf8");

    const result = run(relative(process.cwd(), source), relative(process.cwd(), report));
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "succeeded", processor: { name: "stockmesh-private-pilot", version: "2" } });
    expect(JSON.parse(readFileSync(report, "utf8"))).toMatchObject({ schema: "stockmesh.private-pilot-report/v2", privacy: { bodyFree: true, privateOnly: true, canonicalWrites: 0 } });
    expect(result.stdout).not.toContain(root);
  });

  it("rejects a public output path before writing", () => {
    const root = privateRoot();
    const source = join(root, "input.json");
    writeFileSync(source, JSON.stringify(input()), "utf8");
    const result = run(relative(process.cwd(), source), "p6-public-report.json");
    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({ status: "rejected", error: "pilot input and output must be Git-ignored" });
  });

  it("redacts malformed JSON and bounds rejected diagnostics", () => {
    const root = privateRoot();
    const source = join(root, "input.json");
    const report = join(root, "report.json");
    writeFileSync(source, "{private-body", "utf8");
    const malformed = run(relative(process.cwd(), source), relative(process.cwd(), report));
    expect(malformed.status).toBe(2);
    expect(JSON.parse(malformed.stderr)).toEqual({ status: "rejected", error: "pilot input must be valid JSON" });
    expect(malformed.stderr).not.toContain("private-body");

    writeFileSync(source, JSON.stringify({ ...input(), ["x".repeat(5_000)]: true }), "utf8");
    const oversized = run(relative(process.cwd(), source), relative(process.cwd(), report));
    expect(oversized.status).toBe(2);
    expect(Buffer.byteLength(oversized.stderr, "utf8")).toBeLessThanOrEqual(512);
    expect(JSON.parse(oversized.stderr)).toMatchObject({ error: expect.stringMatching(/\.\.\.$/) });
  });

  it("preserves its input and every pre-existing output", () => {
    const root = privateRoot();
    const source = join(root, "input.json");
    const report = join(root, "report.json");
    writeFileSync(source, JSON.stringify(input()), "utf8");
    const same = run(relative(process.cwd(), source), relative(process.cwd(), source));
    expect(same.status).toBe(2);
    expect(JSON.parse(readFileSync(source, "utf8"))).toMatchObject({ schema: "stockmesh.private-pilot-bundle/v2" });

    writeFileSync(report, "preserve-existing-report", "utf8");
    const existing = run(relative(process.cwd(), source), relative(process.cwd(), report));
    expect(existing.status).toBe(2);
    expect(JSON.parse(existing.stderr)).toEqual({ status: "rejected", error: "pilot output must not already exist" });
    expect(readFileSync(report, "utf8")).toBe("preserve-existing-report");
  });

  it("rejects a linked report target without changing its target", () => {
    const root = privateRoot();
    const source = join(root, "input.json");
    const target = join(root, "target.json");
    const report = join(root, "report.json");
    writeFileSync(source, JSON.stringify(input()), "utf8");
    writeFileSync(target, "preserve", "utf8");
    linkSync(target, report);
    const result = run(relative(process.cwd(), source), relative(process.cwd(), report));
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stderr)).toEqual({ status: "rejected", error: "pilot output must not already exist" });
    expect(readFileSync(target, "utf8")).toBe("preserve");
  });
});
