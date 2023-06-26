import * as core from '@actions/core';

import { plus100ms } from './utils';

const main = async () => {
  const ms = core.getInput('milliseconds');
  core.debug(`Waiting ${ms} milliseconds ...`); // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

  core.debug(new Date().toTimeString());
  await new Promise((resolve) => setTimeout(resolve, plus100ms(ms)));
  core.debug(new Date().toTimeString());

  core.setOutput('time', new Date().toTimeString());
};

main().catch((error) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
});
