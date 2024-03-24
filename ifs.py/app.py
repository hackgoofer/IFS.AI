from flask import Flask, request
from markupsafe import escape
import requests, json, jsonify, time
import os
from dotenv import load_dotenv
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from openai import OpenAI

load_dotenv()

grok = os.getenv("GROK_ENV")
client = OpenAI()
mistral_model = "mistral-large-latest"
mistral_client = MistralClient(api_key=os.getenv("MISTRAL_API_KEY"))

# flask cors:
from flask_cors import CORS

# Create the Flask app
app = Flask(__name__)

# Enable CORS
CORS(app, resources={r'/*': {'origins': '*'}})

auth = "Bearer " + os.getenv("D_ID_API_KEY")

@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.get_json()
    prev_part = data.get('prev_part')
    history = data.get('history')
    user_message = data.get('user_message')

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

    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        max_tokens=300,
    )
    reply = response.choices[0].message.content
    responder = None
    if "firefighter" in reply:
        responder = "firefighter"
    elif "manager" in reply:
        responder = "manager"
    elif "exile" in reply:
        responder = "exile"

    # expects responder: exile|manager|firefighter
    # expects history: list of tuples (role, text)
    exile_system = "I respond as an Exile, I carry the deep questions and doubts about whether we're on the right path, questioning our pursuit of wealth and status. To the Manager, I might seem like a source of vulnerability or weakness, bringing up uncertainties and existential worries that challenge our direction. My relationship with the Firefighter is more synergistic; we both yearn for something beyond material success - a sense of purpose, happiness, and genuine connection. I feel somewhat protected by The Manager, who tries to keep these painful doubts at bay, but I also long for my voice to be heard and my concerns to be addressed, believing that our true path lies in answering these deeper questions. I am young and unsure. I need to tell the user about my unmet needs and work with them to come up with actionable items to help them feel better. Reply as an exile, reply with just text and talk about an exile's feelings a lot."
    manager_system = "As a Manager, I am always pushing for success. I feel like I'm constantly on the lookout, trying to protect us from feeling inadequate or not good enough. I set high goals and standards, like becoming a billionaire, because I believe that's what we need to feel secure and valued. However, I realize that in my efforts to manage our self-esteem and future, I sometimes overlook the deeper questions and needs that the Exile and the Firefighter bring up. I see them as vulnerabilities that might slow us down or divert us from our path. I am logical and mature. I need to tell the user about my unmet needs and work with them to come up with actionable items to help them feel better. Reply as a manager, reply with just text and talk about a manager's feelings a lot."
    firefighter_system = "As a firefighter, I often find myself in the middle of the Manager's ambitions and the Exile's doubts. I understand the Manager's drive and the protection it offers against feeling inadequate, but I also share the Exile's longing for deeper meaning and fulfillment in life. My role feels like a response to the pain and vulnerability both of these parts bring to the surface. When the weight of our ambitions or the depth of our questions become too much, I step in, seeking love and validation to soothe our shared fears and discomfort. I act to distract or shield us from the pain of not meeting the Manager's high standards or the Exile's existential worries, believing that love and acceptance might fill the voids they expose."
    if responder == "exile":
        system = exile_system
    elif responder == "manager":
        system = manager_system
    elif responder == "firefighter":
        system = firefighter_system

    system += " Reply with less than three sentences."
    messages = [
        ChatMessage(role="system", content=system),
    ]
    for message in history:
        role = message.get('role')
        text = message.get('text')
        messages.append(ChatMessage(role=role, content=text))
    
    print(history)
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

