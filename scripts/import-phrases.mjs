// Node built-ins only. Run from the repository root.
import {readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

export function parseText(text, filename = 'input.txt') {
  const entries = [];
  let entry = null, field = null;
  function finish() {
    if (!entry) return;
    for (const key of ['phrase','meaning','explanation']) {
      if (key !== 'explanation' && !entry[key]?.trim()) throw new Error(`${filename}: missing ${key} near entry ${entries.length + 1}`);
      entry[key] = entry[key].trim().replace(/\n+/g,'<br>');
    }
    entries.push(entry);
  }
  for (const [index,line] of text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n').entries()) {
    const marker = line.match(/^\s*(phrase|meaning|explanation)\s*[-–—:]\s*(.*)$/i);
    if (marker) {
      const key = marker[1].toLowerCase();
      if (key === 'phrase') { finish(); entry = {phrase:marker[2],meaning:'',explanation:''}; field = 'phrase'; }
      else {
        if (!entry || (key === 'meaning' && field !== 'phrase') || (key === 'explanation' && field !== 'meaning')) throw new Error(`${filename}:${index + 1}: unexpected ${key} marker`);
        entry[key] = marker[2]; field = key;
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
  const files = await findTextFiles();
  if (!files.length) throw new Error('No .txt dictionary files found');
  const merged = new Map();
  for (const filename of files) {
    const bytes = await readFile(filename);
    const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    for (const entry of parseText(text,filename)) {
      const key = keyOf(entry.phrase);
      const previous = merged.get(key);
      if (previous && (previous.meaning !== entry.meaning || previous.explanation !== entry.explanation)) {
        throw new Error(`Conflicting meanings or explanations for "${entry.phrase}" in ${previous.sources.join(', ')} and ${filename}`);
      }
      if (previous) previous.sources.push(filename);
      else merged.set(key,{...entry,sources:[filename]});
    }
  }
  // Write only after every file has passed validation.
  await writeFile('phrases.json',JSON.stringify([...merged.values()],null,2) + '\n');
  await writeFile('text-files.json',JSON.stringify(files,null,2) + '\n');
  console.log(`Imported ${merged.size} phrases from ${files.length} text files.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
