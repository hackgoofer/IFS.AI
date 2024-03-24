"use client";

import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { MutableRefObject, useRef } from "react";
import { toast } from "@/components/ui/use-toast";

export default function Page() {
  const webcamRef: MutableRefObject<Webcam | null> = useRef(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center space-y-2">
        <Webcam
          ref={webcamRef}
          audio={false}
          height={720}
          screenshotFormat="image/jpeg"
          width={1280}
          className="rounded-xl"
          videoConstraints={{ width: 800, height: 800, facingMode: "user" }}
        />
        <Button
          onClick={() => {
            if (!webcamRef.current) {
              toast({ title: "Not ready", description: "Please grant permissions and wait" });
            } else {
              const ss = webcamRef.current.getScreenshot();
              if (!ss) {
                toast({ title: "Couldn't capture image", variant: "destructive" });
              } else {
                toast({
                  title: "Captured",
                  description: <img src={ss} alt="The captured selfie image from the webcam" />,
                });
              }
            }
          }}
        >
          Take a selfie 🤳
        </Button>
      </div>
    </main>
  );
}
