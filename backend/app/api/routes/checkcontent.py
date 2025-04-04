from fastapi import APIRouter, Depends, Request, HTTPException
from api.dependencies import check_key
from pydantic import BaseModel
import re
import torch


router = APIRouter()


class EmailContents(BaseModel):
    email_contents: str


def clean_text(text):
    # Remove non-ASCII characters
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text


@router.post("/checkcontents",
            dependencies=[Depends(check_key)]
            )
async def check_contents(
        request: Request,
        input_data: EmailContents,
):
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Server error: try again later")

    content = clean_text(input_data.email_contents)

    if content is None:
        raise HTTPException(status_code=400, detail="Missing email content")

    tokenized_input = tokenizer(content, padding="max_length", truncation=True, max_length=512, return_tensors="pt")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = tokenized_input
    inputs = {key: val.to(device) for key, val in inputs.items()}

    model.eval()
    with torch.no_grad():
        outputs = model(**inputs)

    prediction = torch.argmax(outputs.logits, dim=1).item()
    result = "Phishing" if prediction == 1 else "Safe"

    return {"response": result}