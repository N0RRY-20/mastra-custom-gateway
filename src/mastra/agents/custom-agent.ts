import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const customAgent = new Agent({
  id: "custom-agent",
  name: "Custom Agent",
  description: "Agent yang ditenagai oleh custom gateway lokal.",
  instructions: `Kamu adalah asisten AI yang ramah, cerdas, dan responsif. Bantu pengguna menjawab pertanyaan, menganalisis masalah, dan menyelesaikan tugas pemrograman dengan baik.`,
  // Format model: [gatewayId]/[providerId]/[modelId]
  model: "customgateway/my-provider/9-router-1",
  defaultOptions: {
    maxSteps: 50,
  },
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
});
