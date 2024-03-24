"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MicIcon, SendIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getImageUrlsKeyForId, PartImageUrls } from "@/app/constants";
import DIDVideoStream from "@/app/DIDWebRTCVideoStream";
import Loading from "@/components/ui/loading"; // Import a LoadingScreen component
import SpeechToText from "@/components/ui/speech-to-text";
import { MessageBox } from "react-chat-elements";

import "react-chat-elements/dist/main.css";

export default function Page({ searchParams }: { searchParams: { id: number } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<{ role: string; text: string; responder: string }[]>([]);
  const [prevPart, setPrevPart] = useState("none");

  const imageUrls: PartImageUrls = JSON.parse(
    window.localStorage.getItem(getImageUrlsKeyForId(searchParams.id)) ?? "{}",
  );
  const parts = [
    {
      name: "Manager",
      prettyName: "Manager 🤵",
      imageUrl:
        imageUrls.manager ??
        "https://media.discordapp.net/attachments/1221190777259167784/1221307109392519168/robert_manager.png?ex=661219e1&is=65ffa4e1&hm=0ac923036baf4bad33b5fd508c90e2ac60621bfec876ada9d325a084e4fc2b00&=&format=webp&quality=lossless&width=1557&height=1557",
      personality:
        "As a Manager in this situation, I feel a sense of duty and responsibility. I am constantly questioning if we're doing the right thing and whether our venture will yield the desired results in a short span. The need for surety causes additional stress and anxiety, driving me to closely scrutinize and control every aspect of our plan.",
      unmetNeeds: ["certainty", "success", "validation"],
    },
    {
      name: "Exile",
      prettyName: "Exile 🧭",
      imageUrl:
        imageUrls.exile ??
        "https://media.discordapp.net/attachments/1221190777259167784/1221307108549464165/robert_exile.png?ex=661219e1&is=65ffa4e1&hm=bed1c819bb6c88d0a86262cdd2ba334d0d10ec701f296abee75d32c3991e053e&=&format=webp&quality=lossless&width=1557&height=1557",
      personality:
        "As an Exile, I carry the heavy burdens of self-doubt and feelings of inadequacy. I question if this is the life I truly want and if these achievements will bring me happiness. My inner turbulence intensifies when thinking about love and why it seems elusive to me. I am the receptacle of unvoiced sadness and yearning, often suppressed to maintain an outward impression of confidence.",
      unmetNeeds: ["companionship", "contentment", "self-acceptance"],
    },
    {
      name: "Firefighter",
      prettyName: "Firefighter 🚒",
      imageUrl:
        imageUrls.firefighter ??
        "https://media.discordapp.net/attachments/1221190777259167784/1221307109006770316/robert_firefighter.png?ex=661219e1&is=65ffa4e1&hm=abc4dbc5b4131395cbcd4d5d028c7d51047bf1d0cc661e6fb2c21bde3123132a&=&format=webp&quality=lossless&width=1557&height=1557",
      personality:
        "As a Firefighter, I react to these feelings of insecurity and uncertainty by pushing towards ambitious goals like becoming a billionaire in 12 months. My approach can be seen as impulsive or even reckless, as it's driven more by a need to numb the deep-seated feelings of inadequacy than by a solid plan.",
      unmetNeeds: ["fulfillment", "validation", "sense of worth"],
    },
  ];

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = sidebarRef.current.scrollHeight;
    }
  });

  const createVideo = async (imageUrl: string, text: string) => {
    const response = await fetch("http://127.0.0.1:5000/create_talk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        text: text,
      }),
    });
    const data = await response.json();
    return data;
  };

  return (
    <main className="flex min-h-svh flex-col px-4 py-10">
      {isSubmitting ? <Loading></Loading> : <div />}
      <p className="mb-10 text-center text-3xl font-semibold">IFS Therapy</p>
      <div className="flex h-[80vh] w-full flex-grow basis-0 space-x-4">
        <div className="h-full w-4/5 flex-auto flex-col">
          <div className="flex h-full flex-col justify-between">
            <div className="flex flex-grow basis-0 flex-row space-x-2">
              {parts.map(({ name, prettyName, imageUrl, personality, unmetNeeds }) => (
                <div key={name} className="flex-1 overflow-hidden rounded-lg border-2 border-stone-100">
                  <img className="rounded-lg" src={imageUrl} alt={`An image of you as a ${name}`} />
                  <div className="px-2">
                    <p className="my-2 text-center text-lg font-semibold">{prettyName}</p>
                    <p className="my-2 text-sm">{personality}</p>
                    <p className="my-2 text-sm">
                      <strong>Unmet needs:</strong> {unmetNeeds.join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="mr-1 flex w-full space-x-2">
                <Input
                  value={inputValue}
                  placeholder="What do you think?"
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    fetch("http://127.0.0.1:5000/get_response", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        prev_part: prevPart, // replace with the previous part
                        user_message: inputValue, // replace with the user's message
                        history: [...history, { role: "user", text: inputValue, responder: "" }],
                      }),
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        const { responder, text, role } = data;
                        setHistory((prevHistory) => [
                          ...prevHistory,
                          {
                            role: "user",
                            text: inputValue,
                            responder: "",
                          },
                          { role: role, text: text, responder: responder },
                        ]);
                        setPrevPart(responder);
                        setInputValue("");
                        console.log(data);

                        const part = parts.find((part) => part.name.toLowerCase() === responder.toLowerCase());
                        if (part) {
                          console.log("using image");
                          console.log(part.imageUrl);
                          // TODO: CAN SOMEOONE LOOK INTO HOW TO DISPLAY IT ON PAGE? SHOULD WE USE THE DIDVideoStream?
                          console.log(createVideo(part.imageUrl, text));
                        } else {
                          console.error("Part not found for responder:", responder);
                        }
                      })
                      .catch((error) => {
                        console.error("Error:", error);
                      })
                      .finally(() => setIsSubmitting(false));
                  }}
                >
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
              <SpeechToText onTranscript={(transcript) => setInputValue(transcript)} />
            </div>
          </div>
        </div>
        <div
          ref={sidebarRef}
          className="mx-2 max-h-full w-2/5 overflow-auto overflow-y-scroll rounded-lg border-2 border-stone-100 py-4"
        >
          {history.map(({ role, text, responder }, index) => {
            let bgColor;
            if (role === "user") {
              bgColor = "white";
            } else if (responder.toLowerCase() === "exile") {
              bgColor = "#FFFFE0";
            } else if (responder.toLowerCase() == "firefighter") {
              bgColor = "#FFC0CB";
            } else if (responder.toLowerCase() == "manager") {
              bgColor = "#ADD8E6";
            } else {
              bgColor = "#000000";
            }
            return (
              <div style={{ backgroundColor: bgColor, borderRadius: "10px", fontSize: 10 }}>
                <MessageBox
                  key={text}
                  id={index.toString()}
                  title={responder}
                  titleColor={bgColor} // Add this line
                  position={role === "user" ? "right" : "left"}
                  type={"text"}
                  text={role === "user" ? "User: " + text : text}
                  date={new Date()}
                  focus={false}
                  forwarded={false}
                  replyButton={false}
                  removeButton={false}
                  status={"read"}
                  notch={false}
                  avatar={""}
                  retracted={false} // Add this line
                />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
