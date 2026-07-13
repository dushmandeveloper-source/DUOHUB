import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, List, ListOrdered, RemoveFormatting } from 'lucide-react';

// Scoped manual style overrides for rendered Tiptap HTML — @tailwindcss/typography
// is not installed, so `prose` classes would be no-ops. Exported so Notes.jsx
// can apply the same styling to saved note content.
export const richTextStyles = "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_li]:mb-0.5";

const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#d97706'];

const ToolbarButton = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
  >
    {children}
  </button>
);

export default function RichTextEditor({ content, onChange, placeholder }) {
  // `content` seeds the editor once on mount. A fresh RichTextEditor instance
  // is mounted per note/compose-form (each has a distinct `key` in Notes.jsx),
  // so the editor — not the prop — stays the source of truth while mounted.
  // Re-syncing from `content` on every prop change fights the editor's own
  // onUpdate round-trip and drops keystrokes mid-typing.
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {editor && (
        <div className="bg-gray-50 border-b border-gray-100 rounded-t-xl px-2 py-1.5 flex flex-wrap gap-1">
          <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton title="Ordered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>
          <div className="flex items-center gap-1 px-1">
            {COLORS.map(hex => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => editor.chain().focus().setColor(hex).run()}
                className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <RemoveFormatting size={16} />
          </ToolbarButton>
        </div>
      )}
      <div className={richTextStyles}>
        <EditorContent editor={editor} className="max-w-none px-4 py-3 min-h-[150px] focus:outline-none" />
      </div>
    </div>
  );
}
