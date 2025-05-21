from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from fastapi.responses import JSONResponse
# from gliner import GLiNER
import re
from datetime import datetime, timedelta
import os
import json
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# model = GLiNER.from_pretrained("urchade/gliner_base")

class SaveRequest(BaseModel):
    text: str
    filename: str

class NoiseRequestV2(BaseModel):
    rows: List[dict]
    columns: List[str]
    level: int

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
            "type2": r"\[DATE\](\d{2})[-/.](\d{1,2})[-/.](\d{1,2})",
            "type3": r"\[DATE\](\d{1,2})[-/.](\d{1,2})",
            "type4": r"\[DATE\](\d{2})년(\d{1,2})월(\d{1,2})일",
            "type5": r"\[DATE\](\d{4})년(\d{1,2})월(\d{1,2})일",
        }
        for t, pattern in patterns.items():
            match = re.search(pattern, self.raw)
            if match:
                parts = list(map(int, match.groups()))
                if t == "type1":
                    self.type = "type1"
                    self.year, self.month, self.day = parts
                    return
                elif t == "type3":
                    self.type = "type3"
                    self.month, self.day = parts
                    self.year = 2000
                    return
                elif t == "type4" or t == "type2":
                    self.type = "type4"
                    self.year, self.month, self.day = parts
                    self.year += 2000
                    return
                elif t == "type5":
                    self.type = "type5"
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
        if self.type in ("type1", "type4", "type5"):
            return f"[DATE]{self.year:04}-{self.month:02}-{self.day:02}"
        else:
            return f"[DATE]{self.month:02}-{self.day:02}"

def apply_noise_to_text(text: str, offset: int) -> str:
    matches = re.findall(r"\[DATE\][\d년월일\-./]+", text)
    for m in matches:
        try:
            dt = DateTarget(m)
            dt.apply_offset(offset)
            text = text.replace(m, dt.to_string())
        except:
            continue
    return text

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
async def load_file(index: int, type: str = "raw"):
    path = f"../static/{index}.csv"  # 파일 경로
    noise_map_path = "../static/noise_map.json"

    try:
        content = pd.read_csv(path)
        noise = 0
        if os.path.exists(noise_map_path):
            with open(noise_map_path, "r", encoding="utf-8") as nf:
                noise_dict = json.load(nf)
                noise = noise_dict.get(str(index), 0)

        return {
            "columns": content.columns.tolist(),
            "rows": content.fillna("").to_dict(orient="records"),
            "noise": noise
        }

    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"error": "File not found"})

@app.post("/add-noise-df")
async def add_noise_df(req: NoiseRequestV2):
    df = pd.DataFrame(req.rows)

    for col in req.columns:
        if col in df.columns:
            # ✅ 무조건 noised 컬럼으로 만듦
            df["noised"] = df[col].astype(str).apply(lambda x: apply_noise_to_text(x, req.level))

    return {"rows": df.to_dict(orient="records")}



@app.post("/save")
async def save_text(data: SaveRequest):
    ## save path ##
    save_path = f"../static/noised/{data.filename}_noised.txt"
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(data.text)
    return {"status": "saved", "saved_as": save_path}

######################################################################################3
