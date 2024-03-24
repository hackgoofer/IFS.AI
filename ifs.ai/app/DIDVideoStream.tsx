import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const URL = "http://localhost:5000";

export default function DIDVideoStream({ avatarUrl, utterance }: { avatarUrl: string; utterance: string }) {
  const videoElement = useRef<HTMLVideoElement>(null);
  const [isFetching, setIsFetching] = useState(false);
  // call client.say when utterance changes or when peer connection is 'connected'
  useEffect(() => {
    console.log("utterance or avatars changed");
    const doSay = async () => {
      console.log("utterance or avatars changed");
      setIsFetching(true);
      // POST image_url and text to URL
      const result = await fetch(`${URL}/create_talk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarUrl, utterance }),
      });
      setIsFetching(false);
      const data = await result;
      console.log(data);
      // set video src to the returned URL
      videoElement?.current?.setAttribute("src", await data.text());
    };
    doSay();
  }, [utterance, avatarUrl]);

  return (
    <div>
      <div className="video-wrapper">
        <div>
          <video poster={avatarUrl} width="400" height="400" autoPlay></video>
        </div>
      </div>
      <br />
      <div className="status">
        Fetching: <label>{isFetching}</label>
      </div>
    </div>
  );
}
