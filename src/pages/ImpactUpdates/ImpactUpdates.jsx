import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './ImpactUpdates.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
const CONTENT_BASE = `${API_BASE}/home`;

function humanizeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} min ago`;
  if (diff < day) return `${Math.round(diff / hour)} h ago`;
  const intl = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  return intl.format(date);
}

export default function ImpactUpdates() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [spotlight, setSpotlight] = useState('all');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const fetchPosts = useCallback(async (signal) => {
    try {
      if (signal?.aborted) return;
      setLoading(true);
      setError('');
      const res = await fetch(`${CONTENT_BASE}/posts`, { signal });
      if (!res.ok) throw new Error('Unable to load updates right now.');
      const payload = await res.json();
      if (signal?.aborted) return;
      setPosts(Array.isArray(payload) ? payload : []);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err.message || 'Unable to load updates right now.');
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((post) => {
        if (spotlight === 'with-media' && !post.images?.length) return false;
        if (spotlight === 'text-only' && post.images?.length) return false;
        if (!q) return true;
        const haystack = [
          post.text,
          post.ngoName,
          post.ngo?.name,
          post.title,
          post.tags?.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [posts, query, spotlight]);

  const heroStats = useMemo(() => {
    const withMedia = posts.filter((post) => post.images?.length).length;
    const uniqueNgos = new Set(
      posts
        .map((post) => post.ngoId || post.ngo?.id || post.ngoName)
        .filter(Boolean),
    ).size;

    return [
      { label: 'Stories shared', value: posts.length },
      { label: 'Updates with photos', value: withMedia },
      { label: 'NGO voices', value: uniqueNgos },
    ];
  }, [posts]);

  return (
    <main className="updates">
      <section className="updates__hero">
        <div className="updates__hero-content">
          <span className="updates__eyebrow">Community stories</span>
          <h1>Impact</h1>
          <p>
            Stories from TyebeTyebak partners, highlighting the progress, gratitude, and
            breakthroughs our community sparks every week.
          </p>
          <div className="updates__hero-actions">
            <Link to="/donations" className="updates__cta updates__cta--primary">
              Support a cause
            </Link>
            <Link to="/map" className="updates__cta updates__cta--ghost">
              Discover nearby partners
            </Link>
          </div>
        </div>
        <div className="updates__hero-stats">
          {heroStats.map(({ label, value }) => {
            const displayValue = loading
              ? '—'
              : typeof value === 'number'
                ? value.toLocaleString()
                : String(value);
            return (
            <div key={label} className="updates__hero-stat">
              <span className="updates__hero-value">
                {displayValue}
              </span>
              <span className="updates__hero-label">{label}</span>
            </div>
            );
          })}
        </div>
      </section>

      <section className="updates__toolbar">
        <div className="updates__search">
          <input
            type="search"
            placeholder="Search by NGO, theme, or keyword"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79l5 5L20.5 19l-5-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="updates__filters" role="tablist" aria-label="Spotlight filter">
          {[
            { id: 'all', label: 'All updates' },
            { id: 'with-media', label: 'Stories with photos' },
            { id: 'text-only', label: 'Quick notes' },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`updates__filter ${spotlight === id ? 'is-active' : ''}`}
              onClick={() => setSpotlight(id)}
              type="button"
              role="tab"
              aria-selected={spotlight === id}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="updates__grid">
        {loading && (
          <div className="updates__state">
            <div className="updates__spinner" aria-hidden="true" />
            <p>Collecting field stories…</p>
          </div>
        )}
        {!loading && error && (
          <div className="updates__state updates__state--error">
            <p>{error}</p>
            <button type="button" onClick={() => fetchPosts()}>
              Try again
            </button>
          </div>
        )}
        {!loading && !error && filteredPosts.length === 0 && (
          <div className="updates__state">
            <p>No updates match your filters yet. Try a different keyword or spotlight.</p>
          </div>
        )}
        {!loading && !error && filteredPosts.length > 0 && (
          filteredPosts.map((post) => {
            const ngoName = post.ngoName || post.ngo?.name || 'Partner NGO';
            const rawSummary = post.text || post.caption || '';
            const summary = rawSummary.length > 220 ? `${rawSummary.slice(0, 217)}…` : rawSummary;
            const cover = post.images?.[0];
            const ngoId = post.ngoId || post.ngo?.id;
            const tagArray = Array.isArray(post.tags)
              ? post.tags
              : typeof post.tags === 'string'
                ? post.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
                : [];

            return (
              <article key={post.postId || post.id} className="updates__card">
                <div className="updates__card-media">
                  {cover ? (
                    <img src={cover} alt={`Update from ${ngoName}`} loading="lazy" />
                  ) : (
                    <div className="updates__card-placeholder">
                      <span role="img" aria-label="Impact">
                        ✨
                      </span>
                    </div>
                  )}
                </div>
                <div className="updates__card-body">
                  <div className="updates__card-meta">
                    <span className="updates__ngo">{ngoName}</span>
                    <time dateTime={post.createdAt || ''}>{humanizeDate(post.createdAt)}</time>
                  </div>
                  <h2>{post.title || 'Field update'}</h2>
                  <p>{summary}</p>
                  <div className="updates__card-tags">
                    {tagArray.slice(0, 3).map((tag) => (
                      <span key={tag} className="updates__tag">
                        #{tag.toLowerCase().replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                  <div className="updates__card-actions">
                    <Link to={ngoId ? `/ngo/${encodeURIComponent(ngoId)}` : '/our-partners'}>
                      View NGO profile
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="updates__newsletter">
        <div className="updates__newsletter-body">
          <h2>Want the highlights in your inbox?</h2>
          <p>
            Subscribe to monthly impact notes so you can see how collective generosity is unlocking
            new milestones.
          </p>
        </div>
        <form
          className="updates__newsletter-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.currentTarget.reset();
            setNewsletterStatus('Thanks for joining! We will keep you posted soon.');
          }}
        >
          <label>
            <span className="sr-only">Your email</span>
            <input type="email" placeholder="you@example.com" required />
          </label>
          <button type="submit">Join the list</button>
        </form>
        {newsletterStatus && <p className="updates__newsletter-status">{newsletterStatus}</p>}
      </section>
    </main>
  );
}
