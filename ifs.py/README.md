# Flask API

```sh
. .venv/bin/activate

flask run --debug

curl --location --request POST 'http://127.0.0.1:5000/create_talk' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'image_url=https://images.generated.photos/96rFpeEfKms51LK-Re3qlY8kk_q0pNVB7vC9BYcjfyo/rs:fit:256:256/czM6Ly9pY29uczgu/Z3Bob3Rvcy1wcm9k/LnBob3Rvcy92M18w/MDczMjE2LmpwZw.jpg' \
--data-urlencode 'text=This is an example string of text to be replaced!'
```