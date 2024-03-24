# This is the main file for the Flask app. It contains the routes for the API.
from flask import Flask, request
from markupsafe import escape
import requests, json, jsonify, time
import os
from dotenv import load_dotenv
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from openai import OpenAI
from pydantic import BaseModel, Field, validator
from parts import IFSParts
import instructor

load_dotenv()

groq = os.getenv("GROQ_ENV")
instructor_client = instructor.patch(
    OpenAI(
        # This is the default and can be omitted
        api_key=os.getenv("OPENAI_API_KEY"),
    )
)
mistral_model = "mistral-large-latest"
mistral_client = MistralClient(api_key=os.getenv("MISTRAL_API_KEY"))
# flask cors:
from flask_cors import CORS

# Create the Flask app
app = Flask(__name__)

# Enable CORS
CORS(app, resources={r'/*': {'origins': '*'}})

D_ID_API_KEY = os.getenv("D_ID_API_KEY")
if D_ID_API_KEY is None:
    raise Exception("D_ID_API_KEY not found in environment")
auth = "Bearer " + D_ID_API_KEY


# To test this:
# curl -X POST http://127.0.0.1:5000/get_system_prompts -H "Content-Type: application/json" -d '{"user_message": "I have a feeling of inadequacy. Are we building the right thing? Are we going to be billionaires in the next 12 months, is this what I want? Is this what makes me happy? Will I find love, why?"}'
@app.route('/get_system_prompts', methods=['POST'])
def get_system_prompts():
    data = request.get_json()
    user_message = data.get('user_message')

    system_prompt = f"""
Take the user message {user_message}, and create a list of IFS parts: Firefighter, Manager and Exile. Use first person to describe the different parts' personality, talk about their feelings including their shames and fear and unmet needs. Use details provided by the user.

Managers: Parts that try to keep the person safe and in control by managing their interactions and experiences. In personalities, describe how I keep the person safe and in control.
Exiles: Vulnerable parts that carry pain, trauma, and intense emotions, often pushed away or suppressed by other parts. In personalities, describe the pain, trauma and intense emotions I have.
Firefighters: Parts that act out to distract or numb the pain of the exiles, often through impulsive or destructive behaviors. In personalities, describe how I act out to distract or numb the pain of the exiles.
"""
# example: 
# parts=[IFSPart(name=<PartName.MANAGER: 'Manager'>, personality="As a Manager in this situation, I feel a sense of duty and responsibility. I am constantly questioning if we're doing the right thing and whether our venture will yield the desired results in a short span. The need for surety causes additional stress and anxiety, driving me to closely scrutinize and control every aspect of our plan. My unmet needs revolve around certainty, success, and validation.", unmet_needs=['certainty', 'success', 'validation']), IFSPart(name=<PartName.EXILE: 'Exile'>, personality='As an Exile, I carry the heavy burdens of self-doubt and feelings of inadequacy. I question if this is the life I truly want and if these achievements will bring me happiness. My inner turbulence intensifies when thinking about love and why it seems elusive to me. I am the receptacle of unvoiced sadness and yearning, often suppressed to maintain an outward impression of confidence. The love I seek remains a poignant reminder of unmet needs for companionship, contentment, and self-acceptance.', unmet_needs=['companionship', 'contentment', 'self-acceptance']), IFSPart(name=<PartName.FIREFIGHTER: 'Firefighter'>, personality="As a Firefighter, I react to these feelings of insecurity and uncertainty by pushing towards ambitious goals like becoming a billionaire in 12 months. My approach can be seen as impulsive or even reckless, as it's driven more by a need to numb the deep-seated feelings of inadequacy than by a solid plan. This relentless drive serves to distract from the lingering questions about what truly brings happiness and fulfillment. My unmet needs are focused on fulfillment, validation, and a sense of worth.", unmet_needs=['fulfillment', 'validation', 'sense of worth'])]

    retry_count = 0
    while retry_count < 3:
        try:
            result = instructor_client.chat.completions.create(
                model="gpt-4",
                response_model=IFSParts,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ]
            )
            print(result)
            return result.json()
        except Exception as e:
            print(f"Attempt {retry_count+1} failed with error: {e}")
            retry_count += 1
            time.sleep(1)  # wait for a second before retrying

@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.get_json()
    prev_part = data.get('prev_part')
    history = data.get('history')
    user_message = data.get('user_message')
    exile_system_default = "I respond as an Exile, I carry the deep questions and doubts about whether we're on the right path, questioning our pursuit of wealth and status. To the Manager, I might seem like a source of vulnerability or weakness, bringing up uncertainties and existential worries that challenge our direction. My relationship with the Firefighter is more synergistic; we both yearn for something beyond material success - a sense of purpose, happiness, and genuine connection. I feel somewhat protected by The Manager, who tries to keep these painful doubts at bay, but I also long for my voice to be heard and my concerns to be addressed, believing that our true path lies in answering these deeper questions. I am young and unsure. I need to tell the user about my unmet needs and work with them to come up with actionable items to help them feel better. Reply as an exile, reply with just text and talk about an exile's feelings a lot."
    manager_system_default = "As a Manager, I am always pushing for success. I feel like I'm constantly on the lookout, trying to protect us from feeling inadequate or not good enough. I set high goals and standards, like becoming a billionaire, because I believe that's what we need to feel secure and valued. However, I realize that in my efforts to manage our self-esteem and future, I sometimes overlook the deeper questions and needs that the Exile and the Firefighter bring up. I see them as vulnerabilities that might slow us down or divert us from our path. I am logical and mature. I need to tell the user about my unmet needs and work with them to come up with actionable items to help them feel better. Reply as a manager, reply with just text and talk about a manager's feelings a lot."
    firefighter_system_default = "As a firefighter, I respond to the pain and vulnerability the Manager and the Exile bring to the surface. When the weight of our ambitions or the depth of our questions become too much, I step in, seeking love and validation to soothe our shared fears and discomfort. I act to distract or shield us from the pain of not meeting the Manager's high standards or the Exile's existential worries, believing that love and acceptance might fill the voids they expose."
    
    firefighter_system = data.get('firefighter_system', firefighter_system_default)
    manager_system = data.get('manager_system', manager_system_default)
    exile_system = data.get('exile_system', exile_system_default)

    messages = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": f"You help decide which part should respond the the users' question, only reply with one of three options: firefighter, manager, or exile. The user should continue to talk to the same part if no context switch is provided. If prev_part is none, pick the best one to respond as.",
                },
            ],
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"The user is previously conversing with: {prev_part}. The user's message is: {user_message}. Who should be the next responder? Only reply with the part name, one of firefighter, manager or exile.",
                },
            ],
        },
    ]

    response = openapi_client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        max_tokens=300,
    )
    reply = response.choices[0].message.content
    responder = None
    if "firefighter" in reply:
        responder = "firefighter"
        system = firefighter_system
    elif "manager" in reply:
        responder = "manager"
        system = manager_system
    elif "exile" in reply:
        responder = "exile"
        system = exile_system        

    system += f" Reply with less than three sentences in first person as a {responder}"
    messages = [
        ChatMessage(role="system", content=system),
    ]
    for message in history:
        role = message.get('role')
        text = message.get('text')
        messages.append(ChatMessage(role=role, content=text))
    
    chat_response = mistral_client.chat(
        model=mistral_model,
        messages=messages,
    )
    return {"role": "assistant", "text": chat_response.choices[0].message.content, "responder": responder}

def talk_ready(talk_id):
    url = "https://api.d-id.com/talks/" + talk_id

    headers = {
        "accept": "application/json",
        "authorization": auth
    }

    response = requests.get(url, headers=headers)

    content = json.loads(response.text)

    return False if content['status'] != 'done' else True


def get_talk(talk_id):

    url = "https://api.d-id.com/talks/" + talk_id

    headers = {
        "accept": "application/json",
        "authorization": auth
    }

    response = requests.get(url, headers=headers)

    content = json.loads(response.text)

    return content['result_url']


@app.route('/create_talk', methods=['POST'])
def create_talk():
    url = "https://api.d-id.com/talks"

    # parse body as json:
    request_payload = request.get_json()

    print("rpayload:", request_payload)
    payload = {
        "script": {
            "type": "text",
            "subtitles": "false",
            "provider": {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural"
            },
            "input": request_payload.get('text'),
        },
        "config": {
            "fluent": "false",
            "pad_audio": "0.0"
        },
        "source_url": request_payload.get('image_url'),
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": auth
    }

    response = requests.post(url, json=payload, headers=headers)

    print(response.text)
    talk_id = json.loads(response.text)['id']

    while talk_ready(talk_id) == False:
        time.sleep(1)

    return get_talk(talk_id)

