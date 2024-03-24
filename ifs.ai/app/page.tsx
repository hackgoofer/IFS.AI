"use client";
import { useState } from "react";
import DIDVideoStream from "./DIDVideoStream";

import { Button } from "@/components/ui/button";

export default function Home() {
  const [streamingClients, setStreamingClients] = useState([
    {
      avatarUrl: "https://storage.googleapis.com/tmc.dev/agent-2.jpeg",
    },
  ]);
  const [utterances, setUtterances] = useState(["Hello, World!"]);

  const createNewStreamingClient = () => {
    setStreamingClients([
      ...streamingClients,
      {
        avatarUrl: "https://storage.googleapis.com/tmc.dev/agent-3.jpeg",
      },
    ]);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div id="content">
        {streamingClients.map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <input
              type="text"
              value={utterances[index]}
              onChange={(e) => {
                const newUtterances = [...utterances];
                newUtterances[index] = e.target.value;
                setUtterances(newUtterances);
              }}
            />
            <DIDVideoStream key={index} avatarUrl={streamingClients[index].avatarUrl} utterance={utterances[index]} />
          </div>
        ))}
        <Button onClick={createNewStreamingClient}>Create New Streaming Client</Button>
      </div>
    </main>
  );
}
