type StarterAgentInput = Record<string, unknown> | undefined;

export async function runStarterAgent(input: StarterAgentInput) {
  const prompt =
    typeof input?.prompt === "string" ? input.prompt : "";

  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    response: `Agent processed prompt: ${prompt}`,
    summary: "Starter agent completed successfully",
  };
}
