// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import { createEditor, Descendant, Node, Text } from 'slate';
// import { Slate, Editable, withReact } from 'slate-react';

// // 커스텀 타입 정의
// type CustomText = {
//   text: string;
//   isTag?: boolean;
// };

// type CustomElement = {
//   type: 'paragraph';
//   children: CustomText[];
// };

// // 태그 정규식 - 한 번만 생성
// const TAG_REGEX = /\[(DATE|NAME|ADDRESS)\]/g;

// // 빈 슬레이트 값 (초기화에 사용)
// const EMPTY_SLATE_VALUE: Descendant[] = [
//   {
//     type: 'paragraph',
//     children: [{ text: '' }],
//   },
// ];

// // 텍스트를 Slate 문서 구조로 변환하는 함수
// const createSlateValue = (text: string): Descendant[] => {
//   const textParts: CustomText[] = [];
//   let lastIndex = 0;
//   let match;
  
//   // value 문자열을 순회하며 태그를 찾아 처리
//   text = text || ''; // 빈 문자열 처리
  
//   // 정규식 초기화
//   TAG_REGEX.lastIndex = 0;
  
//   while ((match = TAG_REGEX.exec(text)) !== null) {
//     // 태그 이전의 일반 텍스트 처리
//     if (match.index > lastIndex) {
//       textParts.push({
//         text: text.substring(lastIndex, match.index),
//       });
//     }
    
//     // 태그 처리
//     textParts.push({
//       text: match[0],
//       isTag: true,
//     });
    
//     lastIndex = match.index + match[0].length;
//   }
  
//   // 마지막 일반 텍스트 처리
//   if (lastIndex < text.length) {
//     textParts.push({
//       text: text.substring(lastIndex),
//     });
//   }
  
//   // 비어있는 경우 기본값 설정
//   if (textParts.length === 0) {
//     textParts.push({ text: '' });
//   }
  
//   return [
//     {
//       type: 'paragraph',
//       children: textParts,
//     }
//   ];
// };

// // 태그 감지 및 하이라이팅을 위한 컴포넌트
// const TagCell = React.memo(({
//   value,
//   onChange,
// }: {
//   value: string;
//   onChange: (newValue: string) => void;
// }) => {
//   // Slate 에디터 인스턴스 생성
//   const editor = useMemo(() => withReact(createEditor()), []);
  
//   // 초기 값 설정 - 항상 유효한 값이 설정되도록 함
//   const [slateValue, setSlateValue] = useState<Descendant[]>(() => 
//     createSlateValue(value || '')
//   );
  
//   // 에디터 내용이 변경될 때마다 호출되는 함수
//   const handleChange = useCallback((newValue: Descendant[]) => {
//     setSlateValue(newValue);
    
//     // Slate 문서를 일반 텍스트로 변환
//     const plainText = newValue
//       .map(n => Node.string(n))
//       .join('\n');
      
//     onChange(plainText);
//   }, [onChange]);
  
//   // value prop이 변경되면 Slate 값도 업데이트
//   useEffect(() => {
//     const currentText = slateValue.map(n => Node.string(n)).join('\n');
//     if (currentText !== value) {
//       setSlateValue(createSlateValue(value || ''));
//     }
//   }, [value]);
  
//   // 태그 강조를 위한 렌더링 함수
//   const renderLeaf = useCallback(({ attributes, children, leaf }: any) => {
//     return (
//       <span
//         {...attributes}
//         style={
//           leaf.isTag
//             ? { color: 'red', fontWeight: 'bold' }
//             : {}
//         }
//       >
//         {children}
//       </span>
//     );
//   }, []);
  
//   // 태그 감지를 위한 디코레이터 함수
//   const decorate = useCallback(([node, path]: any) => {
//     const ranges: any[] = [];
    
//     if (!Text.isText(node)) {
//       return ranges;
//     }
    
//     const text = node.text;
//     let match;
//     TAG_REGEX.lastIndex = 0; // 정규식 인덱스 초기화
    
//     // 태그 패턴 검색
//     while ((match = TAG_REGEX.exec(text)) !== null) {
//       ranges.push({
//         anchor: { path, offset: match.index },
//         focus: { path, offset: match.index + match[0].length },
//         isTag: true,
//       });
//     }
    
//     return ranges;
//   }, []);
  
//   // 반드시 유효한 슬레이트 값이 사용되도록 보장
//   const safeSlateValue = useMemo(() => {
//     if (!slateValue || !Array.isArray(slateValue) || slateValue.length === 0) {
//       return EMPTY_SLATE_VALUE;
//     }
//     return slateValue;
//   }, [slateValue]);
  
//   return (
//     <div
//       style={{
//         border: '1px solid #ccc',
//         padding: 6,
//         minHeight: 30,
//       }}
//     >
//       <Slate
//         editor={editor}
//         initialValue={safeSlateValue}
//         onChange={handleChange}
//       >
//         <Editable
//           decorate={decorate}
//           renderLeaf={renderLeaf}
//           style={{ whiteSpace: 'pre-wrap' }}
//         />
//       </Slate>
//     </div>
//   );
// });

// // 성능 향상을 위해 행 컴포넌트 분리
// const TableRow = React.memo(({ 
//   rowData, 
//   rowIdx, 
//   displayCols, 
//   onCellChange 
// }: { 
//   rowData: any; 
//   rowIdx: number; 
//   displayCols: string[]; 
//   onCellChange: (rowIdx: number, col: string, value: string) => void;
// }) => {
//   return (
//     <tr>
//       {displayCols.map((col) => (
//         <td key={`cell-${rowIdx}-${col}`} style={{ minWidth: 200 }}>
//           <TagCell
//             value={rowData[col] ?? ""}
//             onChange={(val) => onCellChange(rowIdx, col, val)}
//           />
//         </td>
//       ))}
//     </tr>
//   );
// });

// export default function DFViewer() {
//   const [allColumns, setAllColumns] = useState<string[]>([]);
//   const [selectedCols, setSelectedCols] = useState<string[]>([]);
//   const [columnOrder, setColumnOrder] = useState<string[]>([]);
//   const [rows, setRows] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);
//   const [noiseValue, setNoiseValue] = useState<number | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const tagColumn = "tag"; // ✅ 노이즈 적용 대상 컬럼 (고정)

//   const handleLoad = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       const res = await fetch(`http://localhost:8000/load-file?index=${index}&type=raw`);
//       if (!res.ok) {
//         throw new Error(`서버 응답 오류: ${res.status}`);
//       }
      
//       const data = await res.json();
//       if (!data.columns || !data.rows) {
//         alert("잘못된 데이터입니다.");
//         return;
//       }

//       // 컬럼 정보 설정
//       setAllColumns(data.columns);
//       setSelectedCols(data.columns);
//       // 컬럼 순서 저장 (원래 순서를 유지하기 위해)
//       setColumnOrder(data.columns);
      
//       setRows(data.rows);
//       setNoiseValue(data.noise ?? null);
//     } catch (error) {
//       console.error("데이터 로드 오류:", error);
//       alert("데이터를 불러오는 중 오류가 발생했습니다.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [index]);

//   const handleChange = useCallback((rowIdx: number, col: string, value: string) => {
//     setRows((prev) =>
//       prev.map((row, i) => (i === rowIdx ? { ...row, [col]: value } : row))
//     );
//   }, []);

//   const handleAddNoise = useCallback(async () => {
//     if (noiseValue === null) {
//       alert("노이즈 값이 없습니다.");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const res = await fetch("http://localhost:8000/add-noise-df", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           rows: rows,
//           columns: [tagColumn],
//           level: noiseValue,
//         }),
//       });

//       if (!res.ok) {
//         throw new Error(`서버 응답 오류: ${res.status}`);
//       }

//       const data = await res.json();
//       if (data.rows) {
//         // 새 데이터로 상태 업데이트
//         setRows(data.rows);
        
//         // noised 컬럼이 새로 추가된 경우 컬럼 목록에 추가
//         if (data.rows[0]?.hasOwnProperty('noised') && !allColumns.includes('noised')) {
//           setAllColumns(prev => [...prev, 'noised']);
//           // 컬럼 순서에도 추가
//           setColumnOrder(prev => [...prev, 'noised']);
//         }
        
//         alert(`노이즈 (+${noiseValue}) 적용 완료`);
//       } else {
//         alert("노이즈 적용 실패: 응답에 rows 데이터가 없습니다.");
//       }
//     } catch (error) {
//       console.error("노이즈 적용 오류:", error);
//       alert(`노이즈 적용 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [rows, noiseValue, allColumns, tagColumn]);

//   // 컬럼 선택 처리 함수 (원래 순서 유지)
//   const handleColumnToggle = useCallback((col: string, checked: boolean) => {
//     if (checked) {
//       // 컬럼을 추가할 때는 원래 순서대로 추가
//       setSelectedCols(prev => {
//         const newSelected = [...prev];
        
//         // 현재 선택된 컬럼들을 원래 순서대로 정렬하기 위해
//         // columnOrder에서의 순서에 맞게 새 컬럼 삽입
//         let inserted = false;
//         for (let i = 0; i < columnOrder.length; i++) {
//           const orderCol = columnOrder[i];
//           if (orderCol === col) {
//             // 추가하려는 컬럼 찾음
//             const insertIndex = newSelected.findIndex(sc => {
//               // 순서상 현재 컬럼보다 뒤에 있는 첫번째 컬럼의 인덱스 찾기
//               const orderIndex = columnOrder.indexOf(sc);
//               return orderIndex > i;
//             });
            
//             if (insertIndex === -1) {
//               // 끝에 추가
//               newSelected.push(col);
//             } else {
//               // 중간에 삽입
//               newSelected.splice(insertIndex, 0, col);
//             }
//             inserted = true;
//             break;
//           }
//         }
        
//         // 정렬된 목록에 없으면 끝에 추가
//         if (!inserted) {
//           newSelected.push(col);
//         }
        
//         return newSelected;
//       });
//     } else {
//       // 컬럼을 제거
//       setSelectedCols(prev => prev.filter(c => c !== col));
//     }
//   }, [columnOrder]);

//   // 표시할 컬럼 계산 (noised 컬럼 포함 확인)
//   const displayCols = useMemo(() => {
//     const cols = [...selectedCols];
    
//     // noised 컬럼이 존재하고, 선택되지 않았다면 추가
//     if (
//       rows.length > 0 && 
//       rows[0]?.hasOwnProperty('noised') && 
//       !cols.includes('noised')
//     ) {
//       // 원래 순서대로 추가
//       const noisedIndex = columnOrder.indexOf('noised');
//       if (noisedIndex !== -1) {
//         // 원래 순서에 있는 경우
//         const insertIndex = cols.findIndex(col => {
//           const colIndex = columnOrder.indexOf(col);
//           return colIndex > noisedIndex;
//         });
        
//         if (insertIndex === -1) {
//           cols.push('noised');
//         } else {
//           cols.splice(insertIndex, 0, 'noised');
//         }
//       } else {
//         // 순서 정보가 없으면 끝에 추가
//         cols.push('noised');
//       }
//     }
    
//     return cols;
//   }, [selectedCols, rows, columnOrder]);

//   // 데이터 청크로 분할하여 렌더링
//   const CHUNK_SIZE = 10000000; // 한 번에 렌더링할 행 수
//   const [visibleRows, setVisibleRows] = useState(CHUNK_SIZE);

//   // 더 많은 행 표시
//   const loadMoreRows = useCallback(() => {
//     setVisibleRows(prev => Math.min(prev + CHUNK_SIZE, rows.length));
//   }, [rows.length]);

//   // 스크롤 이벤트 처리
//   useEffect(() => {
//     const handleScroll = () => {
//       // 페이지 하단에 도달했는지 확인
//       if (
//         window.innerHeight + document.documentElement.scrollTop >= 
//         document.documentElement.offsetHeight - 100 &&
//         visibleRows < rows.length
//       ) {
//         loadMoreRows();
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [loadMoreRows, visibleRows, rows.length]);

//   // 행 데이터 로드될 때 초기 표시 행 리셋
//   useEffect(() => {
//     setVisibleRows(Math.min(CHUNK_SIZE, rows.length));
//   }, [rows]);

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>태그 및 날짜 노이즈</h2>

//       <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
//         <label>인덱스: </label>
//         <input
//           type="number"
//           value={index}
//           onChange={(e) => setIndex(Number(e.target.value))}
//           style={{ width: 60 }}
//         />
//         <button 
//           onClick={handleLoad} 
//           disabled={isLoading}
//         >
//           {isLoading ? '로딩 중...' : '불러오기'}
//         </button>
//       </div>

//       {allColumns.length > 0 && (
//         <div style={{ marginBottom: 15 }}>
//           <strong>컬럼 선택:</strong>
//           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 5 }}>
//             {columnOrder.map((col) => (
//               <label key={col} style={{ marginRight: 10 }}>
//                 <input
//                   type="checkbox"
//                   value={col}
//                   checked={selectedCols.includes(col)}
//                   onChange={(e) => handleColumnToggle(col, e.target.checked)}
//                 />
//                 {col}
//               </label>
//             ))}
//           </div>
//         </div>
//       )}

//       {noiseValue !== null && (
//         <div style={{ marginBottom: 15, color: "#666" }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             적용된 노이즈: <strong>+{noiseValue}일</strong>{" "}
//             <button 
//               onClick={handleAddNoise} 
//               disabled={isLoading}
//             >
//               {isLoading ? '처리 중...' : '노이즈 적용'}
//             </button>
//           </div>
//         </div>
//       )}

//       {rows.length > 0 ? (
//         <>
//           <div style={{ overflowX: 'auto' }}>
//             <table border={1} cellPadding={5} style={{ borderCollapse: "collapse" }}>
//               <thead>
//                 <tr>
//                   {displayCols.map((col) => (
//                     <th key={col}>{col}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.slice(0, visibleRows).map((row, rowIdx) => (
//                   <TableRow
//                     key={`row-${rowIdx}`}
//                     rowData={row}
//                     rowIdx={rowIdx}
//                     displayCols={displayCols}
//                     onCellChange={handleChange}
//                   />
//                 ))}
//               </tbody>
//             </table>
//           </div>
          
//           {visibleRows < rows.length && (
//             <div style={{ textAlign: 'center', margin: '15px 0' }}>
//               <button onClick={loadMoreRows}>
//                 더 보기 ({visibleRows}/{rows.length})
//               </button>
//             </div>
//           )}
//         </>
//       ) : (
//         <p>불러온 데이터가 없습니다.</p>
//       )}
//     </div>
//   );
// }

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createEditor, Descendant, Node, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';

// 커스텀 타입
type CustomText = {
  text: string;
  isTag?: boolean;
};
type CustomElement = {
  type: 'paragraph';
  children: CustomText[];
};

// 태그 정규식
const TAG_REGEX = /\[(DATE|NAME|ADDRESS)\]/g;
const EMPTY_SLATE_VALUE: Descendant[] = [
  { type: 'paragraph', children: [{ text: '' }] }
];

const createSlateValue = (text: string): Descendant[] => {
  const textParts: CustomText[] = [];
  let lastIndex = 0;
  let match;
  text = text || '';
  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      textParts.push({ text: text.substring(lastIndex, match.index) });
    }
    textParts.push({ text: match[0], isTag: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    textParts.push({ text: text.substring(lastIndex) });
  }

  if (textParts.length === 0) {
    textParts.push({ text: '' });
  }

  return [{ type: 'paragraph', children: textParts }];
};

const TagCell = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [slateValue, setSlateValue] = useState<Descendant[]>(() => createSlateValue(value || ''));

  const handleChange = useCallback((newValue: Descendant[]) => {
    setSlateValue(newValue);
    const plainText = newValue.map(n => Node.string(n)).join('\n');
    onChange(plainText);
  }, [onChange]);

  useEffect(() => {
    const currentText = slateValue.map(n => Node.string(n)).join('\n');
    if (currentText !== value) {
      setSlateValue(createSlateValue(value || ''));
    }
  }, [value]);

  const renderLeaf = useCallback(({ attributes, children, leaf }: any) => (
    <span {...attributes} style={leaf.isTag ? { color: 'red', fontWeight: 'bold' } : {}}>
      {children}
    </span>
  ), []);

  const decorate = useCallback(([node, path]: any) => {
    const ranges: any[] = [];
    if (!Text.isText(node)) return ranges;
    const text = node.text;
    TAG_REGEX.lastIndex = 0;

    let match;
    while ((match = TAG_REGEX.exec(text)) !== null) {
      ranges.push({
        anchor: { path, offset: match.index },
        focus: { path, offset: match.index + match[0].length },
        isTag: true,
      });
    }

    return ranges;
  }, []);

  return (
    <div style={{ border: '1px solid #ccc', padding: 6, minHeight: 30 }}>
      <Slate editor={editor} initialValue={slateValue || EMPTY_SLATE_VALUE} onChange={handleChange}>
        <Editable decorate={decorate} renderLeaf={renderLeaf} style={{ whiteSpace: 'pre-wrap' }} />
      </Slate>
    </div>
  );
});

const TableRow = React.memo(({ rowData, rowIdx, displayCols, onCellChange }: any) => (
  <tr>
    {displayCols.map((col: string) => (
      <td key={`cell-${rowIdx}-${col}`} style={{ minWidth: 200 }}>
        <TagCell value={rowData[col] ?? ""} onChange={(val) => onCellChange(rowIdx, col, val)} />
      </td>
    ))}
  </tr>
));

export default function DFViewer() {
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [noiseValue, setNoiseValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const tagColumn = "tag";

  const handleLoad = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8000/load-file?index=${index}&type=raw`);
      const data = await res.json();

      setAllColumns(data.columns);
      setSelectedCols(data.columns);
      setColumnOrder(data.columns);
      setRows(data.rows);
      setNoiseValue(data.noise ?? null);
    } catch (error) {
      alert("데이터 불러오기 오류");
    } finally {
      setIsLoading(false);
    }
  }, [index]);

  const handleChange = useCallback((rowIdx: number, col: string, value: string) => {
    setRows(prev => prev.map((row, i) => (i === rowIdx ? { ...row, [col]: value } : row)));
  }, []);

  const handleAddNoise = useCallback(async () => {
    if (noiseValue === null) {
      alert("노이즈 값이 없습니다.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/add-noise-df", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, columns: ["tag"], level: noiseValue }),
      });
      const data = await res.json();
      setRows(data.rows);
      if (data.rows[0]?.noised && !allColumns.includes("noised")) {
        setAllColumns(prev => [...prev, "noised"]);
        setColumnOrder(prev => [...prev, "noised"]);
      }
      alert(`노이즈 (+${noiseValue}) 적용 완료`);
    } catch (err) {
      alert("노이즈 적용 오류");
    } finally {
      setIsLoading(false);
    }
  }, [rows, noiseValue, allColumns]);

  const handleColumnToggle = useCallback((col: string, checked: boolean) => {
    if (checked) {
      setSelectedCols(prev => {
        const newCols = [...prev];
        const insertIdx = columnOrder.findIndex(o => o === col);
        const existing = newCols.findIndex(sc => columnOrder.indexOf(sc) > insertIdx);
        if (existing === -1) newCols.push(col);
        else newCols.splice(existing, 0, col);
        return newCols;
      });
    } else {
      setSelectedCols(prev => prev.filter(c => c !== col));
    }
  }, [columnOrder]);

  const displayCols = useMemo(() => {
    const cols = [...selectedCols];
    if (rows[0]?.noised && !cols.includes('noised')) {
      const ni = columnOrder.indexOf("noised");
      const insertIndex = cols.findIndex(c => columnOrder.indexOf(c) > ni);
      if (insertIndex === -1) cols.push("noised");
      else cols.splice(insertIndex, 0, "noised");
    }
    return cols;
  }, [selectedCols, rows, columnOrder]);

  const convertToCSV = (data: any[]) => {
    if (!data.length) return "";
    const keys = Object.keys(data[0]);
    const lines = data.map(row => keys.map(k => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(','));
    return [keys.join(','), ...lines].join('\n');
  };

  const handleDownloadCSV = useCallback(() => {
    const csv = convertToCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${index}_noised.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, index]);

  const handleSaveToServer = useCallback(async () => {
    try {
      setIsLoading(true);
      const csv = convertToCSV(rows);
      const res = await fetch("http://localhost:8000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: csv, filename: `${index}` }),
      });
      const data = await res.json();
      alert(`서버 저장 완료: ${data.saved_as}`);
    } catch {
      alert("서버 저장 실패");
    } finally {
      setIsLoading(false);
    }
  }, [rows, index]);

  return (
    <div style={{ padding: 20 }}>
      <h2>태그 및 날짜 노이즈</h2>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <label>인덱스: </label>
        <input type="number" value={index} onChange={(e) => setIndex(Number(e.target.value))} />
        <button onClick={handleLoad} disabled={isLoading}>{isLoading ? '로딩 중...' : '불러오기'}</button>
      </div>

      {allColumns.length > 0 && (
        <div style={{ marginBottom: 15 }}>
          <strong>컬럼 선택:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {columnOrder.map(col => (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={selectedCols.includes(col)}
                  onChange={(e) => handleColumnToggle(col, e.target.checked)}
                />
                {col}
              </label>
            ))}
          </div>
        </div>
      )}

      {noiseValue !== null && (
        <div style={{ marginBottom: 15, color: "#666" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            적용된 노이즈: <strong>+{noiseValue}일</strong>
            <button onClick={handleAddNoise} disabled={isLoading}>
              {isLoading ? '처리 중...' : '노이즈 적용'}
            </button>
            <button onClick={handleDownloadCSV} disabled={rows.length === 0}>로컬 다운로드</button>
            <button onClick={handleSaveToServer} disabled={rows.length === 0 || isLoading}>
              {isLoading ? '저장 중...' : '서버 저장'}
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={5} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>{displayCols.map(col => <th key={col}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <TableRow
                key={`row-${rowIdx}`}
                rowData={row}
                rowIdx={rowIdx}
                displayCols={displayCols}
                onCellChange={handleChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
