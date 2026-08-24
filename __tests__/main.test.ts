import * as cp from 'node:child_process';
import * as path from 'node:path';

describe.skip('main', () => {
  // shows how the runner will run a javascript action with env / stdout protocol
  it('test runs', () => {
    process.env.INPUT_MILLISECONDS = '500';
    const np = process.execPath;
    const ip = path.join(import.meta.dirname, '..', 'dist', 'index.mjs');
    const options: cp.ExecFileSyncOptions = {
      env: process.env,
    };
    // eslint-disable-next-line no-console
    console.log(cp.execFileSync(np, [ip], options).toString());
  });
});
