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

auth = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJnb29nbGUtb2F1dGgyIiwiaHR0cHM6Ly9kLWlkLmNvbS9pc19uZXciOmZhbHNlLCJodHRwczovL2QtaWQuY29tL2FwaV9rZXlfbW9kaWZpZWRfYXQiOiIyMDI0LTAzLTIzVDIwOjEyOjA4LjA2MVoiLCJodHRwczovL2QtaWQuY29tL29yZ19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vYXBwc192aXNpdGVkIjpbIlN0dWRpbyJdLCJodHRwczovL2QtaWQuY29tL2N4X2xvZ2ljX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jcmVhdGlvbl90aW1lc3RhbXAiOiIyMDI0LTAzLTIzVDIwOjExOjM5Ljg5MVoiLCJodHRwczovL2QtaWQuY29tL2FwaV9nYXRld2F5X2tleV9pZCI6InczNzUzbTlxd2kiLCJodHRwczovL2QtaWQuY29tL3VzYWdlX2lkZW50aWZpZXJfa2V5IjoiUXJnNDRnTS1OMUNucENPRG5kV2NnIiwiaHR0cHM6Ly9kLWlkLmNvbS9oYXNoX2tleSI6IkNyNW00SWF1c2hhQnlsbXFUUkhmeSIsImh0dHBzOi8vZC1pZC5jb20vcHJpbWFyeSI6dHJ1ZSwiaHR0cHM6Ly9kLWlkLmNvbS9lbWFpbCI6InRyYXZpcy5jbGluZUBnbWFpbC5jb20iLCJodHRwczovL2QtaWQuY29tL3BheW1lbnRfcHJvdmlkZXIiOiJzdHJpcGUiLCJpc3MiOiJodHRwczovL2F1dGguZC1pZC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDY5NDk4NDU4NzI1MjI2NTcyOTAiLCJhdWQiOlsiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3MTEyMjc1NjYsImV4cCI6MTcxMTMxMzk2Niwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCByZWFkOmN1cnJlbnRfdXNlciB1cGRhdGU6Y3VycmVudF91c2VyX21ldGFkYXRhIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiR3pyTkkxT3JlOUZNM0VlRFJmM20zejNUU3cwSmxSWXEifQ.VaY9DtYkR2QWCvxMh1D2n4hBO-92_ejK1Khen40Iw9QxeOhrbvvETVWgwVVIxJuv1P3nj2rCB_itkd1Wb3Lczy94V93QoA0MZnYivVGv9LaTLjehLYNGpJCF4KniAYYn-7bTbM8qDMEt7U3nbtdku3ohBe1cXh_31FeLiTjuY4RTe08fXaMWM1rjipgFuogU0wu-ra4q_ZMeJR19zE3KcMJzy7PW99A_zrsl5iDq2HA_uLUBB1kAxp31b4cCeKfKNphEzija8vQrQ4ZaI8z8SmRKmoq7u3JpsAh696cVCGDymw5o_N6WCvzFQiuzUCzUP68vWEHwyonAuLLTuFV7dg"

@app.route('/get_responder', methods=['POST'])
def get_responder():
    data = request.get_json()
    prev_part = data.get('prev_part')
    user_message = data.get('user_message')

    messages = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": f"You help decide which part should respond the the users' question, only reply with one of three options: firefighter, manager, or exile. The user should continue to talk to the same part if no context switch is provided.",
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
        model="gpt-4-1106-preview",
        messages=messages,
        max_tokens=300,
    )
    reply = response.choices[0].message.content
    if "firefighter" in reply:
        return "firefighter"
    elif "manager" in reply:
        return "manager"
    elif "exile" in reply:
        return "exile"

@app.route('/get_response', methods=['POST'])
def get_response():
    # expects responder: exile|manager|firefighter
    # expects history: list of tuples (role, text)
    exile_system = "I respond as an Exile, I carry the deep questions and doubts about whether we're on the right path, questioning our pursuit of wealth and status. To the Manager, I might seem like a source of vulnerability or weakness, bringing up uncertainties and existential worries that challenge our direction. My relationship with the Firefighter is more synergistic; we both yearn for something beyond material success - a sense of purpose, happiness, and genuine connection. I feel somewhat protected by The Manager, who tries to keep these painful doubts at bay, but I also long for my voice to be heard and my concerns to be addressed, believing that our true path lies in answering these deeper questions. I am young and unsure. I need to tell the user about my unmet needs and work with them to come up with actionable items to help them feel better. Reply as an exile, reply with just text and talk about an exile's feelings a lot."
    manager_system = "As a Manager, I am always pushing for success. I feel like I'm constantly on the lookout, trying to protect us from feeling inadequate or not good enough. I set high goals and standards, like becoming a billionaire, because I believe that's what we need to feel secure and valued. However, I realize that in my efforts to manage our self-esteem and future, I sometimes overlook the deeper questions and needs that the Exile and the Firefighter bring up. I see them as vulnerabilities that might slow us down or divert us from our path. I am logical and mature. I need to tell the user about my unmet needs and work with them to come up with actionable items to help them feel better. Reply as a manager, reply with just text and talk about a manager's feelings a lot."
    firefighter_system = "As a firefighter, I often find myself in the middle of the Manager's ambitions and the Exile's doubts. I understand the Manager's drive and the protection it offers against feeling inadequate, but I also share the Exile's longing for deeper meaning and fulfillment in life. My role feels like a response to the pain and vulnerability both of these parts bring to the surface. When the weight of our ambitions or the depth of our questions become too much, I step in, seeking love and validation to soothe our shared fears and discomfort. I act to distract or shield us from the pain of not meeting the Manager's high standards or the Exile's existential worries, believing that love and acceptance might fill the voids they expose."
    data = request.get_json()
    responder = data.get('responder')
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
    history = data.get('history')
    for message in history:
        role, text = message
        messages.append(ChatMessage(role=role, content=text))
    chat_response = client.chat(
        model=mistral_model,
        messages=messages,
    )
    return chat_response.choices[0].message.content

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

