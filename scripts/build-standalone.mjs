import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const [html, css, story, app] = await Promise.all(['index.html','style.css','src/story.js','src/app.js'].map(read));
const script = story.replace(/^export /gm, '') + '\n' + app.replace(/^import .* from '\.\/story\.js';\n/, '');
const output = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
  .replace('href="./"', 'href=""')
  .replace('<script type="module" src="src/app.js"></script>', `<script>\n${script.replace(/<\/script/gi, '<\\/script')}\n</script>`);
await writeFile(new URL('play.html', root), output);
console.log('Created play.html: standalone game, no server or external requests required.');
