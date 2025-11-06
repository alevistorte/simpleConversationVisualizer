import React, { useEffect, useState, useRef } from "react";

export default function ConversationViewerClean() {
  const [data, setData] = useState(null);
  const [index, setIndex] = useState(0);
  const v1 = useRef(null);
  const v2 = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMsg, setSearchMsg] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const STORAGE_KEY = "conversationViewer.lastConversationId";

  useEffect(() => {
    fetch("/assets/videos_grouped.json")
      .then((r) => r.json())
      .then((j) => setData(j.conversations || []))
      .catch(() => setData([]));
  }, []);

  // restore last viewed conversation id from localStorage (when data is loaded)
  useEffect(() => {
    if (!data || !data.length) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        // find conversation with matching id (allow numeric or string ids)
        const found = data.findIndex((c) => String(c.id) === String(raw));
        if (found >= 0) setIndex(found);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [data]);

  // persist conversation id to localStorage whenever index changes
  useEffect(() => {
    try {
      const id = data?.[index]?.id;
      if (id != null) localStorage.setItem(STORAGE_KEY, String(id));
    } catch (e) {
      // ignore
    }
  }, [index, data]);

  const prev = () =>
    setIndex((i) => (i - 1 + (data?.length || 0)) % (data?.length || 1));
  const next = () => setIndex((i) => (i + 1) % (data?.length || 1));

  useEffect(() => {
    const a = v1.current;
    const b = v2.current;
    if (!a || !b) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      if (a.paused && b.paused) setPlaying(false);
    };
    const onTimeUpdate = () => {
      // update UI progress from primary player
      try {
        setCurrentTime(a.currentTime || 0);
        setDuration(a.duration || 0);
      } catch (e) {}
      // keep them roughly in sync when both are playing
      if (a.paused || b.paused) return;
      const d = Math.abs(a.currentTime - b.currentTime);
      if (d > 0.15) {
        try {
          b.currentTime = a.currentTime;
        } catch (e) {}
      }
    };
    const onLoaded = () => {
      try {
        setDuration(a.duration || 0);
      } catch (e) {}
    };
    a.addEventListener("play", onPlay);
    b.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    b.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoaded);
    return () => {
      a.removeEventListener("play", onPlay);
      b.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      b.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [index, data]);

  const togglePlay = async () => {
    const a = v1.current;
    const b = v2.current;
    if (!a || !b) return;
    if (playing) {
      a.pause();
      b.pause();
      setPlaying(false);
      return;
    }
    const t = Math.min(a.currentTime || 0, b.currentTime || 0);
    try {
      a.currentTime = t;
      b.currentTime = t;
    } catch (e) {}
    try {
      await Promise.all([a.play(), b.play()]);
      setPlaying(true);
    } catch (e) {
      setPlaying(!a.paused || !b.paused);
    }
  };

  const seek = (delta) => {
    const a = v1.current;
    const b = v2.current;
    if (!a || !b) return;
    try {
      a.currentTime = Math.max(
        0,
        Math.min(a.duration || Infinity, a.currentTime + delta)
      );
      b.currentTime = Math.max(
        0,
        Math.min(b.duration || Infinity, b.currentTime + delta)
      );
    } catch (e) {}
  };

  const handleSeekTo = (val) => {
    const a = v1.current;
    const b = v2.current;
    if (!a || !b) return;
    try {
      const t = Math.max(0, Math.min(a.duration || Infinity, Number(val)));
      a.currentTime = t;
      b.currentTime = t;
      setCurrentTime(t);
    } catch (e) {
      // ignore
    }
  };

  const formatTime = (t) => {
    if (!isFinite(t) || t <= 0) return "0:00";
    const s = Math.floor(t);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (!data) return <div>Loading...</div>;
  if (!data.length) return <div>No conversations</div>;

  const convo = data[index];
  // copy conversation id to clipboard with a small UI feedback
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(convo.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // fallback for older browsers
      try {
        const ta = document.createElement("textarea");
        ta.value = String(convo.id);
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        // ignore
      }
    }
  };
  // search helper: find conversation by id (exact match preferred, then partial)
  const doSearch = (term) => {
    if (!data || !data.length) return;
    const t = String(term || "").trim();
    if (!t) {
      setSearchMsg("");
      return;
    }
    // try exact match first
    let found = data.findIndex((c) => String(c.id) === t);
    // fallback: partial match in id string
    if (found < 0) {
      found = data.findIndex((c) => String(c.id).includes(t));
    }
    if (found >= 0) {
      setIndex(found);
      setSearchMsg("Found");
      setTimeout(() => setSearchMsg(""), 1400);
      // clear suggestions
      setSuggestions([]);
      setHighlight(-1);
    } else {
      setSearchMsg("Not found");
      setTimeout(() => setSearchMsg(""), 1400);
    }
  };
  const left = convo.videos?.[0]?.file_path || null;
  const right = convo.videos?.[1]?.file_path || null;

  return (
    <div className="conversation-viewer">
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            gap: 6,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (!val) {
                  setSuggestions([]);
                  setHighlight(-1);
                  return;
                }
                // build suggestions (case-insensitive substring match)
                const t = val.toLowerCase();
                const matches = (data || [])
                  .map((c) => String(c.id))
                  .filter((id) => id.toLowerCase().includes(t))
                  .slice(0, 10);
                setSuggestions(matches);
                setHighlight(matches.length ? 0 : -1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (suggestions.length && highlight >= 0) {
                    const pick = suggestions[highlight];
                    setSearchTerm(pick);
                    setSuggestions([]);
                    setHighlight(-1);
                    doSearch(pick);
                  } else {
                    doSearch(searchTerm);
                  }
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!suggestions.length) return;
                  setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!suggestions.length) return;
                  setHighlight((h) => Math.max(0, h - 1));
                } else if (e.key === "Escape") {
                  setSuggestions([]);
                  setHighlight(-1);
                }
              }}
              placeholder="Search id..."
              style={{ padding: "4px 6px", fontSize: 12, width: 120 }}
            />
            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  width: 220,
                  background: "#fff",
                  border: "1px solid #ccc",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  maxHeight: 160,
                  overflow: "auto",
                  padding: 4,
                }}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={s + i}
                    onMouseDown={(ev) => {
                      // onMouseDown to avoid losing focus before click
                      ev.preventDefault();
                      setSearchTerm(s);
                      setSuggestions([]);
                      setHighlight(-1);
                      doSearch(s);
                    }}
                    style={{
                      padding: "6px 8px",
                      cursor: "pointer",
                      background: i === highlight ? "#eef" : "transparent",
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => doSearch(searchTerm)}
            className="sync-button"
            title="Find conversation by id"
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            Find
          </button>
          <div style={{ fontSize: 12, color: "#666", minWidth: 80 }}>
            {searchMsg}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* <div> */}
        <button onClick={prev} className="sync-button">
          Previous
        </button>
        <div
          style={{
            fontSize: 13,
            color: "#444",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div>
            Conversation: {convo.id} ({index + 1}/{data.length})
          </div>
          <button
            onClick={copyId}
            className="sync-button"
            title="Copy conversation id"
            // style={{ padding: "4px 8px", fontSize: 12 }}
          >
            Copy ID
          </button>
        </div>

        <button
          onClick={next}
          className="sync-button"
          //   style={{ marginLeft: 8 }}
        >
          Next
        </button>
        {/* </div> */}

        <div />
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          {left ? (
            <video
              ref={v1}
              // controls
              playsInline
              src={left}
              style={{ width: "100%", height: 360, background: "#000" }}
            />
          ) : (
            <div
              style={{
                height: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No left video
            </div>
          )}
          <div className="caption">{left?.split("/").pop() || "No file"}</div>
        </div>
        <div style={{ flex: 1 }}>
          {right ? (
            <video
              ref={v2}
              // controls
              playsInline
              src={right}
              style={{ width: "100%", height: 360, background: "#000" }}
            />
          ) : (
            <div
              style={{
                height: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No right video
            </div>
          )}
          <div className="caption">{right?.split("/").pop() || "No file"}</div>
        </div>
      </div>

      {/* progress bar between videos and common buttons */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => handleSeekTo(e.target.value)}
          style={{ width: "80%" }}
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button className="player-button" onClick={() => seek(-10)}>
          « -10s
        </button>
        <button className="player-button play" onClick={togglePlay}>
          {playing ? "Pause" : "Play"}
        </button>
        <button className="player-button" onClick={() => seek(10)}>
          +10s »
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <div style={{ flex: 1, maxWidth: 600 }}>
          <h3>Prompt A</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {convo.prompts?.participant_a_prompt_text || "No prompt A"}
          </pre>
        </div>
        <div style={{ flex: 1, maxWidth: 600 }}>
          <h3>Prompt B</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {convo.prompts?.participant_b_prompt_text || "No prompt B"}
          </pre>
        </div>
      </div>
    </div>
  );
}
