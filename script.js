// SETTINGS — change these links when copying this repository.
const REPO_URL = 'https://github.com/ShivaPrasadAcharya/suktisabdakosh';
const EDIT_URL = `${REPO_URL}/edit/main/phrases.json`;
const DEFAULTS = { theme:'light', columns:'2', size:16, sort:'asc', language:'all' };
const STORAGE_KEY = 'suktisabdakosh.settings.v1';

const NepaliNormalizer = {
  vowelMap: {'ी':'ि','ू':'ु','ृ':'ि','ऋ':'रि'},
  sibilantMap: {'श':'स','ष':'स'},
  nasalMap: {'ङ':'न','ण':'न','ञ':'न','ं':'न्'},
  vaBaMap: {'व':'ब'},
  numberMap: {'०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9'},
  _isDropped(ch, ignoreSpaces) {
    return ch === '\u200D' || ch === '\u200C' || (ignoreSpaces && /\s/u.test(ch));
  },
  _transformChar(ch) {
    for (const map of [this.vowelMap,this.sibilantMap,this.nasalMap,this.vaBaMap,this.numberMap]) ch = map[ch] ?? ch;
    return ch.toLowerCase();
  },
  _normalizeWithMap(text, opts = {}) {
    const src = text.normalize('NFC');
    let out = '';
    const indexMap = [];
    for (let i = 0; i < src.length; i++) {
      if (this._isDropped(src[i], opts.ignoreSpaces)) continue;
      for (const ch of this._transformChar(src[i])) {
        out += ch;
        indexMap.push(i);
      }
    }
    return {text:out, indexMap};
  },
  normalize(text, opts = {}) { return this._normalizeWithMap(text || '', opts).text; },
  isDevanagari(text) { return /[\u0900-\u097F]/u.test(text); },
  mapToOriginal(pos, original, normalized, opts = {}) {
    const {indexMap} = this._normalizeWithMap(original, opts);
    return pos <= 0 ? 0 : (indexMap[pos] ?? original.length);
  },
  search(query, original) {
    const q = this.normalize(query, {ignoreSpaces:true});
    const {text,indexMap} = this._normalizeWithMap(original, {ignoreSpaces:true});
    if (!q) return [];
    const matches = [];
    for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + 1)) {
      matches.push({start:indexMap[i], end:indexMap[i + q.length - 1] + 1});
    }
    return matches;
  },
  matches(query, text) { return this.search(query, text).length > 0; }
};

// Only a bare <br>, <br/> or <br /> becomes a newline; no HTML is parsed.
const plain = text => text.replace(/<br\s*\/?\s*>/gi, '\n').normalize('NFC');
const norm = text => NepaliNormalizer.normalize(text, {ignoreSpaces:true});
const words = text => text.match(/[\p{L}\p{M}\p{N}]+/gu) || [];
const $ = id => document.getElementById(id);
let settings = {...DEFAULTS}, entries = [], letter = '', ready = false;
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && typeof saved === 'object') {
    for (const [key, allowed] of Object.entries({theme:['light','dark'],columns:['1','2'],sort:['asc','desc'],language:['all','en','ne']})) {
      if (allowed.includes(saved[key])) settings[key] = saved[key];
    }
    if (Number.isFinite(saved.size)) settings.size = Math.max(12, Math.min(24, saved.size));
  }
} catch { /* Storage may be blocked; the dictionary still works. */ }

function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.columns = settings.columns;
  root.style.fontSize = `${settings.size}px`;
  for (const key of ['theme','columns','sort','language']) $(key).value = settings[key];
  $('smaller').disabled = settings.size <= 12;
  $('larger').disabled = settings.size >= 24;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

function matches(entry, query, mode) {
  const q = norm(query);
  if (!q) return true;
  const p = norm(entry.phrase), m = norm(entry.meaning);
  const has = term => p.includes(term) || m.includes(term);
  const terms = query.trim().split(/\s+/u).map(norm).filter(Boolean);
  switch (mode) {
    case 'any': return terms.some(has);
    case 'all': return terms.every(has);
    case 'begins': return p.startsWith(q) || m.startsWith(q);
    case 'ends': return p.endsWith(q) || m.endsWith(q);
    case 'letter': return p.startsWith(norm(Array.from(query.trim())[0] || ''));
    case 'word': return words(`${entry.phrase} ${entry.meaning}`).some(word => norm(word).startsWith(q));
    case 'not': return !has(q);
    case 'exact': return p === q || m === q;
    default: return has(q);
  }
}

function highlight(node, text, query, mode) {
  let terms = [query];
  if (mode === 'any' || mode === 'all') terms = query.trim().split(/\s+/u);
  if (mode === 'letter') terms = [Array.from(query.trim())[0] || ''];
  if (mode === 'not') terms = [];
  const ranges = terms.flatMap(term => NepaliNormalizer.search(term,text));
  // Include trailing marks so highlighting does not break Devanagari glyphs.
  for (const range of ranges) {
    while (range.end < text.length && /[\p{M}\u200C\u200D]/u.test(text[range.end])) range.end++;
  }
  ranges.sort((a,b) => a.start - b.start);
  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end,range.end);
    else merged.push({...range});
  }
  let cursor = 0;
  for (const range of merged) {
    node.append(document.createTextNode(text.slice(cursor,range.start)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(range.start,range.end);
    node.append(mark);
    cursor = range.end;
  }
  node.append(document.createTextNode(text.slice(cursor)));
}

function render() {
  if (!ready) return;
  const query = plain($('search').value), mode = $('filter').value;
  const filtered = entries.filter(entry =>
    (settings.language === 'all' || settings.language === entry.language) &&
    (!letter || entry.phrase.trimStart().toLocaleLowerCase().startsWith(letter.toLocaleLowerCase())) &&
    matches(entry, query, mode)
  ).sort((a,b) => {
    const group = Number(a.language === 'ne') - Number(b.language === 'ne');
    const order = group || a.phrase.replace(/\s+/gu,' ').trim().localeCompare(b.phrase.replace(/\s+/gu,' ').trim(), a.language, {sensitivity:'base'});
    return settings.sort === 'desc' ? -order : order;
  });
  const fragment = document.createDocumentFragment();
  for (const entry of filtered) {
    const row = document.createElement('div'); row.className = 'entry';
    const phrase = document.createElement('dt'), meaning = document.createElement('dd');
    phrase.lang = entry.language;
    meaning.lang = NepaliNormalizer.isDevanagari(entry.meaning) ? 'ne' : 'en';
    highlight(phrase,entry.phrase,query,mode);
    highlight(meaning,entry.meaning,query,mode);
    row.append(phrase,meaning); fragment.append(row);
  }
  $('results').replaceChildren(fragment);
  $('count').textContent = `${filtered.length} / ${entries.length}`;
  $('status').textContent = filtered.length ? '' : 'कुनै नतिजा भेटिएन। No matching entries. Clear the search or change the filters.';
  $('status').hidden = filtered.length > 0;
}

for (const link of document.querySelectorAll('[data-edit]')) link.href = EDIT_URL;
for (const link of document.querySelectorAll('[data-repo]')) link.href = REPO_URL;
$('upload').href = `${REPO_URL}/upload/main`;
$('menuButton').addEventListener('click', () => {
  $('menu').hidden = !$('menu').hidden;
  $('menuButton').setAttribute('aria-expanded',String(!$('menu').hidden));
});
$('menu').addEventListener('keydown',event => {
  if (event.key === 'Escape') {
    $('menu').hidden = true; $('menuButton').setAttribute('aria-expanded','false'); $('menuButton').focus();
  }
});
for (const key of ['theme','columns','sort','language']) $(key).addEventListener('change', () => {
  settings[key] = $(key).value; applySettings(); render();
});
for (const [id,delta] of [['smaller',-1],['reset',0],['larger',1]]) $(id).addEventListener('click', () => {
  settings.size = delta ? Math.max(12,Math.min(24,settings.size + delta)) : DEFAULTS.size;
  applySettings();
});
$('search').addEventListener('input',render);
$('filter').addEventListener('change',render);
for (const letters of [ ['All'], Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः'.split(' '), 'क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह'.split(' ') ]) {
  const row = document.createElement('div'); row.className = 'letter-row';
  for (const value of letters) {
    const button = document.createElement('button'); button.textContent = value;
    button.setAttribute('aria-pressed',String(value === 'All'));
    button.addEventListener('click', () => {
      letter = value === 'All' ? '' : value;
      for (const other of $('letters').querySelectorAll('button')) other.setAttribute('aria-pressed',String(other === button));
      render();
    });
    row.append(button);
  }
  $('letters').append(row);
}
for (const id of ['top','bottom']) $(id).addEventListener('click', () => window.scrollTo({
  top:id === 'top' ? 0 : document.documentElement.scrollHeight,
  behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}));
applySettings();
async function load() {
  try {
    const response = await fetch('phrases.json', {cache:'no-cache'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.some(item => !item || Object.keys(item).sort().join(',') !== 'meaning,phrase' || typeof item.phrase !== 'string' || typeof item.meaning !== 'string' || !item.phrase.trim() || !item.meaning.trim())) throw new Error('Invalid phrases.json: every entry must have only nonempty phrase and meaning strings.');
    entries = data.map(item => ({phrase:plain(item.phrase),meaning:plain(item.meaning),language:NepaliNormalizer.isDevanagari(plain(item.phrase)) ? 'ne' : 'en'}));
    ready = true; render();
  } catch (error) {
    $('count').textContent = 'Unavailable';
    $('status').textContent = `Could not load phrases. Use GitHub Pages or a local web server, and check phrases.json. ${error.message}`;
    const retry = document.createElement('button'); retry.textContent = 'Retry'; retry.addEventListener('click',load);
    $('status').append(' ',retry);
  }
}
load();
