"use client";

import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { generateReactHelpers } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { getImageUrlsKeyForId, getRantKeyForId, PartImageUrls } from "@/app/constants";
import SpeechToText from "@/components/ui/speech-to-text";
import { useRouter } from 'next/navigation'


const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(",");
  // @ts-ignore
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export default function Page() {
  const webcamRef: MutableRefObject<Webcam | null> = useRef(null);
  const [rantProcessed, setRantProcessed] = useState(false);
  const [rant, setRant] = useState("");
  const [imagesCaptured, setImagesCaptured] = useState(false);
  const [imageUrls, setImageUrls] = useState<PartImageUrls | {}>({});
  const router = useRouter()

  const id = useMemo(() => {
    let i = 0;
    while (window.localStorage.getItem(getImageUrlsKeyForId(i))) {
      i++;
    }
    console.log("ID is ", i);
    return i;
  }, []);

  useEffect(() => {
    if (rantProcessed && imageUrls.firefighter && id !== undefined) {
      console.log("Rant process and images generated", imageUrls);
      router.push(`/chat?id=${id}`)
    }
  }, [rantProcessed, imageUrls, id]);

  const { startUpload, permittedFileInfo, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Res", res);
      let imageUrls = res[0].serverData.partImageUrls;
      console.log("Saving image urls", imageUrls);
      setImageUrls({ ...imageUrls });
      window.localStorage.setItem(getImageUrlsKeyForId(id), JSON.stringify(imageUrls));
      // toast({
      //   title: "Uploaded successfully!",
      //   description: (
      //     <div>
      //       <a href={res[0].url} target="_blank">
      //         <img src={res[0].url} alt="Uploaded image" />
      //       </a>
      //       <a href={imageUrls.exile} target="_blank">
      //         <img src={imageUrls.exile} alt="Uploaded image" />
      //       </a>
      //       <a href={imageUrls.manager} target="_blank">
      //         <img src={imageUrls.manager} alt="Uploaded image" />
      //       </a>
      //       <a href={imageUrls.firefighter} target="_blank">
      //         <img src={imageUrls.firefighter} alt="Uploaded image" />
      //       </a>
      //     </div>
      //   ),
      // });
    },
    onUploadError: () => {
      toast({ title: "Error occurred while uploading", variant: "destructive" });
    },
    onUploadBegin: () => {
      // toast({ title: "Upload has begun" });
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center space-y-4">
        <div className="mb-8 flex flex-col items-center space-y-5">
          <p className="text-3xl font-semibold">IFS</p>
          <p className="text-stone-400">Connect with your inner selves.</p>
        </div>
        {!imagesCaptured && (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              height={800}
              screenshotFormat="image/jpeg"
              width={800}
              className="rounded-xl"
              videoConstraints={{ width: 800, height: 800, facingMode: "user" }}
            />
            <Button
              disabled={imagesCaptured}
              onClick={() => {
                if (!webcamRef.current) {
                  toast({ title: "Not ready", description: "Please grant permissions and wait" });
                } else {
                  const ss = webcamRef.current.getScreenshot();
                  if (!ss) {
                    toast({ title: "Couldn't capture image", variant: "destructive" });
                  } else {
                    // toast({
                    //   title: "Captured",
                    //   description: <img src={ss} alt="The captured selfie image from the webcam" />,
                    // });
                    startUpload([dataURLtoFile(ss, "selfie.jpg")]);
                    setImagesCaptured(true);
                  }
                }
              }}
            >
              {imagesCaptured ? "Looking inside you..." : "Start 🤳"}
            </Button>
          </>
        )}

        {imagesCaptured && (
          <div className="flex w-full max-w-xl flex-col items-center space-y-4">
            <div>
              <p>Now tell me about your problems...</p>
            </div>
            {!rantProcessed && (
              <SpeechToText
                onTranscript={(transcript) => setRant(transcript)}
                onEnd={() => {
                  window.localStorage.setItem(getRantKeyForId(id), rant);
                  setRantProcessed(true);
                }}
              />
            )}
            <div className="italic text-stone-400">{rant}</div>
            <p className="text-xs text-stone-400">{imageUrls.firefighter ? "Images generated" : "Generating images"}</p>
          </div>
        )}
      </div>
    </main>
  );
}
