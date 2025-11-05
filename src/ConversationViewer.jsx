import React, { useEffect, useState, useRef } from "react";

export default function ConversationViewer() {
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

  const prev = () => {
    if (!data || !data.length) return;
    setIndex((i) => (i - 1 + data.length) % data.length);
    setPlaying(false);
  };

  const next = () => {
    if (!data || !data.length) return;
    setIndex((i) => (i + 1) % data.length);
    setPlaying(false);
  };

  useEffect(() => {
    const a = v1.current;
    const b = v2.current;
    if (a) {
      try {
        a.pause();
        a.currentTime = 0;
      } catch (e) {}
    }
    if (b) {
      try {
        b.pause();
        b.currentTime = 0;
      } catch (e) {}
    }
    setPlaying(false);
  }, [index]);

  useEffect(() => {
    const vid1 = v1.current;
    const vid2 = v2.current;
    if (!vid1 || !vid2) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => {
      if (vid1.paused && vid2.paused) setPlaying(false);
    };

    const onTimeUpdate = () => {
      if (vid1.paused || vid2.paused) return;
      const d = Math.abs(vid1.currentTime - vid2.currentTime);
      if (d > 0.15) {
        try {
          vid2.currentTime = vid1.currentTime;
        } catch (e) {}
      }
    };

    vid1.addEventListener("play", onPlay);
    vid2.addEventListener("play", onPlay);
    vid1.addEventListener("pause", onPause);
    vid2.addEventListener("pause", onPause);
    vid1.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      vid1.removeEventListener("play", onPlay);
      vid2.removeEventListener("play", onPlay);
      vid1.removeEventListener("pause", onPause);
      vid2.removeEventListener("pause", onPause);
      vid1.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [data, index]);

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
      const ta = Math.max(0, Math.min(a.duration || Infinity, a.currentTime + delta));
      const tb = Math.max(0, Math.min(b.duration || Infinity, b.currentTime + delta));
      a.currentTime = ta;
      b.currentTime = tb;
    } catch (e) {}
  };

  if (!data) return <div>Loading conversations...</div>;
  if (!data.length) return <div>No conversations found in videos_grouped.json</div>;

  const convo = data[index];
  const vids = convo.videos || [];
  const left = vids[0] ? vids[0].file_path : null;
  const right = vids[1] ? vids[1].file_path : null;
  const leftName = left ? left.split("/").pop() : "";
  const rightName = right ? right.split("/").pop() : "";

  return (
    <div className="conversation-viewer">
      <div className="viewer-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <button className="sync-button" onClick={prev}>Previous</button>
          <button className="sync-button" style={{ marginLeft: 8 }} onClick={next}>Next</button>
        </div>
        <div style={{ fontSize: 13, color: "#444" }}>Conversation: {convo.id} ({index + 1}/{data.length})</div>
        <div />
      </div>

      <div className="videos-row" style={{ marginTop: 12 }}>
        <div className="video-wrap">
          {left ? (
            <video ref={v1} controls playsInline src={left} style={{ width: "100%", height: 360, background: "#000" }} />
          ) : (
            <div style={{ height: 360, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>No left video</div>
          )}
          <div className="caption">{leftName || "No file"}</div>
        </div>

        <div className="video-wrap">
          {right ? (
            <video ref={v2} controls playsInline src={right} style={{ width: "100%", height: 360, background: "#000" }} />
          ) : (
            <div style={{ height: 360, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>No right video</div>
          )}
          <div className="caption">{rightName || "No file"}</div>
        </div>
      </div>

      <div className="player-controls" style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
        <button className="player-button" onClick={() => seek(-10)} aria-label="Back 10s">« 10s</button>
        <button className="player-button play" onClick={togglePlay} aria-label="Play/Pause">{playing ? "Pause" : "Play"}</button>
        <button className="player-button" onClick={() => seek(10)} aria-label="Forward 10s">10s »</button>
      </div>

      <div className="prompts-section" style={{ marginTop: 16 }}>
        <div className="prompt-box">
          <h3>Prompt A</h3>
          <pre className="prompt-text">{convo.prompts?.participant_a_prompt_text || "No prompt A"}</pre>
        </div>
        <div className="prompt-box">
          <h3>Prompt B</h3>
          <pre className="prompt-text">{convo.prompts?.participant_b_prompt_text || "No prompt B"}</pre>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from "react";

export default function ConversationViewer() {
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

  const prev = () => {
    if (!data || !data.length) return;
    setIndex((i) => (i - 1 + data.length) % data.length);
    setPlaying(false);
  };
  const next = () => {
    if (!data || !data.length) return;
    setIndex((i) => (i + 1) % data.length);
    setPlaying(false);
  };

  useEffect(() => {
    // when conversation changes, pause and reset videos
    const a = v1.current;
    const b = v2.current;
    if (a) {
      try {
        a.pause();
        a.currentTime = 0;
      } catch (e) {}
    import React, { useEffect, useState, useRef } from "react";

    export default function ConversationViewer() {
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

      const prev = () => {
        if (!data || !data.length) return;
        setIndex((i) => (i - 1 + data.length) % data.length);
        setPlaying(false);
      };
      const next = () => {
        if (!data || !data.length) return;
        setIndex((i) => (i + 1) % data.length);
        setPlaying(false);
      };

      useEffect(() => {
        const a = v1.current;
        const b = v2.current;
        if (a) {
          try {
            a.pause();
            a.currentTime = 0;
          } catch (e) {}
        }
        import React, { useEffect, useState, useRef } from "react";

        export default function ConversationViewer() {
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

          const prev = () => {
            if (!data || !data.length) return;
            setIndex((i) => (i - 1 + data.length) % data.length);
            setPlaying(false);
          };
          const next = () => {
            if (!data || !data.length) return;
            setIndex((i) => (i + 1) % data.length);
            setPlaying(false);
          };

          useEffect(() => {
            const a = v1.current;
            const b = v2.current;
            if (a) {
              try {
                a.pause();
                a.currentTime = 0;
              } catch (e) {}
            }
            import React, { useEffect, useState, useRef } from "react";

            export default function ConversationViewer() {
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

              const prev = () => {
                if (!data || !data.length) return;
                setIndex((i) => (i - 1 + data.length) % data.length);
                setPlaying(false);
              };
              const next = () => {
                if (!data || !data.length) return;
                setIndex((i) => (i + 1) % data.length);
                setPlaying(false);
              };

              useEffect(() => {
                const a = v1.current;
                const b = v2.current;
                if (a) {
                  try {
                    a.pause();
                    a.currentTime = 0;
                  } catch (e) {}
                }
                import React, { useEffect, useState, useRef } from "react";

                export default function ConversationViewer() {
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

                  const prev = () => {
                    if (!data || !data.length) return;
                    setIndex((i) => (i - 1 + data.length) % data.length);
                    setPlaying(false);
                  };
                  const next = () => {
                    if (!data || !data.length) return;
                    setIndex((i) => (i + 1) % data.length);
                    setPlaying(false);
                  };

                  useEffect(() => {
                    const a = v1.current;
                    const b = v2.current;
                    if (a) {
                      try {
                        a.pause();
                        a.currentTime = 0;
                      } catch (e) {}
                    }
                    if (b) {
                      try {
                        b.pause();
                        b.currentTime = 0;
                      } catch (e) {}
                    }
                    setPlaying(false);
                  }, [index]);

                  useEffect(() => {
                    const vid1 = v1.current;
                    const vid2 = v2.current;
                    if (!vid1 || !vid2) return;

                    const onPlay = () => setPlaying(true);
                    const onPause = () => {
                      if (vid1.paused && vid2.paused) setPlaying(false);
                    };

                    const onTimeUpdate = () => {
                      if (vid1.paused || vid2.paused) return;
                      const d = Math.abs(vid1.currentTime - vid2.currentTime);
                      if (d > 0.15) {
                        try {
                          vid2.currentTime = vid1.currentTime;
                        } catch (e) {}
                      }
                    };

                    vid1.addEventListener("play", onPlay);
                    vid2.addEventListener("play", onPlay);
                    vid1.addEventListener("pause", onPause);
                    vid2.addEventListener("pause", onPause);
                    vid1.addEventListener("timeupdate", onTimeUpdate);

                    return () => {
                      vid1.removeEventListener("play", onPlay);
                      vid2.removeEventListener("play", onPlay);
                      vid1.removeEventListener("pause", onPause);
                      vid2.removeEventListener("pause", onPause);
                      vid1.removeEventListener("timeupdate", onTimeUpdate);
                    };
                  }, [data, index]);

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
                      const ta = Math.max(0, Math.min(a.duration || Infinity, a.currentTime + delta));
                      const tb = Math.max(0, Math.min(b.duration || Infinity, b.currentTime + delta));
                      a.currentTime = ta;
                      b.currentTime = tb;
                    } catch (e) {}
                  };

                  if (!data) return <div>Loading conversations...</div>;
                  if (!data.length) return <div>No conversations found in videos_grouped.json</div>;

                  const convo = data[index];
                  const vids = convo.videos || [];
                  const left = vids[0] ? vids[0].file_path : null;
                  const right = vids[1] ? vids[1].file_path : null;
                  const leftName = left ? left.split("/").pop() : "";
                  const rightName = right ? right.split("/").pop() : "";

                  return (
                    <div className="conversation-viewer">
                      <div className="viewer-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <button className="sync-button" onClick={prev}>Previous</button>
                          <button className="sync-button" style={{ marginLeft: 8 }} onClick={next}>Next</button>
                        </div>
                        <div style={{ fontSize: 13, color: "#444" }}>Conversation: {convo.id} ({index + 1}/{data.length})</div>
                        <div />
                      </div>

                      <div className="videos-row" style={{ marginTop: 12 }}>
                        <div className="video-wrap">
                          {left ? (
                            <video ref={v1} controls playsInline src={left} style={{ width: "100%", height: 360, background: "#000" }} />
                          ) : (
                            <div style={{ height: 360, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>No left video</div>
                          )}
                          <div className="caption">{leftName || "No file"}</div>
                        </div>

                        <div className="video-wrap">
                          {right ? (
                            <video ref={v2} controls playsInline src={right} style={{ width: "100%", height: 360, background: "#000" }} />
                          ) : (
                            <div style={{ height: 360, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>No right video</div>
                          )}
                          <div className="caption">{rightName || "No file"}</div>
                        </div>
                      </div>

                      <div className="player-controls" style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
                        <button className="player-button" onClick={() => seek(-10)} aria-label="Back 10s">« 10s</button>
                        <button className="player-button play" onClick={togglePlay} aria-label="Play/Pause">{playing ? "Pause" : "Play"}</button>
                        <button className="player-button" onClick={() => seek(10)} aria-label="Forward 10s">10s »</button>
                      </div>

                      <div className="prompts-section" style={{ marginTop: 16 }}>
                        <div className="prompt-box">
                          <h3>Prompt A</h3>
                          <pre className="prompt-text">{convo.prompts?.participant_a_prompt_text || "No prompt A"}</pre>
                        </div>
                        <div className="prompt-box">
                          <h3>Prompt B</h3>
                          <pre className="prompt-text">{convo.prompts?.participant_b_prompt_text || "No prompt B"}</pre>
                        </div>
                      </div>
                    </div>
                  );
                }
