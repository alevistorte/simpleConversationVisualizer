import React, { useState, useEffect } from "react";

// Simple CSV parser that handles quoted fields and newlines
function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nxt = text[i + 1];
    if (ch === '"') {
      if (inQuotes && nxt === '"') {
        field += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ",") {
      cur.push(field);
      field = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      // handle CRLF
      if (ch === "\r" && text[i + 1] === "\n") continue;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      continue;
    }
    field += ch;
  }
  // push last
  if (field !== "" || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

export default function PromptPairer() {
  const [promptsCsv, setPromptsCsv] = useState(null);
  const [filesDirCsv, setFilesDirCsv] = useState(null);
  const [input, setInput] = useState("");
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    // load CSVs from /assets
    fetch("/assets/PromptsToAnalyze.csv")
      .then((r) => r.text())
      .then((t) => setPromptsCsv(parseCSV(t)));
    fetch("/assets/files_dir.csv")
      .then((r) => r.text())
      .then((t) => setFilesDirCsv(parseCSV(t)));
  }, []);

  function buildMaps() {
    const promptsMap = new Map();
    if (promptsCsv) {
      const [header, ...rows] = promptsCsv;
      const idx = {};
      header.forEach((h, i) => (idx[h] = i));
      for (const r of rows) {
        const prompt_hash = r[idx["prompt_hash"]] || r[1];
        promptsMap.set(prompt_hash, {
          a: r[idx["participant_a_prompt_text"]] || r[3],
          b: r[idx["participant_b_prompt_text"]] || r[4],
        });
      }
    }

    const filesMap = new Map();
    if (filesDirCsv) {
      const [header, ...rows] = filesDirCsv;
      const idx = {};
      header.forEach((h, i) => (idx[h] = i));
      for (const r of rows) {
        const file_id = r[idx["file_id"]] || r[0];
        const dest = r[idx["destination_path"]] || r[1];
        filesMap.set(file_id, dest);
      }
    }

    return { promptsMap, filesMap };
  }

  const onProcess = () => {
    const { promptsMap, filesMap } = buildMaps();
    const names = input.split(/\s+/).filter(Boolean);
    const grouped = [];
    for (let i = 0; i < names.length; i += 2) {
      const a = names[i];
      const b = names[i + 1];
      if (!b) break; // drop last if odd
      // extract prompt id between _I and _P
      const m = a.match(/_I(\d+)_P/);
      const prompt_hash = m ? m[1] : null;
      const prompts = prompt_hash ? promptsMap.get(prompt_hash) : null;
      const destA = filesMap.get(a) || null;
      const destB = filesMap.get(b) || null;
      const videoA = destA ? `${destA}/${a}.mp4` : null;
      const videoB = destB ? `${destB}/${b}.mp4` : null;
      grouped.push({ a, b, prompt_hash, prompts, videoA, videoB });
    }
    setPairs(grouped);
  };

  return (
    <div className="pairer">
      <h2>Batch prompt mapper</h2>
      <p>
        Paste filenames (no extension), one per line, in pairs. Example:{" "}
        <code>V00_S1097_I00000049_P0347</code>
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        style={{ width: "100%" }}
      />
      <div style={{ marginTop: 8 }}>
        <button className="sync-button" onClick={onProcess}>
          Process pairs
        </button>
      </div>

      <div className="pairs-list">
        {pairs.map((p, i) => (
          <div
            key={i}
            className="pair-row"
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#666" }}>File: {p.a}</div>
                {p.videoA ? (
                  <video
                    src={`file://${p.videoA}`}
                    controls
                    style={{ width: "100%", height: 200, background: "#000" }}
                  />
                ) : (
                  <div
                    style={{
                      height: 200,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No path for this file
                  </div>
                )}
                <div style={{ marginTop: 8, color: "#333", fontSize: 14 }}>
                  {p.prompts ? p.prompts.a : "Prompt not found"}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#666" }}>File: {p.b}</div>
                {p.videoB ? (
                  <video
                    src={`file://${p.videoB}`}
                    controls
                    style={{ width: "100%", height: 200, background: "#000" }}
                  />
                ) : (
                  <div
                    style={{
                      height: 200,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No path for this file
                  </div>
                )}
                <div style={{ marginTop: 8, color: "#333", fontSize: 14 }}>
                  {p.prompts ? p.prompts.b : "Prompt not found"}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Prompt hash: {p.prompt_hash || "n/a"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
