import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CreateAgentRunInput } from "@/types/agent-run";
import { getAgentRunner } from "@/lib/agents/registry";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateAgentRunInput;

    if (!body?.agent_name || typeof body.agent_name !== "string") {
      return NextResponse.json(
        { ok: false, error: "agent_name is required" },
        { status: 400 }
      );
    }

    const { data: queuedRun, error: insertError } = await supabase
      .from("agent_runs")
      .insert({
        agent_name: body.agent_name,
        status: "queued",
        input: body.input ?? {},
      })
      .select("*")
      .single();

    if (insertError || !queuedRun) {
      return NextResponse.json(
        { ok: false, error: insertError?.message ?? "Failed to create run" },
        { status: 500 }
      );
    }

    const runner = getAgentRunner(body.agent_name);

    const { error: runningError } = await supabase
      .from("agent_runs")
      .update({
        status: "running",
      })
      .eq("id", queuedRun.id);

    if (runningError) {
      return NextResponse.json(
        { ok: false, error: runningError.message },
        { status: 500 }
      );
    }

    try {
      const result = await runner(body.input);

      const { data: completedRun, error: completedError } = await supabase
        .from("agent_runs")
        .update({
          status: "completed",
          output: result,
          error: null,
        })
        .eq("id", queuedRun.id)
        .select("*")
        .single();

      if (completedError) {
        return NextResponse.json(
          { ok: false, error: completedError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          data: completedRun,
        },
        { status: 201 }
      );
    } catch (agentError) {
      const message =
        agentError instanceof Error ? agentError.message : "Unknown agent error";

      await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          error: message,
        })
        .eq("id", queuedRun.id);

      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
