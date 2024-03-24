import { useEffect, useRef, useState } from "react";
import { initializeStreamingClient } from "./streaming-client-api";

export default function DIDVideoStream({ avatarUrl }: { avatarUrl: string }) {
  const videoElementRef = useRef(null);
  const [iceGatheringStatusLabel, setIceGatheringStatusLabel] = useState("");
  const [iceStatusLabel, setIceStatusLabel] = useState("");
  const [peerStatusLabel, setPeerStatusLabel] = useState("");
  const [signalingStatusLabel, setSignalingStatusLabel] = useState("");
  const [streamingStatusLabel, setStreamingStatusLabel] = useState("");
  const [streamingClient, setStreamingClient] = useState(null);

  const [utterance, setUtterance] = useState("This is an arbitrary utterance");

  useEffect(() => {
    console.log("DIDVideoStream mounted", videoElementRef);
    if (!videoElementRef) {
      return;
    }
    const client = initializeStreamingClient({
      avatarUrl,
      videoElementRef,
      setIceGatheringStatusLabel,
      setIceStatusLabel,
      setPeerStatusLabel,
      setSignalingStatusLabel,
      setStreamingStatusLabel,
    });
    setStreamingClient(client);
  }, [avatarUrl, videoElementRef]);

  return (
    <div>
      <div id="video-wrapper">
        <div>
          <video width="400" height="400" autoPlay ref={videoElementRef}></video>
        </div>
      </div>
      <br />
      <div id="buttons">
        <button onClick={streamingClient?.connect} type="button">
          Connect
        </button>
        <button onClick={() => streamingClient?.say(utterance)} type="button">
          Say next thing
        </button>
        <button onClick={streamingClient?.destroy} type="button">
          Destroy
        </button>
      </div>
      <div id="status">
        ICE gathering status: <label>{iceGatheringStatusLabel}</label>
        <br />
        ICE status: <label>{iceStatusLabel}</label>
        <br />
        Peer connection status: <label>{peerStatusLabel}</label>
        <br />
        Signaling status: <label>{signalingStatusLabel}</label>
        <br />
        Streaming status: <label>{streamingStatusLabel}</label>
        <br />
      </div>
    </div>
  );
}
