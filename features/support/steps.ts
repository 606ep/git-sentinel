import { Given } from 'cucumber';
import gitSentinel, { IConfig, IRule } from '../../src/gitSentinel';

let sentinel;

Given('there are the next rules:', (dataTable) => {
  const cfg: IConfig = {
    rules: [],
  };
  for (const item of dataTable.hashes()) {
    const rule:IRule = {
      name: item.name,
      mask: item.mask,
      stopOnErrors: item.stopOnErrors,
      separate: item.separate,
      commands: JSON.parse(item.commands),
    };

    cfg.rules.push(rule);
  }

  sentinel = new gitSentinel(cfg);
});
