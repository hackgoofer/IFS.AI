"use client";
import { useEffect, useRef } from "react";
import { initializeStreamingClient } from "./streaming-client-api";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const destroyButtonRef = useRef<HTMLButtonElement>(null);
  const iceGatheringStatusLabelRef = useRef<HTMLLabelElement>(null);
  const iceStatusLabelRef = useRef<HTMLLabelElement>(null);
  const peerStatusLabelRef = useRef<HTMLLabelElement>(null);
  const signalingStatusLabelRef = useRef<HTMLLabelElement>(null);
  const streamingStatusLabelRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    // Pass the DOM references to the streaming-client-api module
    initializeStreamingClient({
      videoElement: videoRef.current,
      connectButton: connectButtonRef.current,
      startButton: startButtonRef.current,
      destroyButton: destroyButtonRef.current,
      iceGatheringStatusLabel: iceGatheringStatusLabelRef.current,
      iceStatusLabel: iceStatusLabelRef.current,
      peerStatusLabel: peerStatusLabelRef.current,
      signalingStatusLabel: signalingStatusLabelRef.current,
      streamingStatusLabel: streamingStatusLabelRef.current,
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div id="content">
        <div id="video-wrapper">
          <div>
            <video ref={videoRef} width="400" height="400" autoPlay></video>
          </div>
        </div>
        <br />
        <div id="buttons">
          <button ref={connectButtonRef} type="button">
            Connect
          </button>
          <button ref={startButtonRef} type="button">
            Start
          </button>
          <button ref={destroyButtonRef} type="button">
            Destroy
          </button>
        </div>
        <div id="status">
          ICE gathering status: <label ref={iceGatheringStatusLabelRef}></label>
          <br />
          ICE status: <label ref={iceStatusLabelRef}></label>
          <br />
          Peer connection status: <label ref={peerStatusLabelRef}></label>
          <br />
          Signaling status: <label ref={signalingStatusLabelRef}></label>
          <br />
          Streaming status: <label ref={streamingStatusLabelRef}></label>
          <br />
        </div>
      </div>
    </main>
  );
}
