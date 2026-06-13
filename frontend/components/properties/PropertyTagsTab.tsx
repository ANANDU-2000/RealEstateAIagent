'use client';

import { useState } from 'react';
import { Plus, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';

type PropertyTagsTabProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

const EXAMPLE_TAGS = ['near airport', 'metro access', 'school zone', 'gated community'];

export function PropertyTagsTab({ tags, onChange }: PropertyTagsTabProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    if (tag.length > 50) {
      setError('Each tag must be 50 characters or fewer.');
      return;
    }
    if (tags.includes(tag)) {
      setError('That tag is already added.');
      return;
    }
    setError(null);
    onChange([...tags, tag]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm text-muted">
          Keywords help Arjun match this property to buyer conversations. Add location and lifestyle
          cues buyers might mention.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TAGS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => addTag(example)}
              className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted hover:border-primary hover:text-primary"
            >
              + {example}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTag(input);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <Input
          label="Add tag"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. near metro"
          className="flex-1"
        />
        <Button type="submit" disabled={!input.trim()} className="sm:mb-0">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>

      {error && <Alert variant="error">{error}</Alert>}

      {tags.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
          <Tag className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No AI tags yet. Add keywords buyers might search for.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1',
                'text-sm font-medium text-primary'
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 hover:bg-primary/10"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
