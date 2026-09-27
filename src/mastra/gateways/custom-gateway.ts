import {
  MastraModelGateway,
  type ProviderConfig,
  type GatewayLanguageModel,
} from "@mastra/core/llm";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible-v5";

export interface CustomGatewayOptions {
  id?: string;
  name?: string;
  providerId?: string;
  baseUrl?: string;
  apiKeyEnvVar?: string;
}

/**
 * Reusable adapter for any OpenAI-compatible LLM endpoint
 * (e.g. 9router, Ollama, vLLM, LiteLLM, Cloudflare AI Gateway, etc.)
 */
export class OpenAICompatibleGateway extends MastraModelGateway {
  readonly id: string;
  readonly name: string;
  private providerId: string;
  private baseUrl: string;
  private apiKeyEnvVar: string;

  constructor(options?: CustomGatewayOptions) {
    super();
    this.id = options?.id || "customgateway";
    this.name = options?.name || "Custom Gateway";
    this.providerId = options?.providerId || "my-provider";
    this.apiKeyEnvVar = options?.apiKeyEnvVar || "CUSTOM_API_KEY";
    this.baseUrl =
      options?.baseUrl ||
      process.env.CUSTOM_API_URL ||
      "http://localhost:20128/v1";
  }

  async fetchProviders(): Promise<Record<string, ProviderConfig>> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) {
        throw new Error(
          `Server returned status ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!Array.isArray(data?.data)) {
        throw new Error("Invalid response format: 'data' array not found");
      }

      const models = data.data.map((m: { id: string }) => m.id);

      return {
        [this.providerId]: {
          name: this.name,
          models: models.length > 0 ? models : ["default"],
          apiKeyEnvVar: this.apiKeyEnvVar,
          gateway: this.id,
          url: this.baseUrl,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch models from gateway (${this.baseUrl}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  buildUrl(modelId?: string, envVars?: Record<string, string>): string {
    return (
      envVars?.[this.apiKeyEnvVar.replace("_KEY", "_URL")] ||
      envVars?.CUSTOM_API_URL ||
      process.env.CUSTOM_API_URL ||
      this.baseUrl
    );
  }

  async getApiKey(modelId?: string): Promise<string> {
    return process.env[this.apiKeyEnvVar] ?? "";
  }

  async resolveLanguageModel({
    modelId,
    providerId,
    apiKey,
  }: {
    modelId: string;
    providerId: string;
    apiKey: string;
  }): Promise<GatewayLanguageModel> {
    const baseURL = this.buildUrl(modelId);

    const provider = createOpenAICompatible({
      name: providerId,
      apiKey,
      baseURL,
      supportsStructuredOutputs: true,
    });

    return provider.chatModel(modelId);
  }
}

// Default instance configured via constructor parameters
export const myPrivateGateway = new OpenAICompatibleGateway({
  id: "customgateway",
  name: "My Custom Gateway",
  providerId: "my-provider",
  baseUrl: process.env.CUSTOM_API_URL || "http://localhost:20128/v1",
  apiKeyEnvVar: "CUSTOM_API_KEY",
});
