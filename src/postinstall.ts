import * as fs from 'fs';
import constants, { all as allConstants } from './constants';

// find .git directory

// create symlink to gitSentinel

const gitHooksDir = findGitDir();
if (!gitHooksDir) {
  console.error('.git directory not found. Maybe not a git repo.');
  process.exit(1);
}

console.log('found git hooks dir', gitHooksDir);
const currentDir = __dirname;

const precommit = `#!/bin/sh

node ${__dirname.split(constants.dirDelimiter).join(allConstants.Linux.dirDelimiter)}/../dist/run.js
`;

console.log('data', precommit);

const filename = `${gitHooksDir}${constants.dirDelimiter}pre-commit`;
fs.writeFileSync(filename, precommit);
fs.chmodSync(filename, '755');

function findGitDir(): string {
  let dir = __dirname;
  while (dir.length) {
    dir = dir.substr(0, dir.lastIndexOf(constants.dirDelimiter));
    if (fs.existsSync(`${dir}${constants.dirDelimiter}.git`)) {
      return `${dir}${constants.dirDelimiter}.git${constants.dirDelimiter}hooks`;
    }
  }

  return '';
}
