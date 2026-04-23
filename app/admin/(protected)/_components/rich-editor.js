'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Unlink,
  Minus, Undo, Redo, Code
} from 'lucide-react';

export function RichEditor({ value, onChange, placeholder = 'Start writing your trip story…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-lime underline underline-offset-2',
        },
      }),
      Placeholder.configure({ placeholder }),
      Image,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose-pritrip focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false, // avoids Next.js SSR hydration warnings
  });

  // Keep editor in sync if external `value` changes (e.g. after save)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return (
    <div className="bg-base border-2 border-default rounded-xl min-h-[400px] animate-pulse" />
  );

  return (
    <div className="bg-base border-2 border-default rounded-xl overflow-hidden focus-within:border-lime transition">
      <Toolbar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }) {
  function addLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-hover border-b border-subtle">
      <Group>
        <TBtn active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2">
          <Heading2 size={14}/>
        </TBtn>
        <TBtn active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3">
          <Heading3 size={14}/>
        </TBtn>
      </Group>

      <Divider />

      <Group>
        <TBtn active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (⌘B)">
          <Bold size={14}/>
        </TBtn>
        <TBtn active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (⌘I)">
          <Italic size={14}/>
        </TBtn>
        <TBtn active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough">
          <Strikethrough size={14}/>
        </TBtn>
        <TBtn active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code">
          <Code size={14}/>
        </TBtn>
      </Group>

      <Divider />

      <Group>
        <TBtn active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list">
          <List size={14}/>
        </TBtn>
        <TBtn active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list">
          <ListOrdered size={14}/>
        </TBtn>
        <TBtn active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote">
          <Quote size={14}/>
        </TBtn>
      </Group>

      <Divider />

      <Group>
        <TBtn active={editor.isActive('link')}
          onClick={addLink}
          title="Link">
          <LinkIcon size={14}/>
        </TBtn>
        {editor.isActive('link') && (
          <TBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link">
            <Unlink size={14}/>
          </TBtn>
        )}
        <TBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider">
          <Minus size={14}/>
        </TBtn>
      </Group>

      <div className="flex-1"/>

      <Group>
        <TBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (⌘Z)">
          <Undo size={14}/>
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (⌘⇧Z)">
          <Redo size={14}/>
        </TBtn>
      </Group>
    </div>
  );
}

function TBtn({ active, onClick, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        w-8 h-8 rounded-md flex items-center justify-center transition
        ${active
          ? 'bg-lime text-inverse-text'
          : 'text-ink hover:bg-base'}
        disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
}

function Group({ children }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-5 bg-subtle mx-1"/>;
}