import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const URL = "http://localhost:5000";

/**
 * DIDVideoStream component
 * This component handles video streaming using a direct URL.
 * It fetches a video from a specified URL and displays it in a video element.
 *
 * Props:
 * - avatarUrl: string - The URL of the avatar image to be displayed as a poster.
 * - utterance: string - The text utterance to be sent to the server for generating the video.
 */
export default function DIDVideoStream({ avatarUrl, utterance }: { avatarUrl: string; utterance: string }) {
  const videoElement = useRef<HTMLVideoElement>(null);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const doSay = async () => {
      try {
        setIsFetching(true);

        const response = await fetch(`${URL}/create_talk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url: avatarUrl, text: utterance }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log("Setting video src to", data);
        videoElement?.current?.setAttribute("src", data);
      } catch (error) {
        console.error("Error fetching video:", error);
        toast({ title: "Error fetching video", description: JSON.stringify(error) });
        // Display an error message to the user or handle the error gracefully
      } finally {
        setIsFetching(false);
      }
    };

    doSay();
  }, [utterance, avatarUrl, toast]);

  return (
    <div>
      <div className="video-wrapper">
        <div>
          <video ref={videoElement} poster={avatarUrl} width="400" height="400" autoPlay></video>
        </div>
      </div>
      <br />
      <div className="status">
        Fetching: <label>{isFetching ? "true" : "false"}</label>
      </div>
    </div>
  );
}
