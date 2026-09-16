import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { MarkdownManager } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { mediaExtensions, normaliseMediaContent } from './multimedia'
import { resolveMediaUrl } from '../api/client'

const ResolvedImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return ['img', { ...HTMLAttributes, src: resolveMediaUrl(HTMLAttributes.src) }]
  },
})

// StarterKit already provides Link and Underline. Disable those defaults before
// adding the configured versions so the editor schema has no duplicate names.
const extensions = [
  StarterKit.configure({ link: false, underline: false }),
  Underline,
  Link.configure({ openOnClick: true }),
  ResolvedImage,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  ...mediaExtensions,
]

let markdownManager

const parseMarkdown = (content) => {
  markdownManager ??= new MarkdownManager({ extensions })
  return markdownManager.parse(content)
}

export function parseContent(content) {
  if (!content) return { type: 'doc', content: [] }
  if (typeof content === 'object') return normaliseMediaContent(content)
  try { return normaliseMediaContent(JSON.parse(content)) } catch { return normaliseMediaContent(parseMarkdown(content)) }
}

export default function ArticleContent({ content, className = '' }) {
  const editor = useEditor({ extensions, content: parseContent(content), editable: false, immediatelyRender: false })
  useEffect(() => { editor?.commands.setContent(parseContent(content)) }, [content, editor])
  return <EditorContent editor={editor} className={`article-content ${className}`} />
}

export { extensions as articleExtensions }
