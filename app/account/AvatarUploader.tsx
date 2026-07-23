"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AvatarUploader({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setBusy(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/account/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setPreview(data.avatarUrl);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPreview(avatarUrl);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {preview ? (
        <Image src={preview} alt="Profile picture" width={64} height={64} unoptimized style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }} />
      ) : (
        <div className="avatar-dot" style={{ width: 64, height: 64, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Uploading…" : "Upload Picture"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} style={{ display: "none" }} />
        {error && <div className="form-error" style={{ marginTop: 6 }}>{error}</div>}
      </div>
    </div>
  );
}
