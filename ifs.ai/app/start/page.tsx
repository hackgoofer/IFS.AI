"use client";

import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { MutableRefObject, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { generateReactHelpers } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { IMAGE_URLS_KEY } from "@/app/constants";

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
  const { startUpload, permittedFileInfo } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Res", res);
      let imageUrls = res[0].serverData.partImageUrls;
      console.log("Saving image urls", imageUrls);
      window.localStorage.setItem(IMAGE_URLS_KEY, JSON.stringify(imageUrls));
      toast({
        title: "Uploaded successfully!",
        description: (
          <div>
            <a href={res[0].url} target="_blank">
              <img src={res[0].url} alt="Uploaded image" />
            </a>
            <a href={imageUrls.exile} target="_blank">
              <img src={imageUrls.exile} alt="Uploaded image" />
            </a>
            <a href={imageUrls.manager} target="_blank">
              <img src={imageUrls.manager} alt="Uploaded image" />
            </a>
            <a href={imageUrls.firefighter} target="_blank">
              <img src={imageUrls.firefighter} alt="Uploaded image" />
            </a>
          </div>
        ),
      });
    },
    onUploadError: () => {
      toast({ title: "Error occurred while uploading", variant: "destructive" });
    },
    onUploadBegin: () => {
      toast({ title: "Upload has begun" });
    },
  });

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
                startUpload([dataURLtoFile(ss, "selfie.jpg")]);
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
