import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import JSZip from 'jszip';
import { existsSync } from 'fs';
import iconv from 'iconv-lite';

async function fetchPictorgrams(): Promise<string> {
  // get rokaf pictograms from the google drive link
  const pictogramGdriveId = `1p02bhHH_6p9uhwYlXqDYnMjFfBSRyUKv`;

  const targetPath = path.join(os.tmpdir(), 'rokaf-pictograms.zip');
  const targetExtractedPath = path.join(os.tmpdir(), 'rokaf-pictograms');

  let zipFile = null;

  if (!existsSync(targetPath)) {
    const data = await downloadGdriveFile(pictogramGdriveId, targetPath);
    zipFile = data.data;
  }

  if (!existsSync(targetExtractedPath)) {
    if (zipFile === null) zipFile = await fs.readFile(targetPath);

    const zip = await JSZip.loadAsync(zipFile, {
      decodeFileName: (fileName) => iconv.decode(fileName as Buffer, 'euc-kr'),
    });

    const targets = [];
    await fs.mkdir(targetExtractedPath, { recursive: true });

    for (const key of Object.keys(zip.files)) {
      const data = zip.files[key];

      // detect macOS temporary files
      if (data.name.split('/').find((n) => n.startsWith('._'))) continue;
      if (data.name.split('/').find((n) => n.startsWith('.DS_Store'))) continue;

      const targetPath = path.join(targetExtractedPath, data.name);
      console.log(data.name, targetPath);

      if (data.dir) {
        if (!existsSync(targetPath)) await fs.mkdir(targetPath, { recursive: true });
      } else {
        targets.push(
          (async () => {
            const dirname = path.dirname(targetPath);
            if (!existsSync(dirname)) await fs.mkdir(dirname, { recursive: true });

            await fs.writeFile(targetPath, await data.async('nodebuffer'));
          })(),
        );
      }
    }

    await Promise.all(targets);
  }
  return targetExtractedPath;
}

async function downloadGdriveFile(
  fileId: string,
  dest: string,
): Promise<{
  data: Buffer;
  path: string;
}> {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const downloadResponse = await axios.get(url, {
    responseType: 'arraybuffer',
  });
  const buffer = downloadResponse.data;
  await fs.writeFile(dest, buffer);

  return {
    data: buffer,
    path: dest,
  };
}

export default {
  fetchPictorgrams,
};
