.venv: requirements.in
	python3 -m venv --clear .venv
	.venv/bin/pip install pip-tools
	.venv/bin/pip-compile requirements.in --generate-hashes
	.venv/bin/pip install -r requirements.txt

.PHONY: dev
dev: .venv
	.venv/bin/flask run --debug

.PHONY: clean
clean:
	rm -rf .venv

