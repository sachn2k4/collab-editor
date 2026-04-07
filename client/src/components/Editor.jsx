import React, { useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

export default function Editor({ content, onChange, language }) {
  const editorRef = useRef(null);
  const [output, setOutput] = useState('');

  const handleEditorChange = (value) => {
    onChange(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const runCode = () => {
    const code = editorRef.current?.getValue();
    if (language === 'javascript') {
      try {
        // Safe evaluation simulation
        const originalLog = console.log;
        let logs = [];
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
        };
        // Simple evaluation logic for JS MVP
        const result = new Function(code)();
        console.log = originalLog;
        if (result !== undefined) logs.push(String(result));
        setOutput(logs.join('\n'));
      } catch (err) {
        setOutput(err.toString());
      }
    } else {
      setOutput(`Execution for ${language} not yet supported in MVP.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex justify-between items-center bg-zinc-800 p-2 border-b border-zinc-700">
        <span className="text-zinc-400 px-2 italic uppercase text-xs font-semibold">{language}</span>
        <button onClick={runCode} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded shadow text-sm font-medium transition-colors">
          Run Code
        </button>
      </div>
      <div className="flex-grow">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
          }}
        />
      </div>
      <div className="h-48 bg-black text-green-400 p-4 border-t border-zinc-700 overflow-auto font-mono text-sm">
        <div className="mb-2 text-zinc-500">Output terminal:</div>
        <pre>{output}</pre>
      </div>
    </div>
  );
}