# Flask API

```sh
. .venv/bin/activate

flask run --debug

curl --location --request POST 'http://127.0.0.1:5000/create_talk' \
--header 'Content-Type: application/json' \
--data-raw '{
    "image_url": "https://replicate.delivery/pbxt/UWXPfBHHc5X1EC3ZuS7YfBaWKzz6xkxmJ6RSbUNbiHa0IhjSA/image_0.png",
    "text": "This is an example string of text to be replaced!"
}'
```

### New requirements

Add new requirements to the `requirements.in` file and run the following command to update the `requirements.txt` file:

```sh
make .venv
```
