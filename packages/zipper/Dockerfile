# ---- Base Stage ----
FROM python:3.11-slim AS base

WORKDIR /usr/lib/app
COPY requirements.txt ./requirements.txt

RUN apt-get update \
    && apt-get install -y gcc build-essential libpq-dev

RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir dumb-init

COPY . .
ENV PYTHONPATH=./
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
CMD [ "python", "main.py", "config.yaml"]

EXPOSE 4000