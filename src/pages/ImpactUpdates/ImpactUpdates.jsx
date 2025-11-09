// src/pages/ImpactUpdates.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';
import './ImpactUpdates.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
const CONTENT_BASE = `${API_BASE}/home`;

function humanizeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const m = 60 * 1000, h = 60 * m, d = 24 * h;
  if (diff < h) return `${Math.max(1, Math.round(diff / m))} min ago`;
  if (diff < d) return `${Math.round(diff / h)} h ago`;
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

export default function ImpactUpdates() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchPosts = useCallback(async (signal) => {
    try {
      if (signal?.aborted) return;
      setLoading(true);
      const res = await fetch(`${CONTENT_BASE}/posts`, { signal });
      const payload = res.ok ? await res.json() : [];
      if (!signal?.aborted) setPosts(Array.isArray(payload) ? payload : []);
    } catch {
      // quiet fail: we'll just show the calm empty state
      if (!signal?.aborted) setPosts([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => controller.abort();
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...posts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return posts
      .filter((post) => {
        const haystack = [
          post.text, post.caption, post.title,
          post.ngoName, post.ngo?.name,
          Array.isArray(post.tags) ? post.tags.join(' ') : post.tags
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [posts, query]);

  const withMedia = posts.filter(p => p.images?.length).length;
  const uniqueNgos = new Set(posts.map(p => p.ngoId || p.ngo?.id || p.ngoName).filter(Boolean)).size;

  return (
    <>
      <main className="updates">
        {/* HERO */}
        <section className="updates__hero">
          <div className="updates__hero-left">
            <span className="eyebrow">Community stories</span>
            <h1>Impact</h1>
            <p className="lead">
              Field notes and milestones from TyebeTyebak partners. See how your generosity
              turns into warm hands, full bags, and brighter days.
            </p>
            <div className="cta-row">
              <Link to="/donations" className="btn btn-primary">Support a cause</Link>
              <Link to="/map" className="btn btn-ghost">Discover nearby partners</Link>
            </div>
          </div>

          <div className="updates__hero-right">
            <div className="stat">
              <div className="stat__value">{loading ? '—' : posts.length.toLocaleString()}</div>
              <div className="stat__label">Stories shared</div>
            </div>
            <div className="stat">
              <div className="stat__value">{loading ? '—' : withMedia.toLocaleString()}</div>
              <div className="stat__label">Updates with photos</div>
            </div>
            <div className="stat">
              <div className="stat__value">{loading ? '—' : uniqueNgos.toLocaleString()}</div>
              <div className="stat__label">NGO voices</div>
            </div>
          </div>
        </section>

        {/* TOOLBAR (search only — filters removed) */}
        <section className="updates__toolbar">
          <div className="search">
            <input
              type="search"
              placeholder="Search by NGO, theme, or keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search updates"
            />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79l5 5L20.5 19l-5-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" />
            </svg>
          </div>
        </section>

        {/* GRID */}
        <section className="updates__grid">
          {loading && (
            <div className="state">
              <div className="spinner" aria-hidden="true" />
              <p>Gathering the latest updates…</p>
            </div>
          )}

          {!loading && filteredPosts.length === 0 && (
              <div className="state state--empty">
                <img src="/favicon.png" alt="TyebeTyebak logo" className="state__icon" loading="lazy" style={{ width: 90, height: 90 }} />
                <p>There aren’t any updates yet — check back soon to see our partners’ latest stories.</p>
              </div>
          )}

          {!loading && filteredPosts.length > 0 && filteredPosts.map((post) => {
            const ngoName = post.ngoName || post.ngo?.name || 'Partner NGO';
            const body = post.text || post.caption || '';
            const summary = body.length > 220 ? `${body.slice(0, 217)}…` : body;
            const cover = post.images?.[0];
            const ngoId = post.ngoId || post.ngo?.id;
            const tagArray = Array.isArray(post.tags)
              ? post.tags
              : typeof post.tags === 'string'
                ? post.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            return (
              <article key={post.postId || post.id} className="card">
                <div className="card__media">
                  {cover ? (
                    <img src={cover} alt={`Update from ${ngoName}`} loading="lazy" />
                  ) : (
                    <div className="card__placeholder" aria-hidden="true">
                      <img src="/favicon.png" alt="logo" style={{ width: '48px', height: '48px' }} />
                    </div>
                  )}
                </div>

                <div className="card__body">
                  <div className="card__meta">
                    <span className="meta__ngo">{ngoName}</span>
                    <time dateTime={post.createdAt || ''}>{humanizeDate(post.createdAt)}</time>
                  </div>
                  <h2 className="card__title">{post.title || 'Field update'}</h2>
                  <p className="card__text">{summary}</p>

                  {tagArray.length > 0 && (
                    <div className="card__tags">
                      {tagArray.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">
                          #{String(tag).toLowerCase().replace(/\s+/g, '')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="card__actions">
                    <Link to={ngoId ? `/ngo/${encodeURIComponent(ngoId)}` : '/our-partners'} className="link">
                      View NGO profile
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

      </main>
      {/* spacer so page content doesn't collide with footer (if footer is fixed) */}
      <div style={{ height: 0 }} />
      <Footer />
    </>
  );
}
