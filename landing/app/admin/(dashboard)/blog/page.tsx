'use client';

/**
 * Admin — Blog Editor
 *
 * Split-screen layout:
 *   Left  (50%): Post list + editor form for the selected post
 *   Right (50%): Live preview styled like the public blog page
 *
 * Content is stored as HTML in deco.blog_posts.content.
 * The toolbar inserts/wraps HTML tags using direct textarea manipulation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  content: string;
  published: boolean;
  date: string;
  created_at: string;
  updated_at: string;
}

type DraftPost = Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>;

const EMPTY_DRAFT: DraftPost = {
  slug: '',
  title: '',
  excerpt: '',
  author: 'Deco Team',
  content: '',
  published: false,
  date: new Date().toISOString().split('T')[0],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

interface ToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (val: string) => void;
}

function HtmlToolbar({ textareaRef, onChange }: ToolbarProps) {
  function insertAround(open: string, close: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const newVal =
      ta.value.slice(0, start) + open + selected + close + ta.value.slice(end);
    onChange(newVal);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + open.length;
      ta.selectionEnd   = start + open.length + selected.length;
    });
  }

  function insertBlock(open: string, close: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = ta.value.slice(start, end).trim() || 'Tekst hier';
    // Add newline context
    const before = ta.value.slice(0, start);
    const after  = ta.value.slice(end);
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const newVal = before + prefix + open + selected + close + '\n' + after;
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const newStart = before.length + prefix.length + open.length;
      ta.selectionStart = newStart;
      ta.selectionEnd   = newStart + selected.length;
    });
  }

  function insertLink() {
    const ta = textareaRef.current;
    if (!ta) return;
    const url = window.prompt('URL:', 'https://');
    if (!url) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const text  = ta.value.slice(start, end) || 'Linktekst';
    const tag   = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    const newVal = ta.value.slice(0, start) + tag + ta.value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + tag.length;
      ta.selectionEnd   = start + tag.length;
    });
  }

  function insertBulletList() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = ta.value.slice(0, start);
    const after  = ta.value.slice(start);
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const snippet = '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n';
    const newVal = before + prefix + snippet + after;
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + prefix.length + snippet.length;
      ta.selectionStart = pos;
      ta.selectionEnd   = pos;
    });
  }

  const btnClass =
    'inline-flex items-center justify-center h-7 px-2.5 rounded text-xs font-semibold bg-white border border-deco-border text-deco-text hover:bg-deco-bg hover:border-deco-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary';

  return (
    <div
      className="flex flex-wrap items-center gap-1 p-2 bg-deco-bg border border-deco-border border-b-0 rounded-t-lg"
      role="toolbar"
      aria-label="HTML content toolbar"
    >
      <button type="button" className={btnClass} onClick={() => insertBlock('<h2>', '</h2>')} title="Heading 2">H2</button>
      <button type="button" className={btnClass} onClick={() => insertBlock('<h3>', '</h3>')} title="Heading 3">H3</button>
      <div className="w-px h-5 bg-deco-border mx-0.5" aria-hidden="true" />
      <button type="button" className={btnClass} onClick={() => insertAround('<strong>', '</strong>')} title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" className={btnClass} onClick={() => insertAround('<em>', '</em>')} title="Italic">
        <em>I</em>
      </button>
      <div className="w-px h-5 bg-deco-border mx-0.5" aria-hidden="true" />
      <button type="button" className={btnClass} onClick={() => insertBlock('<p>', '</p>')} title="Paragraph">P</button>
      <button type="button" className={btnClass} onClick={insertBulletList} title="Bullet list">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <button type="button" className={btnClass} onClick={insertLink} title="Link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
    </div>
  );
}

// ── Post List ──────────────────────────────────────────────────────────────────

interface PostListProps {
  posts: BlogPost[];
  selectedId: string | null;
  onSelect: (post: BlogPost) => void;
  onNew: () => void;
  loading: boolean;
}

function PostList({ posts, selectedId, onSelect, onNew, loading }: PostListProps) {
  return (
    <div className="bg-white rounded-2xl border border-deco-border overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-deco-border">
        <h2 className="text-sm font-bold text-deco-text">Posts ({posts.length})</h2>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-deco-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-deco-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Post
        </button>
      </div>

      {/* Post rows */}
      {loading ? (
        <div className="divide-y divide-deco-border" role="status" aria-label="Posts laden...">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-deco-border animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-deco-border animate-pulse rounded w-3/4" />
                <div className="h-2.5 bg-deco-border animate-pulse rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="px-4 py-6 text-sm text-deco-text-tertiary text-center">
          No posts yet — click &ldquo;New Post&rdquo; to create one.
        </p>
      ) : (
        <ul className="divide-y divide-deco-border max-h-64 overflow-y-auto">
          {posts.map((post) => {
            const active = post.id === selectedId;
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onSelect(post)}
                  aria-current={active ? 'true' : undefined}
                  className={[
                    'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-deco-primary',
                    active ? 'bg-deco-primary/8' : 'hover:bg-deco-bg',
                  ].join(' ')}
                >
                  {/* Published dot */}
                  <span
                    className={[
                      'w-2 h-2 rounded-full shrink-0 mt-0.5',
                      post.published ? 'bg-emerald-500' : 'bg-deco-border',
                    ].join(' ')}
                    title={post.published ? 'Published' : 'Draft'}
                    aria-label={post.published ? 'Published' : 'Draft'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={['text-sm font-medium truncate', active ? 'text-deco-primary-dark' : 'text-deco-text'].join(' ')}>
                      {post.title}
                    </p>
                    <p className="text-xs text-deco-text-tertiary mt-0.5">
                      {post.date} &middot; {post.author}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Editor Form ────────────────────────────────────────────────────────────────

interface EditorFormProps {
  draft: DraftPost;
  isNew: boolean;
  saving: boolean;
  deleting: boolean;
  saveSuccess: boolean;
  error: string | null;
  onChange: (field: keyof DraftPost, value: string | boolean) => void;
  onSave: () => void;
  onDelete: () => void;
}

function EditorForm({
  draft,
  isNew,
  saving,
  deleting,
  saveSuccess,
  error,
  onChange,
  onSave,
  onDelete,
}: EditorFormProps) {
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const inputClass =
    'w-full rounded-lg border border-deco-border bg-white px-3 py-2 text-sm text-deco-text placeholder:text-deco-text-tertiary focus:outline-none focus:ring-2 focus:ring-deco-primary/40 transition';

  const labelClass = 'text-xs font-semibold text-deco-text-secondary uppercase tracking-wide';

  return (
    <div className="bg-white rounded-2xl border border-deco-border p-5 space-y-4">
      <h2 className="text-sm font-bold text-deco-text">
        {isNew ? 'New Post' : 'Edit Post'}
      </h2>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor="post-title" className={labelClass}>Title</label>
        <input
          id="post-title"
          type="text"
          value={draft.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Post title"
          className={inputClass}
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1">
        <label htmlFor="post-slug" className={labelClass}>Slug</label>
        <input
          id="post-slug"
          type="text"
          value={draft.slug}
          onChange={(e) => onChange('slug', e.target.value)}
          placeholder="post-slug"
          className={inputClass}
        />
      </div>

      {/* Date + Author */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="post-date" className={labelClass}>Date</label>
          <input
            id="post-date"
            type="date"
            value={draft.date}
            onChange={(e) => onChange('date', e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="post-author" className={labelClass}>Author</label>
          <input
            id="post-author"
            type="text"
            value={draft.author}
            onChange={(e) => onChange('author', e.target.value)}
            placeholder="Deco Team"
            className={inputClass}
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="flex flex-col gap-1">
        <label htmlFor="post-excerpt" className={labelClass}>Excerpt</label>
        <textarea
          id="post-excerpt"
          value={draft.excerpt}
          onChange={(e) => onChange('excerpt', e.target.value)}
          rows={2}
          placeholder="Short description shown in post listings..."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Content with toolbar */}
      <div className="flex flex-col gap-1">
        <label htmlFor="post-content" className={labelClass}>Content (HTML)</label>
        <HtmlToolbar
          textareaRef={contentRef}
          onChange={(val) => onChange('content', val)}
        />
        <textarea
          id="post-content"
          ref={contentRef}
          value={draft.content}
          onChange={(e) => onChange('content', e.target.value)}
          rows={14}
          placeholder="<p>Start writing...</p>"
          spellCheck={false}
          className={`w-full rounded-b-lg border border-deco-border bg-white px-3 py-2 text-xs font-mono text-deco-text placeholder:text-deco-text-tertiary focus:outline-none focus:ring-2 focus:ring-deco-primary/40 transition resize-y`}
        />
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={draft.published}
          onClick={() => onChange('published', !draft.published)}
          className={[
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary',
            draft.published ? 'bg-emerald-500' : 'bg-deco-border',
          ].join(' ')}
          aria-label="Published"
        >
          <span
            aria-hidden="true"
            className={[
              'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200',
              draft.published ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
        <span className="text-sm text-deco-text">
          {draft.published ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || deleting}
          className="inline-flex items-center gap-2 rounded-lg bg-deco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-deco-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isNew ? 'Create Post' : 'Save Changes'}
            </>
          )}
        </button>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700" role="status">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        )}

        {!isNew && (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving || deleting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Delete
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Live Preview ───────────────────────────────────────────────────────────────

interface PreviewProps {
  draft: DraftPost;
}

function LivePreview({ draft }: PreviewProps) {
  return (
    <div className="h-full flex flex-col bg-deco-bg rounded-2xl border border-deco-border overflow-hidden">
      {/* Preview header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-deco-border shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" aria-hidden="true" />
        <span className="ml-2 text-xs text-deco-text-tertiary font-medium">
          Preview — /blog/{draft.slug || 'slug'}
        </span>
        <span
          className={[
            'ml-auto text-xs font-semibold px-2 py-0.5 rounded-full',
            draft.published
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-deco-border text-deco-text-tertiary',
          ].join(' ')}
        >
          {draft.published ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Scrollable preview body */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb mock */}
          <nav className="mb-6 text-xs text-deco-text-secondary flex items-center gap-1.5">
            <span>Home</span>
            <span>/</span>
            <span>Blog</span>
            <span>/</span>
            <span className="text-deco-text truncate max-w-48">
              {draft.title || 'Post title'}
            </span>
          </nav>

          {/* Post header */}
          <header className="mb-8">
            <h1 className="text-2xl font-extrabold text-deco-primary-dark leading-tight tracking-tight mb-3">
              {draft.title || <span className="text-deco-text-tertiary italic">No title yet</span>}
            </h1>
            <div className="flex items-center gap-2 text-xs text-deco-text-tertiary">
              <span>{draft.author}</span>
              <span>&middot;</span>
              <time dateTime={draft.date}>
                {draft.date ? formatDate(draft.date) : ''}
              </time>
            </div>
          </header>

          {/* Article body — rendered HTML */}
          <article
            className="prose-deco"
            dangerouslySetInnerHTML={{
              __html: draft.content || '<p class="text-deco-text-tertiary italic">Start typing HTML in the editor…</p>',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BlogEditorPage() {
  const [posts, setPosts]             = useState<BlogPost[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isNew, setIsNew]             = useState(false);
  const [draft, setDraft]             = useState<DraftPost>(EMPTY_DRAFT);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const successTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch post list ──────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/admin/blog', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setPosts(json as BlogPost[]);
    } catch (e) {
      console.error('Failed to load posts', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [fetchPosts]);

  // ── Select / new ─────────────────────────────────────────────────────────────

  function handleSelectPost(post: BlogPost) {
    setSelectedPost(post);
    setIsNew(false);
    setDraft({
      slug:      post.slug,
      title:     post.title,
      excerpt:   post.excerpt,
      author:    post.author,
      content:   post.content,
      published: post.published,
      date:      post.date,
    });
    setError(null);
    setSaveSuccess(false);
  }

  function handleNewPost() {
    setSelectedPost(null);
    setIsNew(true);
    setDraft({ ...EMPTY_DRAFT, date: new Date().toISOString().split('T')[0] });
    setError(null);
    setSaveSuccess(false);
  }

  // ── Draft change ─────────────────────────────────────────────────────────────

  function handleDraftChange(field: keyof DraftPost, value: string | boolean) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug when title changes (only for new posts or if slug was auto-generated)
      if (field === 'title' && typeof value === 'string') {
        const autoSlug = slugify(value);
        const prevAutoSlug = slugify(prev.title);
        if (prev.slug === '' || prev.slug === prevAutoSlug) {
          next.slug = autoSlug;
        }
      }
      return next;
    });
    setSaveSuccess(false);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!draft.title || !draft.slug) {
      setError('Title and slug are required.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      let res: Response;
      if (isNew) {
        res = await fetch('/api/admin/blog', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
      } else {
        res = await fetch(`/api/admin/blog/${selectedPost!.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const saved = (await res.json()) as BlogPost;
      setSelectedPost(saved);
      setIsNew(false);
      setSaveSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh list
      await fetchPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!selectedPost) return;
    if (!window.confirm(`Delete "${selectedPost.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/blog/${selectedPost.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      setSelectedPost(null);
      setIsNew(false);
      setDraft(EMPTY_DRAFT);
      await fetchPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const showEditor = isNew || selectedPost !== null;

  return (
    <>
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-deco-text tracking-tight">Blog Editor</h1>
        <p className="text-sm text-deco-text-secondary mt-1">
          Create and manage blog posts. Changes are saved to the database and shown on{' '}
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-deco-primary hover:text-deco-primary-dark underline underline-offset-2"
          >
            /blog
          </a>
          .
        </p>
      </header>

      {/* Split layout */}
      <div className="flex gap-6 items-start">
        {/* ── Left panel ──────────────────────────────────────────────────── */}
        <div className="w-1/2 min-w-0 space-y-4">
          <PostList
            posts={posts}
            selectedId={selectedPost?.id ?? null}
            onSelect={handleSelectPost}
            onNew={handleNewPost}
            loading={loadingList}
          />

          {showEditor && (
            <EditorForm
              draft={draft}
              isNew={isNew}
              saving={saving}
              deleting={deleting}
              saveSuccess={saveSuccess}
              error={error}
              onChange={handleDraftChange}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}

          {!showEditor && !loadingList && (
            <div className="bg-white rounded-2xl border border-deco-border p-8 text-center">
              <svg
                width="40" height="40"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
                className="mx-auto mb-3 text-deco-text-tertiary"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <p className="text-sm text-deco-text-secondary">
                Select a post to edit, or click <strong>New Post</strong> to create one.
              </p>
            </div>
          )}
        </div>

        {/* ── Right panel (live preview) ───────────────────────────────────── */}
        <div className="w-1/2 min-w-0 sticky top-8" style={{ height: 'calc(100vh - 8rem)' }}>
          <LivePreview draft={showEditor ? draft : EMPTY_DRAFT} />
        </div>
      </div>
    </>
  );
}
