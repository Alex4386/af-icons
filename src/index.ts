import Banner from './common/banner';
import Pictograms from './common/pictograms';
import fs from 'fs';
import path from 'path';
import { XMLSerializer } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';
import ChildProcess from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DOMPoint } = require('./common/utils/index.js');

const jsdom = new JSDOM('', { pretendToBeVisual: true });
jsdom.window.XMLSerializer = XMLSerializer;

global.window = jsdom.window as any;
global.window.DOMPoint = DOMPoint;
global.DOMPoint = DOMPoint;
global.XMLSerializer = XMLSerializer;
global.document = jsdom.window.document as any;

Banner.showBanner();

(async () => {
  console.log('Downloading Pictograms...');
  const res = await Pictograms.fetchPictorgrams();

  const rootPath = path.join(res, 'pdf');

  const targetPath = path.join('.', 'target');
  if (!fs.existsSync(targetPath)) await fs.promises.mkdir(targetPath);

  const svgRoot = path.join(targetPath, 'svg');
  const iconPath = path.join(targetPath, 'icons');

  if (!fs.existsSync(svgRoot)) await fs.promises.mkdir(svgRoot);

  console.log('Converting PDF to SVG...');
  const categories = await fs.promises.readdir(rootPath);
  // categories = categories.slice(0, 1);

  for (const category of categories) {
    const categoryPath = path.join(rootPath, category);

    const result = await fs.promises.readdir(categoryPath);
    const icons = result.filter((n) => n.endsWith('.pdf'));

    const categorySVGRoot = path.join(svgRoot, category);

    if (!fs.existsSync(categorySVGRoot)) {
      await fs.promises.mkdir(categorySVGRoot, { recursive: true });
    }

    for (const icon of icons) {
      const iconPath = path.join(categoryPath, icon);

      // convert using pdf2svg
      const svgPath = path.join(svgRoot, category, icon.replace('.pdf', '.svg'));

      // run pdf2svg via shell command with promise
      await new Promise<void>((resolve, reject) => {
        ChildProcess.exec(`pdf2svg "${iconPath}" "${svgPath}"`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  console.log('Building webfont ready icon-structure from icons.json...');
  const icons = JSON.parse(await fs.promises.readFile('icons.json', 'utf-8'));
  if (!fs.existsSync(iconPath)) fs.mkdirSync(iconPath);

  for (const icon of icons) {
    const svgPath = path.join(svgRoot, icon.category, icon.name);
    const svg = await fs.promises.readFile(svgPath + '.svg', 'utf-8');

    if (icon.id) {
      const mainId = typeof icon.id === 'string' ? icon.id : icon.id[0];
      const thisIconPath = path.join(iconPath, `${mainId}.svg`);
      await fs.promises.writeFile(thisIconPath, svg);

      const altIds = typeof icon.id === 'string' ? [] : icon.id.slice(1);
    }
  }
})();
