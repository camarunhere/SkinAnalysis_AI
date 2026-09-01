import base64
import io

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image, UnidentifiedImageError

from . import model_utils

app = FastAPI(title="SkinAnalysis AI — ML Service")

MODEL_LOADED = {"ok": False}


@app.on_event("startup")
def _load():
    try:
        model_utils.get_model()
        MODEL_LOADED["ok"] = True
    except Exception as e:  # keep the service up so /health reports the failure
        print(f"[ml] Failed to load model: {e}")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": MODEL_LOADED["ok"]}


@app.get("/metadata")
def metadata():
    return {
        "model": "Tanishq77/skin-condition-classifier (EfficientNetV2B0)",
        "source": "https://huggingface.co/Tanishq77/skin-condition-classifier",
        "license": "MIT",
        "classes": model_utils.CLASSES,
        "reported_test_accuracy": 0.956,
        "explainability": "Grad-CAM (gradient-weighted class activation mapping) on the top_activation layer",
    }


class AnalyzeRequest(BaseModel):
    image_base64: str


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        raw = base64.b64decode(req.image_base64)
        image = Image.open(io.BytesIO(raw))
        image.load()
    except (UnidentifiedImageError, base64.binascii.Error, ValueError):
        raise HTTPException(status_code=422, detail="Uploaded file is not a valid image.")

    try:
        return model_utils.analyze(image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
