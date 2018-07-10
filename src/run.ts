import gitSentinel, { IConfig } from './gitSentinel';
import * as os from 'os';

const sent = new gitSentinel();
process.exit(sent.fire());
