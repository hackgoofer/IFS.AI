import { useEffect, useRef, useState } from "react";
import { initializeStreamingClient } from "./streaming-client-api";

// import shadcn button:
import { Button } from "@/components/ui/button";

export default function DIDVideoStream({ avatarUrl, utterance }: { avatarUrl: string; utterance: string }) {
  const videoElementRef = useRef(null);
  const [iceGatheringStatusLabel, setIceGatheringStatusLabel] = useState("");
  const [iceStatusLabel, setIceStatusLabel] = useState("");
  const [peerStatusLabel, setPeerStatusLabel] = useState("");
  const [signalingStatusLabel, setSignalingStatusLabel] = useState("");
  const [streamingStatusLabel, setStreamingStatusLabel] = useState("");
  const [streamingClient, setStreamingClient] = useState(null);

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
    client.connect();
  }, [avatarUrl, videoElementRef]);

  // call client.say when utterance changes or when peer connection is 'connected'
  useEffect(() => {
    console.log("utterance or peerStatusLabel changed", [utterance, peerStatusLabel, iceStatusLabel]);
    if (peerStatusLabel !== "connected" || iceStatusLabel !== "connected") {
      return;
    }
    // This oddly isn't playing even though it seems equivalent to the setTimeout below.
    streamingClient?.say(utterance);
    // streamingClient?.say(utterance);
  }, [utterance, peerStatusLabel, iceStatusLabel]);

  return (
    <div>
      <div className="video-wrapper">
        <div>
          <video ref={videoElementRef} poster={avatarUrl} width="400" height="400" autoPlay></video>
        </div>
      </div>
      <br />
      <div className="buttons">
        <Button onClick={streamingClient?.connect} type="button">
          Connect
        </Button>
        <Button onClick={() => streamingClient?.say(utterance)} type="button">
          Say "{utterance}"
        </Button>
        <Button onClick={streamingClient?.destroy} type="button">
          Destroy
        </Button>
      </div>
      <div className="status">
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
