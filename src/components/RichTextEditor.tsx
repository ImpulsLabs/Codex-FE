import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  label,
}: {
  onClick: () => void
  isActive?: boolean
  label: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition-colors ${
      isActive
        ? 'bg-slate-800 text-white'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
    }`}
  >
    {label}
  </button>
)

export const RichTextEditor = ({ value, onChange, placeholder = 'Tulis konten...', disabled = false }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({ inline: true }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: !disabled,
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('Masukkan URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          label="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          label="Strike"
        />
        <span className="mx-1 w-px bg-slate-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          label="H2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          label="H3"
        />
        <span className="mx-1 w-px bg-slate-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          label="List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          label="OL"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          label="Quote"
        />
        <span className="mx-1 w-px bg-slate-200" />
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          label="Link"
        />
        <ToolbarButton
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/jpeg,image/png,image/webp'
            input.onchange = () => {
              const file = input.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  const url = e.target?.result as string
                  editor.chain().focus().setImage({ src: url }).run()
                }
                reader.readAsDataURL(file)
              }
            }
            input.click()
          }}
          label="Image"
        />
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm min-h-48 max-w-none px-4 py-3 text-sm leading-7 text-slate-700 outline-none [&_.ProseMirror]:min-h-48 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:leading-7 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
