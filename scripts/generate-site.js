/**
 * SKS Website Generator
 * 扫描仓库中的 Skills，动态生成官网 index.html
 *
 * 用法: node scripts/generate-site.js [outputDir]
 * 输出: <outputDir>/index.html
 */
// ─── 自动检查并安装依赖 ──────────────────────────────────
try {
  require('yaml');
} catch (e) {
  console.log('📦 未检测到 yaml 依赖，正在自动安装...');
  const { execSync } = require('child_process');
  // 在当前目录直接安装 yaml 包
  execSync('npm install yaml --no-save', { stdio: 'inherit' });
  console.log('✅ yaml 安装成功，继续执行脚本。\n');
}
// ────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(ROOT, 'out');

// ─── Skill discover ──────────────────────────────────
function discoverSkills() {
  const skills = [];
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name === 'node_modules' ||
        entry.name === 'dist' || entry.name === 'src' || entry.name === 'scripts' ||
        entry.name === 'out') continue;

    const dir = path.join(ROOT, entry.name);
    const skillMd = path.join(dir, 'SKILL.md');
    const sksYaml = path.join(dir, 'sks.yaml');
    const promptMd = path.join(dir, 'prompt.md');

    // Must have at least SKILL.md or sks.yaml
    if (!fs.existsSync(skillMd) && !fs.existsSync(sksYaml)) continue;

    let meta = { name: entry.name, version: '1.0.0', author: 'community', description: '', tags: [], targets: ['claude', 'codex', 'cursor'] };

    // Parse sks.yaml
    if (fs.existsSync(sksYaml)) {
      try {
        const raw = fs.readFileSync(sksYaml, 'utf8');
        const parsed = yaml.parse(raw) || {};
        if (parsed.name) meta.name = parsed.name;
        if (parsed.version) meta.version = parsed.version;
        if (parsed.author) meta.author = parsed.author;
        if (parsed.description) meta.description = parsed.description;
        if (parsed.tags && Array.isArray(parsed.tags)) meta.tags = parsed.tags;
        if (parsed.targets && Array.isArray(parsed.targets)) meta.targets = parsed.targets;
      } catch (e) { console.warn(`Warning: failed to parse ${sksYaml}`, e.message); }
    }

    // Parse SKILL.md frontmatter
    if (fs.existsSync(skillMd)) {
      try {
        const raw = fs.readFileSync(skillMd, 'utf8');
        if (raw.startsWith('---')) {
          const end = raw.indexOf('---', 3);
          if (end > 0) {
            const fm = yaml.parse(raw.slice(3, end)) || {};
            if (fm.name && !meta.name) meta.name = fm.name;
            if (fm.description && !meta.description) meta.description = fm.description;
          }
        }
      } catch (e) { console.warn(`Warning: failed to parse ${skillMd}`, e.message); }
    }

    skills.push(meta);
  }

  return skills;
}

// ─── Color assignment ───────────────────────────────
const COLORS = ['cyan', 'emerald', 'violet', 'amber', 'rose'];
const ICONS = ['🏗️', '📦', '📸', '🔧', '🎨', '📊', '🤖', '⚡', '🔍', '📝'];
const TARGET_COLORS = { claude: '#f97316', codex: '#22d3ee', cursor: '#a78bfa' };
const TARGET_LABELS = { claude: 'Claude', codex: 'Codex', cursor: 'Cursor' };

function assignVisuals(skills) {
  return skills.map((s, i) => ({
    ...s,
    color: COLORS[i % COLORS.length],
    icon: ICONS[i % ICONS.length],
    colorClass: COLORS[i % COLORS.length]
  }));
}

// ─── Generate HTML ───────────────────────────────────
function generateHtml(skills) {
  const skillsJson = JSON.stringify(skills, null, 2);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SKS — AI Skills 包管理器</title>
  <meta name="description" content="SKS 是统一管理 AI Skills 的命令行工具，支持 Claude、Codex、Cursor。GitHub-based Registry + Symlink Projection System。">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #020617; --bg-card: rgba(15,23,42,0.6); --border: #1e293b;
      --border-hover: #334155; --text: #e2e8f0; --text-muted: #94a3b8;
      --text-dim: #64748b; --cyan: #22d3ee; --cyan-bg: rgba(8,51,68,0.7);
      --emerald: #34d399; --emerald-bg: rgba(6,78,59,0.7);
      --violet: #a78bfa; --violet-bg: rgba(76,29,149,0.7);
      --amber: #fbbf24; --amber-bg: rgba(120,53,15,0.5);
      --rose: #fb7185; --rose-bg: rgba(136,19,55,0.5);
      --radius: 0.75rem;
    }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg); color: var(--text);
      min-height: 100vh; line-height: 1.6;
    }
    .noise {
      position: fixed; inset: 0;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 0;
    }
    .gradient-bg {
      position: fixed; inset: 0; z-index: -1;
      background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.08), transparent),
                  radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167,139,250,0.06), transparent);
    }
    nav {
      position: sticky; top: 0; z-index: 100;
      backdrop-filter: blur(16px); background: rgba(2,6,23,0.8);
      border-bottom: 1px solid var(--border); padding: 0 2rem;
    }
    .nav-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 56px; }
    .nav-logo { display: flex; align-items: center; gap: 0.5rem; font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; color: var(--text); text-decoration: none; }
    .nav-logo .dot { width: 10px; height: 10px; background: var(--cyan); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: color 0.2s; }
    .nav-links a:hover { color: var(--text); }
    .nav-version { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-dim); background: rgba(30,41,59,0.7); padding: 0.2rem 0.6rem; border-radius: 0.35rem; }
    .hero { max-width: 1280px; margin: 0 auto; padding: 5rem 2rem 4rem; text-align: center; position: relative; z-index: 1; }
    .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; border-radius: 2rem; border: 1px solid rgba(34,211,238,0.3); background: rgba(34,211,238,0.06); font-size: 0.8rem; color: var(--cyan); margin-bottom: 1.5rem; }
    .hero-badge .live-dot { width: 7px; height: 7px; background: var(--emerald); border-radius: 50%; animation: pulse 1.5s infinite; }
    .hero h1 { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 1rem; }
    .hero h1 .accent { color: var(--cyan); }
    .hero p { font-size: 1.15rem; color: var(--text-muted); max-width: 640px; margin: 0 auto 2rem; line-height: 1.7; }
    .hero-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.4rem; border-radius: 0.5rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 600; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .btn-primary { background: var(--cyan); color: #020617; }
    .btn-primary:hover { background: #38dff0; transform: translateY(-1px); }
    .btn-secondary { background: rgba(30,41,59,0.6); color: var(--text); border-color: var(--border); }
    .btn-secondary:hover { background: rgba(30,41,59,0.8); border-color: var(--border-hover); }
    .stats-bar { max-width: 1000px; margin: 0 auto 2rem; padding: 0 2rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; position: relative; z-index: 1; }
    .stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; text-align: center; }
    .stat-num { font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; color: var(--cyan); }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
    .section { max-width: 1280px; margin: 0 auto; padding: 3rem 2rem; position: relative; z-index: 1; }
    .section-header { margin-bottom: 2rem; }
    .section-header h2 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .section-header .sub { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.35rem; }
    .search-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
    .search-input { flex: 1; min-width: 260px; padding: 0.7rem 1rem; border-radius: 0.5rem; border: 1px solid var(--border); background: rgba(15,23,42,0.7); color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
    .search-input:focus { border-color: var(--cyan); }
    .search-input::placeholder { color: var(--text-dim); }
    .filter-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .filter-tag { padding: 0.35rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text-muted); transition: all 0.2s; }
    .filter-tag:hover { border-color: var(--border-hover); color: var(--text); }
    .filter-tag.active { background: rgba(34,211,238,0.12); border-color: rgba(34,211,238,0.4); color: var(--cyan); }
    .result-count { font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1rem; }
    .result-count span { color: var(--cyan); font-weight: 600; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .skill-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; transition: all 0.25s; position: relative; overflow: hidden; }
    .skill-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .skill-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0; transition: opacity 0.25s; }
    .skill-card:hover::before { opacity: 1; }
    .skill-card.card-cyan::before { background: var(--cyan); }
    .skill-card.card-emerald::before { background: var(--emerald); }
    .skill-card.card-violet::before { background: var(--violet); }
    .skill-card.card-amber::before { background: var(--amber); }
    .skill-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.75rem; }
    .skill-icon { width: 40px; height: 40px; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .skill-card h3 { font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; font-weight: 600; margin-top: 0.4rem; }
    .skill-card .version { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--text-dim); padding: 0.15rem 0.5rem; border-radius: 0.3rem; background: rgba(30,41,59,0.5); }
    .skill-card .desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .skill-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .skill-tag { font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 0.25rem; }
    .skill-tag.cyan { background: var(--cyan-bg); color: var(--cyan); border: 1px solid rgba(34,211,238,0.35); }
    .skill-tag.emerald { background: var(--emerald-bg); color: var(--emerald); border: 1px solid rgba(52,211,153,0.35); }
    .skill-tag.violet { background: var(--violet-bg); color: var(--violet); border: 1px solid rgba(167,139,250,0.35); }
    .skill-tag.amber { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(251,191,36,0.35); }
    .skill-tag.rose { background: var(--rose-bg); color: var(--rose); border: 1px solid rgba(251,113,133,0.35); }
    .skill-targets { display: flex; gap: 0.4rem; align-items: center; }
    .target-dot { width: 8px; height: 8px; border-radius: 50%; }
    .target-label { font-size: 0.7rem; color: var(--text-dim); }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .feature-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; transition: border-color 0.2s; }
    .feature-card:hover { border-color: var(--border-hover); }
    .feature-icon { font-size: 1.6rem; margin-bottom: 0.75rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 0.65rem; }
    .feature-card h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; }
    .feature-card p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.65; }
    .code-block { background: rgba(0,0,0,0.45); border: 1px solid var(--border); border-radius: 0.65rem; padding: 1.25rem 1.5rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.8; color: var(--text-muted); overflow-x: auto; position: relative; }
    .code-block .prompt { color: var(--emerald); }
    .code-block .cmd { color: var(--text); }
    .code-block .comment { color: var(--text-dim); }
    .arch-diagram { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; overflow-x: auto; }
    .arch-flow { display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap; min-width: 600px; }
    .arch-node { text-align: center; padding: 1rem 1.5rem; background: rgba(15,23,42,0.8); border: 1px solid var(--border); border-radius: 0.65rem; min-width: 120px; }
    .arch-node .icon { font-size: 1.5rem; margin-bottom: 0.35rem; }
    .arch-node .label { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 600; }
    .arch-node .sub { font-size: 0.65rem; color: var(--text-dim); margin-top: 0.15rem; }
    .arch-arrow { font-size: 1.4rem; color: var(--text-dim); padding: 0 0.5rem; font-family: 'JetBrains Mono', monospace; }
    .cta { text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, rgba(34,211,238,0.04), rgba(167,139,250,0.04)); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); position: relative; z-index: 1; }
    .cta h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; }
    .cta p { color: var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem; font-size: 0.95rem; }
    footer { max-width: 1280px; margin: 0 auto; padding: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--text-dim); position: relative; z-index: 1; }
    footer a { color: var(--text-muted); text-decoration: none; }
    footer a:hover { color: var(--text); }
    .no-results { text-align: center; padding: 3rem; color: var(--text-dim); }
    .no-results .icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .no-results p { font-size: 0.9rem; }
    .count-up { transition: all 0.5s ease; }
    @media (max-width: 768px) {
      .stats-bar { grid-template-columns: 1fr; }
      .hero h1 { font-size: 2rem; }
      .hero p { font-size: 1rem; }
      .search-bar { flex-direction: column; }
      .skills-grid { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="noise"></div>
  <div class="gradient-bg"></div>
  <nav>
    <div class="nav-inner">
      <a href="#" class="nav-logo"><span class="dot"></span> SKS</a>
      <div class="nav-links">
        <a href="#skills">Skills</a>
        <a href="#features">Features</a>
        <a href="#install">Install</a>
        <a href="#architecture">Architecture</a>
        <span class="nav-version">v0.1.2</span>
      </div>
    </div>
  </nav>
  <section class="hero">
    <div class="hero-badge"><span class="live-dot"></span> Open Source · MIT License</div>
    <h1>像管理软件包一样<br>管理你的 <span class="accent">AI Skills</span></h1>
    <p>SKS 是面向 Claude、Codex、Cursor 的 AI Skills 包管理器。基于 GitHub Registry，通过 Symlink 投影机制，实现一次安装，所有 AI 工具即时生效。</p>
    <div class="hero-actions">
      <a href="#install" class="btn btn-primary">⚡ 快速开始</a>
      <a href="#skills" class="btn btn-secondary">📦 浏览 Skills</a>
    </div>
  </section>
  <div class="stats-bar">
    <div class="stat">
      <div class="stat-num count-up" id="skillCount">${skills.length}</div>
      <div class="stat-label">已收录 Skills</div>
    </div>
    <div class="stat">
      <div class="stat-num">13</div>
      <div class="stat-label">CLI 命令</div>
    </div>
    <div class="stat">
      <div class="stat-num">3</div>
      <div class="stat-label">AI 工具适配</div>
    </div>
  </div>
  <section class="section" id="skills">
    <div class="section-header">
      <h2>📦 Skills 市场</h2>
      <p class="sub">探索社区贡献的 AI Skills，一键安装到你的工作流</p>
    </div>
    <div class="search-bar">
      <input type="text" class="search-input" id="searchInput" placeholder="搜索 Skills（名称、描述、标签）..." autocomplete="off">
      <div class="filter-tags" id="filterTags">
        <span class="filter-tag active" data-filter="all">全部</span>
        <span class="filter-tag" data-filter="claude">Claude</span>
        <span class="filter-tag" data-filter="codex">Codex</span>
        <span class="filter-tag" data-filter="cursor">Cursor</span>
      </div>
    </div>
    <div class="result-count" id="resultCount">共 <span id="resultNum">${skills.length}</span> 个 Skills</div>
    <div class="skills-grid" id="skillsGrid"></div>
    <div class="no-results" id="noResults" style="display:none">
      <div class="icon">🔍</div><p>没有找到匹配的 Skills，试试其他关键词吧</p>
    </div>
  </section>
  <section class="section" id="features">
    <div class="section-header">
      <h2>⚡ 核心特性</h2>
      <p class="sub">为什么选择 SKS 管理你的 AI Skills</p>
    </div>
    <div class="features-grid">
      <div class="feature-card"><div class="feature-icon" style="background:rgba(8,51,68,0.5)">🔗</div><h3>Symlink 投影同步</h3><p>不复制文件，通过符号链接将 Skills 即时投影到 Claude、Codex、Cursor，更新一次全局生效。</p></div>
      <div class="feature-card"><div class="feature-icon" style="background:rgba(6,78,59,0.5)">🌐</div><h3>零服务器架构</h3><p>基于 GitHub 作为唯一 Registry，无需自建服务器或数据库，完全去中心化。</p></div>
      <div class="feature-card"><div class="feature-icon" style="background:rgba(76,29,149,0.5)">⚙️</div><h3>开发模式（Link）</h3><p>本地开发的 Skill 可通过 <code>sks link</code> 快速接入，修改即时生效。</p></div>
      <div class="feature-card"><div class="feature-icon" style="background:rgba(120,53,15,0.5)">📋</div><h3>幂等同步引擎</h3><p>sync 命令采用「期望 vs 当前」三路 Diff 算法，确保每次结果一致。</p></div>
      <div class="feature-card"><div class="feature-icon" style="background:rgba(30,58,138,0.5)">🔍</div><h3>统一搜索 & 安装</h3><p><code>sks search</code> 搜索、<code>sks install</code> 一键安装，像 npm 一样简单。</p></div>
      <div class="feature-card"><div class="feature-icon" style="background:rgba(136,19,55,0.5)">🔄</div><h3>导入已有 Skills</h3><p><code>sks import</code> 自动发现 AI 工具中已有的 Skills，纳入 SKS 统一管理。</p></div>
    </div>
  </section>
  <section class="section" id="install">
    <div class="section-header"><h2>🚀 快速安装</h2><p class="sub">Node.js 22+ 环境，一行命令搞定</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start;">
      <div class="code-block" style="margin-bottom:1rem">
<span class="comment"># 安装到全局</span>
<span class="prompt">$</span> <span class="cmd">npm install -g @lxchinesszz/sks</span>
<span class="comment"># 验证安装</span>
<span class="prompt">$</span> <span class="cmd">sks --version</span>
<span style="color:var(--text-dim)">→ 0.1.2</span>
<span class="comment"># 搜索并安装 Skill</span>
<span class="prompt">$</span> <span class="cmd">sks search blueprint</span>
<span class="prompt">$</span> <span class="cmd">sks install blueprint</span>
<span class="comment"># 同步到 AI 工具</span>
<span class="prompt">$</span> <span class="cmd">sks sync</span>
      </div>
      <div class="code-block">
<span class="comment"># 常用命令一览</span>
<span class="prompt">$</span> <span class="cmd">sks list</span>       <span class="comment"># 列出已安装</span>
<span class="prompt">$</span> <span class="cmd">sks search</span>     <span class="comment"># 搜索市场</span>
<span class="prompt">$</span> <span class="cmd">sks install</span>    <span class="comment"># 安装 Skill</span>
<span class="prompt">$</span> <span class="cmd">sks link</span>       <span class="comment"># 本地开发模式</span>
<span class="prompt">$</span> <span class="cmd">sks sync</span>       <span class="comment"># 同步到 AI 工具</span>
<span class="prompt">$</span> <span class="cmd">sks publish</span>    <span class="comment"># 发布到 Registry</span>
<span class="prompt">$</span> <span class="cmd">sks doctor</span>     <span class="comment"># 健康检查</span>
      </div>
    </div>
  </section>
  <section class="section" id="architecture">
    <div class="section-header"><h2>🏗️ 系统架构</h2><p class="sub">Symlink Reconciliation Engine — 核心同步机制</p></div>
    <div class="arch-diagram">
      <div class="arch-flow">
        <div class="arch-node" style="border-color:rgba(34,211,238,0.35)"><div class="icon">📦</div><div class="label">GitHub Registry</div><div class="sub">index.json</div></div>
        <div class="arch-arrow">→</div>
        <div class="arch-node" style="border-color:rgba(52,211,153,0.35)"><div class="icon">💾</div><div class="label">~/.sks/skills</div><div class="sub">Source of Truth</div></div>
        <div class="arch-arrow">→</div>
        <div class="arch-node" style="border-color:rgba(167,139,250,0.35)"><div class="icon">🔗</div><div class="label">Symlink Sync</div><div class="sub">四阶段引擎</div></div>
        <div class="arch-arrow">→</div>
        <div class="arch-node" style="border-color:rgba(251,191,36,0.35)"><div class="icon">🤖</div><div class="label">AI Tools</div><div class="sub">Claude · Codex · Cursor</div></div>
      </div>
    </div>
  </section>
  <div class="cta">
    <h2>开始构建你的 AI Skills 生态</h2>
    <p>加入 SKS 社区，分享你的专业 Skills，让 AI 变得更强大。</p>
    <div class="hero-actions" style="margin-top:0">
      <a href="#install" class="btn btn-primary">⚡ 立即安装</a>
      <a href="https://github.com/lxchinesszz/sks-registry" class="btn btn-secondary" target="_blank">📂 GitHub Registry</a>
    </div>
  </div>
  <footer><span>© 2026 SKS Contributors · MIT License</span><span>Made with ❤️ for the AI community</span></footer>
  <script>
    // ─── Auto-generated skills data ───
    var skills = ${skillsJson};
    var targetColors = ${JSON.stringify(TARGET_COLORS)};
    var targetLabels = ${JSON.stringify(TARGET_LABELS)};

    function getColorClass(c) {
      return (c === 'cyan' || c === 'emerald' || c === 'violet' || c === 'amber' || c === 'rose') ? c : 'cyan';
    }
    function renderSkills() {
      var activeFilter = document.querySelector('.filter-tag.active');
      var f = activeFilter ? activeFilter.dataset.filter : 'all';
      var q = (document.getElementById('searchInput').value || '').toLowerCase();
      var filtered = skills.filter(function(s) {
        var mf = f === 'all' || s.targets.indexOf(f) !== -1;
        var ms = !q || s.name.toLowerCase().indexOf(q) !== -1 || s.description.toLowerCase().indexOf(q) !== -1 || s.tags.some(function(t){return t.toLowerCase().indexOf(q)!==-1;}) || s.author.toLowerCase().indexOf(q)!==-1;
        return mf && ms;
      });
      document.getElementById('resultNum').textContent = filtered.length;
      var grid = document.getElementById('skillsGrid');
      var noRes = document.getElementById('noResults');
      if (filtered.length === 0) {
        grid.innerHTML = '';
        noRes.style.display = 'block';
      } else {
        noRes.style.display = 'none';
        grid.innerHTML = filtered.map(function(s) {
          return '<div class="skill-card card-' + getColorClass(s.colorClass || s.color) + '">' +
            '<div class="skill-card-header"><div class="skill-icon" style="background:rgba(34,211,238,0.15)">' + (s.icon || '📦') + '</div><span class="version">v' + s.version + '</span></div>' +
            '<h3>' + s.name + '</h3><p class="desc">' + (s.description || '') + '</p>' +
            '<div class="skill-tags">' + (s.tags || []).slice(0,4).map(function(t){return '<span class="skill-tag ' + getColorClass(s.colorClass||s.color) + '">' + t + '</span>';}).join('') + '</div>' +
            '<div class="skill-targets">' + s.targets.map(function(t){return '<span class="target-dot" style="background:' + (targetColors[t] || '#666') + '" title="' + (targetLabels[t] || t) + '"></span><span class="target-label">' + (targetLabels[t] || t) + '</span>';}).join('') + '</div>' +
            '</div>';
        }).join('');
      }
    }
    document.getElementById('searchInput').addEventListener('input', renderSkills);
    document.getElementById('filterTags').addEventListener('click', function(e) {
      if (e.target.classList.contains('filter-tag')) {
        document.querySelectorAll('.filter-tag').forEach(function(t){ t.classList.remove('active'); });
        e.target.classList.add('active');
        renderSkills();
      }
    });
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var t = document.querySelector(this.getAttribute('href'));
        if (t) t.scrollIntoView({behavior:'smooth'});
      });
    });
    renderSkills();
  </script>
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────
function main() {
  console.log('🔍 Scanning repo for skills...');
  const skills = discoverSkills();
  const styled = assignVisuals(skills);

  console.log(`📦 Found ${styled.length} skills:`);
  styled.forEach(s => console.log(`   - ${s.name} v${s.version} (${s.targets.join(', ')})`));

  // Write index.html
  const html = generateHtml(styled);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');

  console.log(`✅ Website generated: ${outPath} (${(html.length / 1024).toFixed(1)} KB)`);

  // Write a skills.json for potential API use
  fs.writeFileSync(path.join(OUT_DIR, 'skills.json'), JSON.stringify(styled, null, 2));
  console.log(`✅ Skills JSON: ${path.join(OUT_DIR, 'skills.json')}`);
}

main();
