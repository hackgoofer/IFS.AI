"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MicIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { IMAGE_URLS_KEY, PartImageUrls } from "@/app/constants";
import DIDVideoStream from "@/app/DIDWebRTCVideoStream";

export default function Page() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<{role: string, text: string}[]>([]);
  
  const imageUrls: PartImageUrls = JSON.parse(window.localStorage.getItem(IMAGE_URLS_KEY) ?? "{}");
  const parts = [
    {
      name: "firefighter",
      prettyName: "Firefighter 🚒",
      imageUrl:
        imageUrls.firefighter ??
        "https://media.discordapp.net/attachments/1221190777259167784/1221307109006770316/robert_firefighter.png?ex=661219e1&is=65ffa4e1&hm=abc4dbc5b4131395cbcd4d5d028c7d51047bf1d0cc661e6fb2c21bde3123132a&=&format=webp&quality=lossless&width=1557&height=1557",
    },
    {
      name: "exile",
      prettyName: "Exile 🧭",
      imageUrl:
        imageUrls.exile ??
        "https://media.discordapp.net/attachments/1221190777259167784/1221307108549464165/robert_exile.png?ex=661219e1&is=65ffa4e1&hm=bed1c819bb6c88d0a86262cdd2ba334d0d10ec701f296abee75d32c3991e053e&=&format=webp&quality=lossless&width=1557&height=1557",
    },
    {
      name: "manager",
      prettyName: "Manager 🤵",
      imageUrl:
        imageUrls.manager ??
        "https://media.discordapp.net/attachments/1221190777259167784/1221307109392519168/robert_manager.png?ex=661219e1&is=65ffa4e1&hm=0ac923036baf4bad33b5fd508c90e2ac60621bfec876ada9d325a084e4fc2b00&=&format=webp&quality=lossless&width=1557&height=1557",
    },
  ];
  return (
    <main className="flex min-h-svh flex-col px-24 py-10">
      <p className="mb-10 text-3xl font-semibold">IFS Therapy</p>
      <div className="flex w-full flex-grow basis-0 space-x-4">
        <div className="h-full w-4/5 flex-col">
          <div className="flex h-full flex-col justify-between">
            <div className="flex flex-grow basis-0 flex-row space-x-2">
              {parts.map(({ name, prettyName, imageUrl }) => (
                <div key={name} className="flex-1 overflow-hidden rounded-lg border-2 border-stone-100">
                  <img src={imageUrl} alt={`An image of you as a ${name}`} />
                  {/*<DIDVideoStream avatarUrl={imageUrl} utterance={"hello there"} />*/}
                  <p className="my-2 text-lg font-semibold">{prettyName}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <form
                className="flex w-full space-x-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  fetch('http://localhost:5000/get_response', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      prev_part: 'none', // replace with the previous part
                      user_message: inputValue, // replace with the user's message
                      history: history
                    })
                  })
                  .then(response => response.json())
                  .then(data => {
                    const { responder, text, role } = data;
                    setHistory(prevHistory => [...prevHistory, {"role": role, "text": responder + ": " + text}]);
                    console.log(data);
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                  });

                  setInputValue("");

                  // TODO: Actually call the prompt(s)
                  console.log("Submitted", e);
                  setTimeout(() => setIsSubmitting(false), 2000);
                }}
              >
                <Input
                  value={inputValue}
                  placeholder="What do you think?"
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button type="submit" disabled={isSubmitting}>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button className="px-2">
                  <MicIcon className="h-6 w-6" />
                </Button>
              </form>
            </div>
          </div>
        </div>
        <div className="mx-2 w-1/5 rounded-lg border-2 border-stone-100 py-4">Sidebar</div>
      </div>
    </main>
  );
}
