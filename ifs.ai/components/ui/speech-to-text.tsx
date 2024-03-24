"use client";

// SpeechToText.tsx
import { useState, useEffect } from "react";
import { MicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpeechToTextProps {
  onTranscript: (transcript: string) => void;
  onEnd?: () => void;
}

export default function SpeechToText({ onTranscript, onEnd }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        onTranscript(transcript);
      };

      setRecognition(recognitionInstance);
    }
  }, [onTranscript]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      if (onEnd) {
        onEnd();
      }
    }
  };

  return (
    <Button className="px-2" onClick={isListening ? stopListening : startListening}>
      <MicIcon className={`h-6 w-6 ${isListening ? "text-red-500" : ""}`} />
    </Button>
  );
}
