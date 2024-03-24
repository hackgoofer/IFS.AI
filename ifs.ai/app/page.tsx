"use client";
import { useState } from "react";
import DIDVideoStream from "./DIDVideoStream";

export default function Home() {
  const [streamingClients, setStreamingClients] = useState([
    {
      avatarUrl: "https://storage.googleapis.com/tmc.dev/agent-2.jpeg",
    },
  ]);

  const createNewStreamingClient = () => {
    setStreamingClients([
      ...streamingClients,
      {
        avatarUrl: "https://storage.googleapis.com/tmc.dev/agent-3.jpeg",
      },
    ]);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div id="content">
        {streamingClients.map((_, index) => (
          <DIDVideoStream key={index} avatarUrl={streamingClients[index].avatarUrl} />
        ))}
        <button onClick={createNewStreamingClient}>Create New Streaming Client</button>
      </div>
    </main>
  );
}
