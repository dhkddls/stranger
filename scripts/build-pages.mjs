import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, {recursive:true, force:true});
await mkdir(new URL('src/', dist), {recursive:true});
for (const file of ['index.html','style.css','src/app.js','src/story.js']) {
  await copyFile(new URL(file, root), new URL(file, dist));
}
await writeFile(new URL('.nojekyll', dist), '');
console.log('Built dist/: game files only.');
