/**
 * Build script for Belle Allure blog posts.
 * Reads markdown files from /blog/ and:
 *   1. Generates /blog/posts.json for the blog index listing
 *   2. Generates individual HTML pages at /blog/<slug>/index.html
 */

const fs = require('fs');
const path = require('path');

// Minimal frontmatter parser (no extra deps needed)
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  match[1].split('\n').forEach(line => {
    const sep = line.indexOf(':');
    if (sep === -1) return;
    const key = line.slice(0, sep).trim();
    const val = line.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '');
    data[key] = val;
  });
  return { data, content: match[2].trim() };
}

// Very small markdown -> HTML converter (headings, bold, italic, paragraphs, links)
function mdToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[h|u|o])/, '<p>')
    .replace(/$(?![>])/, '</p>')
    .replace(/<p><\/p>/g, '');
}

const blogDir = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const posts = [];

files.forEach(filename => {
  const raw = fs.readFileSync(path.join(blogDir, filename), 'utf8');
  const { data, content } = parseFrontmatter(raw);
  if (!data.title || !data.date) return;

  // Slug: strip date prefix and .md
  const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');

  posts.push({
    slug,
    title: data.title,
    date: data.date,
    image: data.image || null,
    image_alt: data.image_alt || data.title,
    excerpt: data.excerpt || '',
  });

  // Build individual post page
  const postDir = path.join(blogDir, slug);
  if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

  const bodyHtml = mdToHtml(content);
  const postHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${data.title} | Belle Allure</title>
<meta name="description" content="${(data.excerpt || '').replace(/"/g, '&quot;')}">
<link rel="canonical" href="https://belleallureaestheticsandwellness.com/blog/${slug}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet">
${data.image ? `<meta property="og:image" content="https://belleallureaestheticsandwellness.com${data.image}">` : ''}
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Figtree',system-ui,sans-serif;color:#2B2B2B;background:#FAFAF8;line-height:1.7}
  a{color:#4F6754;text-decoration:underline;text-underline-offset:3px}
  header{background:#fff;border-bottom:1px solid #E8E4DF;padding:14px 24px}
  header .inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
  .site-logo{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:700;color:#2B2B2B;letter-spacing:.02em;text-decoration:none}
  .nav-back{font-size:14px;color:#5E7A65;text-decoration:underline;text-underline-offset:3px}
  .post-wrap{max-width:720px;margin:0 auto;padding:48px 24px 80px}
  .post-meta{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6B6B6B;margin-bottom:16px}
  h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(32px,5vw,48px);font-weight:700;line-height:1.1;margin-bottom:24px;color:#2B2B2B}
  .hero-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;margin-bottom:36px;display:block}
  .post-body h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;margin:36px 0 12px}
  .post-body h3{font-size:20px;font-weight:600;margin:28px 0 8px}
  .post-body p{margin-bottom:20px;font-size:17px;color:#2B2B2B}
  .post-body strong{font-weight:600}
  .post-cta{margin-top:48px;padding:32px;background:#EAF0EB;border-radius:12px;text-align:center}
  .post-cta p{color:#2B2B2B;margin-bottom:16px;font-size:16px}
  .post-cta a{display:inline-block;background:#5E7A65;color:#fff;text-decoration:none;border-radius:999px;padding:14px 32px;font-weight:600;font-size:15px}
  .breadcrumb{margin-bottom:12px;font-size:13px}
  .breadcrumb a{color:#4F6754}
  footer{background:#2B2B2B;color:#fff;text-align:center;padding:28px 24px;font-size:13px}
  footer a{color:#fff;text-decoration:underline;text-underline-offset:3px;margin:0 8px}
</style>
</head>
<body>
<header>
  <div class="inner">
    <a href="/" class="site-logo">Belle Allure</a>
    <a href="/blog/" class="nav-back">All posts</a>
  </div>
</header>

<div class="post-wrap">
  <p class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/blog/">Blog</a> &rsaquo; ${data.title}</p>
  <p class="post-meta">${data.date}</p>
  <h1>${data.title}</h1>
  ${data.image ? `<img class="hero-img" src="${data.image}" alt="${data.image_alt || data.title}">` : ''}
  <div class="post-body">
    ${bodyHtml}
  </div>
  <div class="post-cta">
    <p>Ready to book a consultation with Katherine?</p>
    <a href="https://go.forms.app/belleallureaestheticsandwellness/book">Book a Free Consultation</a>
  </div>
</div>

<footer>
  <a href="/">Home</a>
  <a href="/services.html">Services</a>
  <a href="/about.html">About</a>
  <a href="/contact.html">Contact</a>
  <p style="margin-top:14px;opacity:.6">&copy; 2025 Belle Allure Aesthetics and Wellness &middot; Elkhart, IN</p>
</footer>
</body>
</html>`;

  fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
  console.log(`Built: /blog/${slug}/`);
});

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(
  path.join(blogDir, 'posts.json'),
  JSON.stringify(posts, null, 2)
);

console.log(`Done. ${posts.length} post(s) indexed.`);
