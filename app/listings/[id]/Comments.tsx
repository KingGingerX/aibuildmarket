"use client";
import { useEffect, useState } from "react";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { displayName: string };
  authorFontFamily: string | null;
};

type CosmeticPack = { id: string; type: "FONT" | "EMOJI"; name: string; payload: string };

export default function Comments({ listingId, authenticated }: { listingId: string; authenticated: boolean }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [myPacks, setMyPacks] = useState<CosmeticPack[]>([]);
  const [fontId, setFontId] = useState<string>("");

  useEffect(() => {
    if (!authenticated) return;
    fetch(`/api/comments?listingId=${listingId}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
    fetch("/api/cosmetics/mine")
      .then((res) => res.json())
      .then((data) => setMyPacks(data.packs ?? []))
      .catch(() => setMyPacks([]));
  }, [listingId, authenticated]);

  const fontPacks = myPacks.filter((p) => p.type === "FONT");
  const emojiPacks = myPacks.filter((p) => p.type === "EMOJI");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, body, authorFontId: fontId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] || data.error || "Couldn't post comment.");
      const selectedFont = fontPacks.find((f) => f.id === fontId);
      setComments((prev) => [
        ...(prev ?? []),
        { ...data.comment, authorFontFamily: selectedFont?.payload ?? null, author: { displayName: "You" } },
      ]);
      setBody("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  if (!authenticated) {
    return (
      <section className="comments-section">
        <h2>Comments</h2>
        <p className="dim">🔒 Log in to view and post comments.</p>
      </section>
    );
  }

  return (
    <section className="comments-section">
      <h2>Comments</h2>
      {comments === null ? (
        <p className="dim">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="dim">No comments yet. Ask the seller something.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="author">{c.author.displayName}</div>
            <div className="body" style={c.authorFontFamily ? { fontFamily: c.authorFontFamily } : undefined}>
              {c.body}
            </div>
          </div>
        ))
      )}

      <form onSubmit={submit} className="comment-form">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ask the seller a question…" maxLength={2000} style={fontId ? { fontFamily: fontPacks.find((f) => f.id === fontId)?.payload } : undefined} />

        {fontPacks.length > 0 && (
          <select value={fontId} onChange={(e) => setFontId(e.target.value)} style={{ marginTop: 6 }}>
            <option value="">Default font</option>
            {fontPacks.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        {emojiPacks.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {emojiPacks.flatMap((p) => JSON.parse(p.payload) as string[]).map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                type="button"
                className="btn btn-ghost"
                style={{ padding: "2px 6px" }}
                onClick={() => setBody((b) => b + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {myPacks.length === 0 && (
          <p className="dim" style={{ fontSize: 12, marginTop: 4 }}>
            No font/emoji packs unlocked yet — grab some from the <a href="/store" style={{ color: "var(--molten)" }}>Store</a>.
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={posting} style={{ marginTop: 8 }}>
          {posting ? "Posting…" : "Post"}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
