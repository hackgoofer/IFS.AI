from flask import Flask, request
from markupsafe import escape
import requests, json, jsonify, time


app = Flask(__name__)

auth = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJnb29nbGUtb2F1dGgyIiwiaHR0cHM6Ly9kLWlkLmNvbS9pc19uZXciOmZhbHNlLCJodHRwczovL2QtaWQuY29tL2FwaV9rZXlfbW9kaWZpZWRfYXQiOiIyMDI0LTAzLTIzVDIwOjEyOjA4LjA2MVoiLCJodHRwczovL2QtaWQuY29tL29yZ19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vYXBwc192aXNpdGVkIjpbIlN0dWRpbyJdLCJodHRwczovL2QtaWQuY29tL2N4X2xvZ2ljX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jcmVhdGlvbl90aW1lc3RhbXAiOiIyMDI0LTAzLTIzVDIwOjExOjM5Ljg5MVoiLCJodHRwczovL2QtaWQuY29tL2FwaV9nYXRld2F5X2tleV9pZCI6InczNzUzbTlxd2kiLCJodHRwczovL2QtaWQuY29tL3VzYWdlX2lkZW50aWZpZXJfa2V5IjoiUXJnNDRnTS1OMUNucENPRG5kV2NnIiwiaHR0cHM6Ly9kLWlkLmNvbS9oYXNoX2tleSI6IkNyNW00SWF1c2hhQnlsbXFUUkhmeSIsImh0dHBzOi8vZC1pZC5jb20vcHJpbWFyeSI6dHJ1ZSwiaHR0cHM6Ly9kLWlkLmNvbS9lbWFpbCI6InRyYXZpcy5jbGluZUBnbWFpbC5jb20iLCJodHRwczovL2QtaWQuY29tL3BheW1lbnRfcHJvdmlkZXIiOiJzdHJpcGUiLCJpc3MiOiJodHRwczovL2F1dGguZC1pZC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDY5NDk4NDU4NzI1MjI2NTcyOTAiLCJhdWQiOlsiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3MTEyMjc1NjYsImV4cCI6MTcxMTMxMzk2Niwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCByZWFkOmN1cnJlbnRfdXNlciB1cGRhdGU6Y3VycmVudF91c2VyX21ldGFkYXRhIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiR3pyTkkxT3JlOUZNM0VlRFJmM20zejNUU3cwSmxSWXEifQ.VaY9DtYkR2QWCvxMh1D2n4hBO-92_ejK1Khen40Iw9QxeOhrbvvETVWgwVVIxJuv1P3nj2rCB_itkd1Wb3Lczy94V93QoA0MZnYivVGv9LaTLjehLYNGpJCF4KniAYYn-7bTbM8qDMEt7U3nbtdku3ohBe1cXh_31FeLiTjuY4RTe08fXaMWM1rjipgFuogU0wu-ra4q_ZMeJR19zE3KcMJzy7PW99A_zrsl5iDq2HA_uLUBB1kAxp31b4cCeKfKNphEzija8vQrQ4ZaI8z8SmRKmoq7u3JpsAh696cVCGDymw5o_N6WCvzFQiuzUCzUP68vWEHwyonAuLLTuFV7dg"


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

    payload = {
        "script": {
            "type": "text",
            "subtitles": "false",
            "provider": {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural"
            },
            "input": request.form['text']
        },
        "config": {
            "fluent": "false",
            "pad_audio": "0.0"
        },
        "source_url": request.form['image_url']
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": auth
    }

    response = requests.post(url, json=payload, headers=headers)

    talk_id = json.loads(response.text)['id']

    while talk_ready(talk_id) == False:
        time.sleep(1)

    return get_talk(talk_id)

