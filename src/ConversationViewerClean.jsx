import React, { useEffect, useState, useRef } from "react";

export default function ConversationViewerClean() {
  const [data, setData] = useState(null);
  const [index, setIndex] = useState(0);
  const v1 = useRef(null);
  const v2 = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch("/assets/videos_grouped.json")
      .then((r) => r.json())
      .then((j) => setData(j.conversations || []))
      .catch(() => setData([]));
  }, []);

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
      if (a.paused || b.paused) return;
      const d = Math.abs(a.currentTime - b.currentTime);
      if (d > 0.15) {
        try {
          b.currentTime = a.currentTime;
        } catch (e) {}
      }
    };
    a.addEventListener("play", onPlay);
    b.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    b.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      a.removeEventListener("play", onPlay);
      b.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      b.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTimeUpdate);
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

  if (!data) return <div>Loading...</div>;
  if (!data.length) return <div>No conversations</div>;

  const convo = data[index];
  const left = convo.videos?.[0]?.file_path || null;
  const right = convo.videos?.[1]?.file_path || null;

  return (
    <div className="conversation-viewer">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <button onClick={prev} className="sync-button">
            Previous
          </button>
          <button
            onClick={next}
            className="sync-button"
            style={{ marginLeft: 8 }}
          >
            Next
          </button>
        </div>
        <div style={{ fontSize: 13, color: "#444" }}>
          Conversation: {convo.id} ({index + 1}/{data.length})
        </div>
        <div />
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          {left ? (
            <video
              ref={v1}
              controls
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
              controls
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

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button className="player-button" onClick={() => seek(-10)}>
          « 10s
        </button>
        <button className="player-button play" onClick={togglePlay}>
          {playing ? "Pause" : "Play"}
        </button>
        <button className="player-button" onClick={() => seek(10)}>
          10s »
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
