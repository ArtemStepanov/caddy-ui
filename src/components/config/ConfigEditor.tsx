import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface ConfigEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: 'json' | 'caddyfile';
  readOnly?: boolean;
  onValidate?: (markers: unknown[]) => void;
}

export function ConfigEditor({
  value,
  onChange,
  language,
  readOnly = false,
  onValidate,
}: ConfigEditorProps) {
  const editorRef = useRef<unknown>(null);

  function handleEditorDidMount(editor: unknown, monaco: unknown) {
    editorRef.current = editor;

    // Configure JSON language features
    if (language === 'json') {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        schemas: [],
        enableSchemaRequest: true,
      });
    }

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      folding: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      readOnly,
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      suggest: {
        showWords: true,
        showKeywords: true,
      },
    });

    // Add validation listener
    if (onValidate) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.onDidChangeMarkers(() => {
          const markers = monaco.editor.getModelMarkers({ resource: model.uri });
          onValidate(markers);
        });
      }
    }
  }

  function handleEditorChange(value: string | undefined) {
    onChange(value);
  }

  // Format document
  useEffect(() => {
    if (editorRef.current && language === 'json') {
      const editor = editorRef.current;
      const formatAction = editor.getAction('editor.action.formatDocument');
      if (formatAction) {
        // Auto-format on mount (with slight delay)
        setTimeout(() => {
          formatAction.run();
        }, 100);
      }
    }
  }, [language]);

  return (
    <div className="relative h-full min-h-[600px] border border-border rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language={language === 'caddyfile' ? 'plaintext' : language}
        value={value}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
        options={{
          readOnly,
        }}
      />
    </div>
  );
}
