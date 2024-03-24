import replicate
import os
import json
import concurrent.futures
import logging
from datetime import datetime

os.environ['REPLICATE_API_TOKEN'] = "r8_****"

input_image_url = "https://pub-8e27fc985b9949f6ad6d8b31adae8470.r2.dev/robert.PNG"

# Prompts for each of the calls
prompts = [
    "A photo of person img upclose, facing camera, looking confident and controlled, professional outfit, upright posture, orderly surroundings, muted background colors, symbols of achievement, sense of discipline and responsibility",
    "A photo of person img upclose, facing camera, fierce expression, intense eyes, bold outfit, fiery background colors, sense of urgency and strength",
    "A photo of person img upclose, facing camera, young and vulnerable, sad eyes, child-like clothing, sitting alone, muted background colors, sense of isolation and longing for care and acceptance"
]

def call_replicate(prompt, input_image_url):
    output = replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        input={
            "prompt": prompt,
            "num_steps": 40,
            "style_name": "Photographic (Default)",
            "input_image": input_image_url,
            "num_outputs": 1,
            "guidance_scale": 5,
            "negative_prompt": "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
            "style_strength_ratio": 20
        }
    )
    return output

def execute_api_calls_concurrently():
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Submit tasks to the executor to call replicate.run concurrently
        futures = [executor.submit(call_replicate, prompt, input_image_url) for prompt in prompts]

        # Collect results as they are completed
        results = [future.result() for future in concurrent.futures.as_completed(futures)]

    return results

def main():
    # Trigger API calls and get responses
    responses = execute_api_calls_concurrently()

    response_list = []
    # Print the responses
    for response in responses:
        response_list.append(response)
        print(response)

    # Combine the responses into one JSON object
    combined_response = json.dumps({
        "response_1": response_list[0],
        "response_2": response_list[1],
        "response_3": response_list[2]
    })

    # Print the combined JSON object
    print(combined_response)

if __name__ == '__main__':
  main()
