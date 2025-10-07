import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import type { ConfigEditorProps } from '@/types';
import { useSettings } from '@/hooks/useSettingsContext';

export function ConfigEditor({
  value,
  onChange,
  language,
  readOnly = false,
  onValidate,
}: ConfigEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { settings } = useSettings();
  
  const isDarkTheme = settings.appearance.theme === 'dark' || 
    (settings.appearance.theme === 'auto' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Configure JSON language features
    if (language === 'json') {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        schemas: [],
        enableSchemaRequest: true,
      });
    }

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
    <div className="relative w-full h-full min-h-[600px] border border-border rounded-lg overflow-hidden bg-background">
      <Editor
        height="600px"
        defaultLanguage={language === 'caddyfile' ? 'plaintext' : language}
        language={language === 'caddyfile' ? 'plaintext' : language}
        value={value}
        theme={isDarkTheme ? 'vs-dark' : 'light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-[600px] w-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading editor...</p>
            </div>
          </div>
        }
        options={{
          readOnly,
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
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
      {!isEditorReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
