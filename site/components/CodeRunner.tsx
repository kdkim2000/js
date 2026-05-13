"use client";

import { useState, useRef } from "react";

interface Props {
  initialCode: string;
  lang?: string;
}

export default function CodeRunner({ initialCode, lang = "javascript" }: Props) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (lang !== "javascript" && lang !== "js") return null;

  function run() {
    setRunning(true);
    setOutput([]);

    const lines: string[] = [];

    const srcdoc = `<!DOCTYPE html>
<html><body><script>
(function() {
  const _log = console.log;
  console.log = function(...args) {
    parent.postMessage({ type: 'log', data: args.map(String).join(' ') }, '*');
  };
  console.error = function(...args) {
    parent.postMessage({ type: 'error', data: args.map(String).join(' ') }, '*');
  };
  try {
    ${code}
  } catch(e) {
    parent.postMessage({ type: 'error', data: e.message }, '*');
  }
  parent.postMessage({ type: 'done' }, '*');
})();
<\/script></body></html>`;

    const handler = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data.type === "log") {
        lines.push(e.data.data);
        setOutput([...lines]);
      } else if (e.data.type === "error") {
        lines.push(`❌ ${e.data.data}`);
        setOutput([...lines]);
      } else if (e.data.type === "done") {
        window.removeEventListener("message", handler);
        setRunning(false);
      }
    };

    window.addEventListener("message", handler);

    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcdoc;
    }
  }

  return (
    <div className="my-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500">JavaScript 실행</span>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-50"
        >
          {running ? "실행 중..." : "▶ 실행"}
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full px-4 py-3 font-mono text-sm bg-[#0d1117] text-gray-100 resize-y min-h-[80px] outline-none"
        spellCheck={false}
      />

      {output.length > 0 && (
        <div className="px-4 py-3 bg-gray-950 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-1">출력:</div>
          {output.map((line, i) => (
            <div key={i} className={`font-mono text-sm ${line.startsWith("❌") ? "text-red-400" : "text-green-400"}`}>
              {line}
            </div>
          ))}
        </div>
      )}

      <iframe ref={iframeRef} className="hidden" sandbox="allow-scripts" />
    </div>
  );
}
