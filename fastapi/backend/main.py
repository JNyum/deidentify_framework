from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from gliner import GLiNER
import re
from datetime import datetime, timedelta
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = GLiNER.from_pretrained("urchade/gliner_base")

class SaveRequest(BaseModel):
    text: str
    filename: str

class NoiseRequest(BaseModel):
    text: str
    level: int = 1

class DateTarget:
    def __init__(self, date_str: str):
        self.raw = date_str.strip()
        self.type = None
        self.year = None
        self.month = None
        self.day = None
        self._parse()

    def _parse(self):
        patterns = {
            "type1": r"\[DATE\](\d{4})[-/.](\d{1,2})[-/.](\d{1,2})",
            "type2": r"\[DATE\](\d{1,2})[-/.](\d{1,2})",
            "type3": r"\[DATE\](\d{2})년(\d{1,2})월(\d{1,2})일",
            "type4": r"\[DATE\](\d{4})년(\d{1,2})월(\d{1,2})일",
        }
        for t, pattern in patterns.items():
            match = re.search(pattern, self.raw)
            if match:
                parts = list(map(int, match.groups()))
                if t == "type1":
                    self.type = "type1"
                    self.year, self.month, self.day = parts
                    return
                if t == "type2":
                    self.type = "type2"
                    self.month, self.day = parts
                    self.year = 2000
                    return
                if t == "type3":
                    self.type = "type3"
                    self.year, self.month, self.day = parts
                    self.year += 2000
                    return
                if t == "type4":
                    self.type = "type4"
                    self.year, self.month, self.day = parts
                    return
        raise ValueError(f"Unsupported date format: {self.raw}")

    def apply_offset(self, offset: int):
        try:
            base = datetime(self.year, self.month, self.day)
            new_date = base + timedelta(days=offset)
            self.year = new_date.year
            self.month = new_date.month
            self.day = new_date.day
        except Exception:
            pass

    def to_string(self):
        if self.type in ("type1", "type3", "type4"):
            return f"[DATE]{self.year:04}-{self.month:02}-{self.day:02}"
        else:
            return f"[DATE]{self.month:02}-{self.day:02}"

# @app.get("/load-file")
# async def load_file(index: int, type: str):
#     if type not in {"raw", "taged"}:
#         return JSONResponse(status_code=400, content={"error": "Invalid type"})
#     ### directory path ###
#     base_dir = f"../static/{type}_text"
#     filename = f"{index}_{type}.txt"
#     path = os.path.join(base_dir, filename)
#     noise_map = f"../static/noise_map.json"
#     try:
#         with open(path, "r", encoding="utf-8") as f:
#             return {"content": f.read()}
#     except FileNotFoundError:
#         return JSONResponse(status_code=404, content={"error": "File not found"})


@app.get("/load-file")
async def load_file(index: int, type: str):
    if type not in {"raw", "taged"}:
        return JSONResponse(status_code=400, content={"error": "Invalid type"})

    base_dir = f"../static/{type}_text"
    filename = f"{index}_{type}.txt"
    path = os.path.join(base_dir, filename)
    noise_map_path = "../static/noise_map.json"

    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # noise map 읽기
        noise = 0
        if os.path.exists(noise_map_path):
            with open(noise_map_path, "r", encoding="utf-8") as nf:
                noise_dict = json.load(nf)
                noise = noise_dict.get(str(index), 0)

        return {"content": content, "noise": noise}

    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"error": "File not found"})

@app.post("/add-noise")
async def add_noise(req: NoiseRequest):
    lines = req.text.split("\n")
    processed = []
    for line in lines:
        new_line = line
        matches = re.findall(r"\[DATE\][\d년월일\-./]+", line)
        for m in matches:
            try:
                dt = DateTarget(m)
                dt.apply_offset(req.level)
                new_line = new_line.replace(m, dt.to_string())
            except Exception:
                continue
        processed.append(new_line)
    return JSONResponse(content={"noised": "\n".join(processed)})

@app.post("/save")
async def save_text(data: SaveRequest):
    ## save path ##
    save_path = f"../static/noised/{data.filename}_noised.txt"
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(data.text)
    return {"status": "saved", "saved_as": save_path}
