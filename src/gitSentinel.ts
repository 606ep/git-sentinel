import { execSync } from 'child_process';
import * as fs from 'fs';
import constants from './constants';

interface IRule {
  name: string;
  mask: string;
  separate?: boolean;
  stopOnErrors?: boolean;
  cwd?: string;
  commands: string[];
}

export interface IConfig {
  rules: IRule[];
}

const logger = console;

export default class GitSentinel {
  private settings: IConfig;

  private changedFiles: string[] = [];

  private errors: {cmd: string, message: string}[] = [];
  private statuses: {cmd: string, success: boolean, message: string}[] = [];

  constructor() {
    const config = this.findConfig();

    if (!config) {
      console.log('sentinel.json not found');
      process.exit(1);
    }

    this.settings = config;
  }

  public findConfig() {
    let dir = __dirname;
    // console.log({ dir });
    while (dir.length) {
      dir = dir.substr(0, dir.lastIndexOf(constants.dirDelimiter));
      if (fs.existsSync(`${dir}/sentinel.json`)) {
        const config = JSON.parse(fs.readFileSync(`${dir}/sentinel.json`).toString());
        return config;
      }
    }
  }

  public fire(): number {
    this.findConfig();
    this.changedFiles = this.getChangedFiles();

    this.writeChangedFiles();

    for (const rule of this.settings.rules) {
      const firedFiles = this.conditionMet(this.changedFiles, rule.mask);
      // logger.info('starting rule', rule.name);
      // logger.info('firedFiles', firedFiles);
      if (firedFiles.length) {
        this.fireRule(rule, firedFiles);
      }
    }
    // console.log('\x1b[0m');
    // console.log('Статусы', this.statuses);
    this.writeErrors();
    return this.errors.length ? 1 : 0;
  }

  protected writeChangedFiles() {
    if (this.changedFiles.length) {
      console.log('\x1b[36m', 'Файлы');
      for (const file of this.changedFiles) {
        process.stdout.write(`- ${file} \n`);
      }
      process.stdout.write('\n\n');
    } else {
      console.log('Файлы не были изменены');
    }
  }

  protected writeErrors() {
    if (this.errors.length) {
      console.log('\x1b[31m', 'Ошибки');
      for (const err of this.errors) {
        process.stdout.write(`${err.cmd} : \n`);
        process.stdout.write(err.message);
        process.stdout.write('\n\n');
      }
      console.log('\x1b[0m');
    } else {
      console.log('\x1b[32m', 'Ошибок нет');
      console.log('\x1b[0m');
    }
  }

  protected conditionMet(changedFiles: string[], mask: string): string[] {
    return changedFiles.filter((el) => {

      const match = el.match(new RegExp(mask));
      if (match && match.length > 0) {
        return true;
      }

      return false;
    });
  }

  protected fireRule(rule: IRule, files: string[]) {
    let filesToFire = files;
    if (!rule.separate) {
      filesToFire = [''];
    }

    const commands = rule.commands;

    for (const file of filesToFire) {
      for (const cmd of commands) {
        const success = this.runCmd(this.getCmdForFilename(file, cmd));
        if (!success && rule.stopOnErrors) {
          return;
        }
      }
    }
  }

  private runCmd(cmd): boolean {
    let message = '';
    let success = true;

    try {
      const cmdRet = execSync(cmd, { stdio: ['pipe', 'pipe' , 'ignore'] });
      message = cmdRet.toString().trim();
    } catch (err) {
      success = false;
      message = err.output[1].toString().trim();
    }

    this.statuses.push({
      cmd,
      success,
      message,
    });

    this.addStatus(cmd, success, message);
    return success;
  }

  private addStatus(cmd: string, success: boolean, message: string) {
    this.statuses.push({ cmd, success, message });
    if (!success) {
      this.errors.push({ cmd, message });
    }
  }

  /**
   * Возвращает список измененных в этом коммите файлов
   */
  private getChangedFiles(): string[] {
    const ret = execSync('git diff HEAD --name-only');

    const newFiles = ret.toString().split('\n').filter(e => e);

    return newFiles;
  }

  /**
   * Подставляем название файла в команду, заменяя ${filename} на название файла
   *
   * @param filename - название файла
   * @param cmd - команда
   */
  private getCmdForFilename(filename: string, cmd: string) {
    return cmd.replace('${filename}', filename);
  }
}
