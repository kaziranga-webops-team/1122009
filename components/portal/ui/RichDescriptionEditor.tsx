'use client';

import React, { useState } from 'react';
import { Bold, Italic, Heading, List, Link as LinkIcon, Eye, Edit3 } from 'lucide-react';

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichDescriptionEditor({ value, onChange, placeholder }: RichDescriptionEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('event-desc-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  return (
    <div className="bg-surface-raised rounded-xl border border-hairline overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-surface-sunken border-b border-hairline">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertText('**', '**')}
            title="Bold"
            className="p-1.5 rounded hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*')}
            title="Italic"
            className="p-1.5 rounded hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('### ')}
            title="Heading"
            className="p-1.5 rounded hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
          >
            <Heading className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('\n- ')}
            title="Bullet list"
            className="p-1.5 rounded hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('[Link Title](', ')')}
            title="Link"
            className="p-1.5 rounded hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-2.5 py-1 rounded text-micro font-bold uppercase tracking-wider transition-colors ${
              tab === 'write'
                ? 'bg-[#1e5631] text-[#f5f0e1]'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Edit3 className="w-3 h-3 inline mr-1" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 rounded text-micro font-bold uppercase tracking-wider transition-colors ${
              tab === 'preview'
                ? 'bg-[#1e5631] text-[#f5f0e1]'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Preview
          </button>
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          id="event-desc-textarea"
          rows={7}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Describe event guidelines, rules, perks, dates, and instructions...'}
          className="w-full p-3.5 bg-transparent text-ink placeholder:text-ink-faint focus:outline-none text-body resize-y font-sans leading-relaxed"
        />
      ) : (
        <div className="p-4 min-h-[180px] prose dark:prose-invert max-w-none text-body text-ink leading-relaxed whitespace-pre-wrap">
          {value || <span className="text-ink-faint italic">No description entered yet.</span>}
        </div>
      )}
    </div>
  );
}
