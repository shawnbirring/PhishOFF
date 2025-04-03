FROM nvidia/cuda:12.4.1-devel-ubuntu22.04


WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    python3-venv

ENV VIRT_ENV=/opt/venv
RUN python3 -m venv $VIRT_ENV
ENV PATH="$VIRT_ENV/bin:$PATH"

RUN pip3 install torch torchvision torchaudio transformers bitsandbytes accelerate packaging ninja wheel
RUN pip3 install flash-attn --no-build-isolation

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app

COPY .env /app/.env

VOLUME /model

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]