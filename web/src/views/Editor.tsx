import { useEffect, useRef } from 'preact/hooks';
import type { MutableRef } from 'preact/hooks';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { undo } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { getCode, saveCode } from '../store';

const KEYS = ['Tab', '{', '}', '(', ')', '[', ']', ';', ':', '<', '>', '=', '"', "'"];

interface EditorProps {
  slug: string;
  lang: string;
  template: string;
  codeRef: MutableRef<string>;
}

export function Editor({ slug, lang, template, codeRef }: EditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    let cancelled = false;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;

    getCode(slug, lang).then((saved) => {
      if (cancelled || !host.current) return;
      const doc = saved ?? template;
      codeRef.current = doc;
      view.current = new EditorView({
        parent: host.current,
        state: EditorState.create({
          doc,
          extensions: [
            basicSetup,
            oneDark,
            lang === 'cpp' ? cpp() : python(),
            // LeetCode templates use 4 spaces; a tab character would break Python indentation.
            indentUnit.of('    '),
            // Portrait screen: wrap instead of sideways scrolling.
            EditorView.lineWrapping,
            EditorView.contentAttributes.of({ autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
            EditorView.updateListener.of((update) => {
              if (!update.docChanged) return;
              codeRef.current = update.state.doc.toString();
              clearTimeout(saveTimer);
              saveTimer = setTimeout(() => saveCode(slug, lang, codeRef.current), 400);
            }),
          ],
        }),
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(saveTimer);
      if (view.current) {
        // Flush the pending debounce so switching language or leaving never loses the last keystrokes.
        saveCode(slug, lang, view.current.state.doc.toString());
        view.current.destroy();
        view.current = null;
      }
    };
  }, [slug, lang, template]);

  function press(key: string) {
    const editor = view.current;
    if (!editor) return;
    if (key === 'undo') undo(editor);
    else editor.dispatch({ ...editor.state.replaceSelection(key === 'Tab' ? editor.state.facet(indentUnit) : key), scrollIntoView: true });
  }

  // preventDefault on pointerdown keeps focus in the editor, so the phone keyboard stays open.
  const keyButton = (key: string, label = key) => (
    <button
      type="button"
      key={key}
      onPointerDown={(event) => {
        event.preventDefault();
        press(key);
      }}
    >
      {label}
    </button>
  );

  return (
    <div class="editor-wrap">
      <div class="keys">
        {KEYS.map((key) => keyButton(key))}
        {keyButton('undo', '↶')}
      </div>
      <div class="editor" ref={host} />
    </div>
  );
}
