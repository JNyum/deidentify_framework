import { useState } from "react";
import {
  Editor,
  EditorState,
  CompositeDecorator,
  ContentBlock,
  ContentState,
} from "draft-js";
import "draft-js/dist/Draft.css";

const tagRegex = /\[(DATE|NAME)\]/g;

function findWithRegex(regex: RegExp, contentBlock: ContentBlock, callback: any) {
  const text = contentBlock.getText();
  let matchArr, start;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
}

const TagHighlight = (props: any) => (
  <span className="highlight-tag">{props.children}</span>
);

const decorator = new CompositeDecorator([
  {
    strategy: (block, callback) => findWithRegex(tagRegex, block, callback),
    component: TagHighlight,
  },
]);

export default function DateMarker() {
  const [index, setIndex] = useState(0);
  const [rawEditor, setRawEditor] = useState(() => EditorState.createEmpty(decorator));
  const [tagedEditor, setTagedEditor] = useState(() => EditorState.createEmpty(decorator));
  const [noisedEditor, setNoisedEditor] = useState(() => EditorState.createEmpty(decorator));
  const [fileName, setFileName] = useState("output");
  const [noiseValue, setNoiseValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadText = async () => {
    setLoading(true);
    try {
      const rawRes = await fetch(`http://localhost:8000/load-file?index=${index}&type=raw`);
      const tagedRes = await fetch(`http://localhost:8000/load-file?index=${index}&type=taged`);
      const rawData = await rawRes.json();
      const tagedData = await tagedRes.json();

      setFileName(`${index}`);
      setNoiseValue(tagedData.noise ?? null);

      setRawEditor(EditorState.createWithContent(ContentState.createFromText(rawData.content || ""), decorator));
      setTagedEditor(EditorState.createWithContent(ContentState.createFromText(tagedData.content || ""), decorator));
      setNoisedEditor(EditorState.createEmpty(decorator));
    } catch (err) {
      alert("불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    const content = noisedEditor.getCurrentContent().getPlainText();
    await fetch("http://localhost:8000/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content, filename: fileName }),
    });
    alert("저장 완료!");
  };

  const download = () => {
    const content = noisedEditor.getCurrentContent().getPlainText();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_tag.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addNoise = async () => {
    if (noiseValue === null) {
      alert("노이즈 정보가 없습니다.");
      return;
    }
    setLoading(true);
    const content = tagedEditor.getCurrentContent().getPlainText();
    const res = await fetch("http://localhost:8000/add-noise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content, level: noiseValue }),
    });
    const data = await res.json();
    const noisedState = ContentState.createFromText(data.noised);
    setNoisedEditor(EditorState.createWithContent(noisedState, decorator));
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(255,255,255,0.6)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
        }}>
          <div className="loader" />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <label>
          인덱스:
          <input
            type="number"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            min={0}
            style={{ width: 50, marginLeft: 5 }}
            disabled={loading}
          />
        </label>
        <button onClick={loadText} disabled={loading}>불러오기</button>
        <button onClick={save} disabled={loading}>저장</button>
        <button onClick={download} disabled={loading}>다운로드</button>
        <button onClick={addNoise} disabled={loading || noiseValue === null}>노이즈 추가</button>
        {noiseValue !== null && (
          <span style={{ marginLeft: 10, fontSize: 14, color: "#666" }}>
            적용 noise: {noiseValue}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {["원본", "태깅", "노이즈"].map((label, idx) => (
          <div key={idx} style={{ flex: 1 }}>
            <h3>{label}</h3>
            <div style={{ border: "1px solid #ccc", minHeight: 300, padding: 10 }}>
              <Editor
                editorState={[rawEditor, tagedEditor, noisedEditor][idx]}
                onChange={[setRawEditor, setTagedEditor, setNoisedEditor][idx]}
                placeholder={`${label} 텍스트`}
              />
            </div>
          </div>
        ))}
      </div>

      <style>
        {`
        .loader {
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        .highlight-tag {
          color: red;
          font-weight: bold;
          font-size: 14px;
          font-family: monospace;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
}
