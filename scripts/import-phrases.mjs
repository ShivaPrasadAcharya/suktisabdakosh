// Node built-ins only. Run from the repository root.
import {readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

export function parseText(text, filename = 'input.txt') {
  const entries = [];
  let entry = null, field = null;
  function finish() {
    if (!entry) return;
    for (const key of ['phrase','meaning']) {
      if (!entry[key]?.trim()) throw new Error(`${filename}: missing ${key} near entry ${entries.length + 1}`);
      entry[key] = entry[key].trim().replace(/\n+/g,'<br>');
    }
    entries.push(entry);
  }
  for (const [index,line] of text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n').entries()) {
    const marker = line.match(/^\s*(phrase|meaning)\s*[-–—:]\s*(.*)$/i);
    if (marker) {
      const key = marker[1].toLowerCase();
      if (key === 'phrase') { finish(); entry = {phrase:marker[2],meaning:''}; field = 'phrase'; }
      else {
        if (!entry || field === 'meaning') throw new Error(`${filename}:${index + 1}: unexpected meaning marker`);
        entry.meaning = marker[2]; field = 'meaning';
      }
    } else if (line.trim()) {
      if (!entry) throw new Error(`${filename}:${index + 1}: expected phrase-`);
      entry[field] += `\n${line}`;
    }
  }
  finish();
  return entries;
}

async function findTextFiles(dir = '.') {
  const result = [];
  for (const item of await readdir(dir,{withFileTypes:true})) {
    if (item.name.startsWith('.') || ['node_modules','_site'].includes(item.name)) continue;
    const file = path.join(dir,item.name);
    if (item.isDirectory()) result.push(...await findTextFiles(file));
    else if (item.isFile() && /\.txt$/i.test(item.name)) result.push(file);
  }
  return result.sort();
}
const keyOf = value => value.normalize('NFC').replace(/<br\s*\/?\s*>/gi,' ').replace(/\s+/gu,' ').trim().toLowerCase();
async function main() {
  const data = JSON.parse(await readFile('phrases.json','utf8'));
  if (!Array.isArray(data) || data.some(e => !e || Object.keys(e).sort().join(',') !== 'meaning,phrase' || typeof e.phrase !== 'string' || typeof e.meaning !== 'string' || !e.phrase.trim() || !e.meaning.trim())) throw new Error('Invalid phrases.json');
  const merged = new Map(data.map(e => [keyOf(e.phrase), e]));
  const imported = new Map();
  for (const filename of await findTextFiles()) {
    const bytes = await readFile(filename);
    const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    for (const entry of parseText(text,filename)) {
      const key = keyOf(entry.phrase);
      if (imported.has(key) && imported.get(key).meaning !== entry.meaning) throw new Error(`Conflicting meanings for "${entry.phrase}" in uploaded text files`);
      imported.set(key,entry); merged.set(key,entry);
    }
  }
  // Write only after every file has passed validation.
  await writeFile('phrases.json',JSON.stringify([...merged.values()],null,2) + '\n');
  console.log(`Imported ${imported.size} phrases; total ${merged.size}.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
