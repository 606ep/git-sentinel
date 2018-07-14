import { Given, When, Then } from 'cucumber';
import gitSentinel, { IConfig, IRule } from '../../src/gitSentinel';
import * as sinon from 'sinon';
import { expect } from 'chai';

let sentinel;
let changedFiles: string[] = [];
let commands: string[] = [];

Given('there are the next rules:', (dataTable) => {
  const cfg: IConfig = {
    rules: [],
  };
  for (const item of dataTable.hashes()) {
    const rule:IRule = {
      name: item.name,
      mask: item.mask,
      stopOnErrors: item.stopOnErrors === 'true' ? true : false,
      separate: item.separate === 'true' ? true : false,
      commands: JSON.parse(item.commands),
    };

    cfg.rules.push(rule);
  }

  sentinel = new gitSentinel(cfg);
  commands = [];

  sinon.stub(sentinel, 'getChangedFiles').callsFake(() => changedFiles);
  sinon.stub(sentinel, 'runCmd').callsFake((cmd) => {
    commands.push(cmd);

    if (cmd.indexOf('error') === -1) {
      return false;
    }
    return true;
  });
});

Given('the next files changed {string}', (string) => {
  changedFiles = string.split(',').map(el => el.trim());
});

When('I fire precommit hook', () => {
  sentinel.fire();
});

Then('{string} should be run once', (string) => {
  const cmds = commands.filter(el => el === string);
  expect(cmds.length).to.be.equal(1);
});

Then('{string} should not be run', (string) => {
  const cmds = commands.filter(el => el === string);
  expect(cmds.length).to.be.equal(0);
});
