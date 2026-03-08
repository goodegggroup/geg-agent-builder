import { runStarterAgent } from "@/lib/agents/starterAgent";

export type AgentInput = Record<string, unknown> | undefined;
export type AgentOutput = Record<string, unknown>;

export type AgentRunner = (input: AgentInput) => Promise<AgentOutput>;

export const agentRegistry: Record<string, AgentRunner> = {
  "starter-agent": runStarterAgent,
};

export function getAgentRunner(agentName: string): AgentRunner {
  const runner = agentRegistry[agentName];

  if (!runner) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  return runner;
}
