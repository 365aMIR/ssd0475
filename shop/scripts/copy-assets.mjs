// Copies the shared radio art and beats over from winwinwin, so both sites run
// off the same files without keeping a second copy in git by hand.
//
//   npm run assets
//
// Looks for ../../winwinwin/libre-dash/public next to this repo. Pass another
// path as the first argument if it lives somewhere else.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const shopRoot = path.resolve(here, '..');
const source = path.resolve(process.argv[2] ?? path.join(shopRoot, '..', '..', 'winwinwin', 'libre-dash', 'public'));

if (!fs.existsSync(source)) {
    console.error(`Can't find the winwinwin public folder at ${source}`);
    process.exit(1);
}

// The radio and its cards need exactly these images.
const IMAGES = ['cd_audio_cd-0_256.png', 'loudspeaker_rays-1_256.png', 'shortcut.png', 'media_player_stream_no.png', 'su00kiradi0.png', 'br 1.png', 'br 2.png', 'br 3.png', 'br 4.png'];

const copy = (from, to) => {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
};

let count = 0;
for (const file of IMAGES) {
    const from = path.join(source, 'img', file);
    if (!fs.existsSync(from)) {
        console.warn(`missing: img/${file}`);
        continue;
    }
    copy(from, path.join(shopRoot, 'public', 'img', file));
    count++;
}

const beatsFrom = path.join(source, 'beats');
if (fs.existsSync(beatsFrom)) {
    for (const file of fs.readdirSync(beatsFrom)) {
        if (!file.toLowerCase().endsWith('.mp3')) continue;
        copy(path.join(beatsFrom, file), path.join(shopRoot, 'public', 'beats', file));
        count++;
    }
} else {
    console.warn('no beats folder found');
}

console.log(`copied ${count} files from ${source}`);
