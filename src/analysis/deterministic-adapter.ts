import { stableHash } from "../methods/identity.js";
import type { AnalysisPort, AnalysisProposal, AnalysisRequest, AnalysisResult } from "./types.js";
import { validateAnalysisProposal } from "./validation.js";

export type DeterministicAnalysisFixture = AnalysisProposal | ((request: AnalysisRequest) => AnalysisProposal);

export class DeterministicAnalysisAdapter implements AnalysisPort {
  readonly descriptor;
  calls = 0;

  constructor(
    private readonly fixture: DeterministicAnalysisFixture,
    identity = "fixture-v1",
    private readonly usage = { tokens: 0, cost: 0 },
  ) {
    this.descriptor = {
      provider: "deterministic-offline",
      model: identity,
      adapterVersion: "1.0.0",
      configurationIdentity: stableHash({ identity }),
    };
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    this.calls += 1;
    const raw = typeof this.fixture === "function" ? this.fixture(request) : this.fixture;
    const proposal = validateAnalysisProposal(structuredClone(raw));
    return { proposal, usage: { ...this.usage } };
  }
}
