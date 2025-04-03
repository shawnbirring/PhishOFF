from contextlib import asynccontextmanager
from transformers import DistilBertForSequenceClassification, DistilBertTokenizer
import torch
import os
from dotenv import load_dotenv

load_dotenv()
model_path = os.getenv("MODEL_PATH")


def load_model(model_location):
    if torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"

    print("Device: " + device)

    model = DistilBertForSequenceClassification.from_pretrained(
        model_location,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        attn_implementation="flash_attention_2"
    ).to(device)

    tokenizer = DistilBertTokenizer.from_pretrained(model_location)
    return model, tokenizer


@asynccontextmanager
async def model_lifespan(app):
    model, tokenizer = load_model(model_path)
    app.state.model = model
    app.state.tokenizer = tokenizer
    try:
        yield
    finally:
        del model
        del tokenizer
        app.state.model = None
        app.state.tokenizer = None
        torch.cuda.empty_cache()
