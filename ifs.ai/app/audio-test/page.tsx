"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MicIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import SpeechToText from "@/components/ui/speech-to-text";

export default function Page() {
  const [message, setMessage] = useState("");
  return (
    <main className="flex min-h-svh flex-col px-24 py-10">
      <div className="flex w-full flex-grow basis-0 space-x-4">
        <div className="h-full w-4/5 flex-col">
          <div className="flex h-full flex-col justify-between">
            <SpeechToText
              onTranscript={(transcript: string) => {
                console.log(transcript);
                setMessage(transcript);
              }}
            />
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
