"use client";

import { useEffect, useState } from "react";
import type { AgentRun } from "@/types/agent-run";

export default function AgentsPage() {
  const [agentName, setAgentName] = useState("starter-agent");
  const [prompt, setPrompt] = useState("");
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRuns() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/agent-runs", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load agent runs");
      }

      setRuns(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function createRun(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/agent-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_name: agentName,
          input: { prompt },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create agent run");
      }

      setPrompt("");
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
  loadRuns();

  const interval = setInterval(() => {
    loadRuns();
  }, 3000);

  return () => clearInterval(interval);
}, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Agents</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and monitor starter agent runs.
        </p>
      </div>

      <section className="mb-10 rounded-2xl border p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-medium">Create Agent Run</h2>

        <form onSubmit={createRun} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Agent Name</label>
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 outline-none"
              placeholder="starter-agent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] w-full rounded-xl border px-4 py-2 outline-none"
              placeholder="Enter a test prompt..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl border px-4 py-2 font-medium"
          >
            {submitting ? "Creating..." : "Create Run"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">Recent Runs</h2>
          <button
            onClick={loadRuns}
            disabled={loading}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {runs.length === 0 && !loading ? (
          <p className="text-sm text-gray-600">No agent runs yet.</p>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <div key={run.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{run.agent_name}</p>
                    <p className="text-sm text-gray-500 break-all">{run.id}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    {run.status}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <p>Created: {new Date(run.created_at).toLocaleString()}</p>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Input</p>
                    <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs">
                      {JSON.stringify(run.input, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium">Output</p>
                    <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs">
                      {JSON.stringify(run.output, null, 2)}
                    </pre>
                  </div>
                </div>

                {run.error && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {run.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
