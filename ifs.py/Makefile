.venv: requirements.txt
	python3 -m venv .venv
	.venv/bin/pip install -r requirements.txt

.PHONY: dev
dev: .venv
	.venv/bin/flask run --debug

.PHONY: clean
clean:
	rm -rf .venv
