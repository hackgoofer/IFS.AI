import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import Replicate from "replicate";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeUserId" }); // Fake auth function

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function makePartImages(inputUrl: string): Promise<{ manager: string; firefighter: string; exile: string }> {
  const prompts = {
    manager:
      "A photo of man img upclose, facing camera, looking confident and controlled, professional outfit, upright posture, orderly surroundings, muted background colors, symbols of achievement, sense of discipline and responsibility",
    firefighter:
      "A photo of man img upclose, facing camera, fierce expression, intense eyes, bold outfit, fiery background colors, sense of urgency and strength",
    exile:
      "A photo of man img upclose, facing camera, young and vulnerable, sad eyes, child-like clothing, sitting alone, muted background colors, sense of isolation and longing for care and acceptance",
  };

  return Object.fromEntries(
    await Promise.all(
      Object.entries(prompts).map(async ([part, prompt]) => [
        part,
        await replicate.run("tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4", {
          input: {
            prompt: prompt,
            num_steps: 40,
            style_name: "Photographic (Default)",
            input_image: inputUrl,
            num_outputs: 1,
            guidance_scale: 5,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
            style_strength_ratio: 20,
          },
        }),
      ]),
    ),
  );
}

// FileRouter for your app, can contain multiple FileRoutes
export const fileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "16MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);
      const partImageUrls = await makePartImages(file.url);

      console.log("Got image urls", partImageUrls);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, imageUrl: file.url, partImageUrls: partImageUrls };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
