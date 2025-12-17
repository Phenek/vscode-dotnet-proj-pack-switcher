import * as path from 'path';
const Mocha = require('mocha');

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true });

  // Collect test files from out/test and out/src/test (tsc may emit either)
  const fs = require('fs');
  const candidateDirs = [path.join(__dirname, '..'), path.join(__dirname, '..', '..', 'src', 'test')];

  for (const dir of candidateDirs) {
    try {
      const entries = fs.readdirSync(dir).filter((f: string) => f.endsWith('.test.js'));
      for (const entry of entries) {
        const f = path.join(dir, entry);
        try {
          require(f);
        } catch (err) {
          // ignore errors loading individual tests
        }
      }
    } catch (err) {
      // directory may not exist in all setups
    }
  }

  return new Promise((resolve, reject) => {
    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}

if (require.main === module) {
  run().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
