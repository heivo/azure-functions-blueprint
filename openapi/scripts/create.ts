import * as fs from 'fs';
import generate from '../generate';

(async () => {
  try {
    const fileContent = await generate();

    fs.writeFileSync(`./open-api.json`, fileContent, {
      encoding: 'utf-8',
    });
    console.log(`Created ${process.cwd()}/open-api.json`);
  } catch (err) {
    console.error('Failed to generate document:', err);
    process.exit(1);
  }
})();
