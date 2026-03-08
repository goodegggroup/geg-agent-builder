"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Note = {
  id: string;
  created_at: string;
  content: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNotes() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .select("id, created_at, content")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
      setNotes([]);
    } else {
      setNotes(data ?? []);
    }

    setLoading(false);
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) return;

    setSaving(true);

    const { error } = await supabase.from("notes").insert([{ content: trimmed }]);

    if (error) {
      setError(error.message);
    } else {
      setContent("");
      await loadNotes();
    }

    setSaving(false);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Notes (Supabase test)</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        This page reads and writes to your Supabase table <code>public.notes</code>.
      </p>

      <form onSubmit={addNote} style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a note..."
          style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: 8 }}
        >
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #f99", borderRadius: 8 }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div style={{ marginTop: 20 }}>
        <button
          onClick={loadNotes}
          disabled={loading}
          style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <ul style={{ marginTop: 16, display: "grid", gap: 10, padding: 0, listStyle: "none" }}>
        {notes.map((n) => (
          <li key={n.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {new Date(n.created_at).toLocaleString()}
            </div>
            <div style={{ marginTop: 6 }}>{n.content}</div>
          </li>
        ))}
      </ul>

      {!loading && notes.length === 0 ? (
        <p style={{ marginTop: 16, opacity: 0.7 }}>No notes yet. Add your first one above.</p>
      ) : null}
    </main>
  );
}
