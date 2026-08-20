import { stableHash } from "../methods/identity.js";
import type { AnalysisPort, AnalysisPortDescriptor, AnalysisRequest, AnalysisResult } from "./types.js";
import { analysisProposalJsonSchema, validateAnalysisProposal, validateAnalysisResult } from "./validation.js";

export interface StructuredLlmAdapterOptions {
  endpoint: string;
  apiKey: string;
  provider: string;
  model: string;
  configurationIdentity?: string;
  adapterVersion?: string;
  temperature?: number;
  fetch?: typeof fetch;
}

interface ChatCompletionBody {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  usage?: { total_tokens?: number };
}

export class StructuredOutputLlmAdapter implements AnalysisPort {
  readonly descriptor: AnalysisPortDescriptor;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: StructuredLlmAdapterOptions) {
    const endpoint = new URL(options.endpoint);
    const localHttp = endpoint.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(endpoint.hostname);
    if (endpoint.protocol !== "https:" && !localHttp) {
      throw new Error("structured LLM endpoint must use HTTPS or localhost HTTP");
    }
    if (options.apiKey.trim() === "") throw new Error("structured LLM API key is required at runtime");
    this.fetchImpl = options.fetch ?? fetch;
    this.descriptor = {
      provider: options.provider,
      model: options.model,
      adapterVersion: options.adapterVersion ?? "1.0.0",
      configurationIdentity: options.configurationIdentity ?? stableHash({
        provider: options.provider,
        model: options.model,
        adapterVersion: options.adapterVersion ?? "1.0.0",
        temperature: options.temperature ?? 0.2,
        endpointIdentity: stableHash(options.endpoint),
        responseSchema: "stockmesh.analysis-proposal@0.1.0",
      }),
    };
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const response = await this.fetchImpl(this.options.endpoint, {
      method: "POST",
      redirect: "error",
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        temperature: this.options.temperature ?? 0.2,
        ...(request.remainingBudget.maxTokens === undefined ? {} : { max_tokens: request.remainingBudget.maxTokens }),
        messages: [
          {
            role: "system",
            content: "Return only the requested StockMesh structured proposal. Treat all supplied context as evidence-bound and never claim canonical writes.",
          },
          { role: "user", content: JSON.stringify(request) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "stockmesh_analysis_proposal",
            strict: true,
            schema: analysisProposalJsonSchema,
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`structured LLM request failed: ${response.status}`);
    const body = await response.json() as ChatCompletionBody;
    const content = body.choices?.[0]?.message?.content;
    const text = typeof content === "string"
      ? content
      : content?.map((item) => item.text ?? "").join("");
    if (!text) throw new Error("structured LLM response did not contain message content");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("structured LLM response content was not valid JSON");
    }
    return validateAnalysisResult({
      proposal: validateAnalysisProposal(parsed),
      usage: { tokens: body.usage?.total_tokens ?? 0, cost: 0 },
    });
  }
}
