import React, { useEffect, useRef, useState } from "react";
import ConversationViewer from "./ConversationViewerClean";

export default function App() {
  const v1 = useRef(null);
  const v2 = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const vid1 = v1.current;
    const vid2 = v2.current;
    if (!vid1 || !vid2) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => {
      if (vid1.paused && vid2.paused) setPlaying(false);
    };

    // Keep second video roughly in sync with first when both are playing.
    const onTimeUpdate = () => {
      if (vid1.paused || vid2.paused) return;
      const d = Math.abs(vid1.currentTime - vid2.currentTime);
      // if drift is larger than threshold, nudge second video
      if (d > 0.15) {
        try {
          vid2.currentTime = vid1.currentTime;
        } catch (e) {
          // ignore seek errors
        }
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
  }, []);

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

    // Align both videos to the same time before playing (use the earlier time)
    const t = Math.min(a.currentTime || 0, b.currentTime || 0);
    try {
      a.currentTime = t;
      b.currentTime = t;
    } catch (e) {
      // ignore seek errors
    }

    try {
      // attempt to play both
      await Promise.all([a.play(), b.play()]);
      setPlaying(true);
    } catch (e) {
      // autoplay may be blocked by browser (user gesture required)
      // update playing state based on actual paused status
      setPlaying(!a.paused || !b.paused);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Conversations - videos side by side</h1>
      </header>

      <main>
        <ConversationViewer />
      </main>

      {/* <section style={{ marginTop: 32 }}>
        <PromptPairer />
      </section> */}
    </div>
  );
}
