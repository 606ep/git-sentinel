import { execSync } from 'child_process';
import * as fs from 'fs';
import constants from './constants';
import logger from './lib/logger';

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

export default class GitSentinel {
  private settings: IConfig;

  private changedFiles: string[] = [];

  private errors: {cmd: string, message: string}[] = [];
  private statuses: {cmd: string, success: boolean, message: string}[] = [];

  constructor() {
    const config = this.findConfig();

    if (!config) {
      logger.error('sentinel.json not found');
      process.exit(1);
    }

    this.settings = config;
  }

  /**
   * Ищем sentinel.json по дереву каталогов вверх,
   * когда нашли, парсим его и возвращаем
   */
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

  /**
   * Запуск всего
   */
  public fire(): number {
    this.changedFiles = this.getChangedFiles();

    this.writeChangedFiles();

    for (const rule of this.settings.rules) {
      const firedFiles = this.conditionMet(this.changedFiles, rule.mask);
      if (firedFiles.length) {
        this.fireRule(rule, firedFiles);
      }
    }
    this.writeErrors();
    return this.errors.length ? 1 : 0;
  }

  /**
   * Красивый вывод файлов, измененных в процессе коммита
   */
  protected writeChangedFiles() {
    if (this.changedFiles.length) {
      logger.log('\x1b[36m', 'Файлы');
      for (const file of this.changedFiles) {
        process.stdout.write(`- ${file} \n`);
      }
      process.stdout.write('\n\n');
    } else {
      logger.log('Файлы не были изменены');
    }
  }

  /**
   * Красивый вывод ошибок
   */
  protected writeErrors() {
    if (this.errors.length) {
      logger.log('\x1b[31m', 'Ошибки');
      for (const err of this.errors) {
        process.stdout.write(`${err.cmd} : \n`);
        process.stdout.write(err.message);
        process.stdout.write('\n\n');
      }
      logger.log('\x1b[0m');
    } else {
      logger.log('\x1b[32m', 'Ошибок нет');
      logger.log('\x1b[0m');
    }
  }

  /**
   * Выбирает из списка всех измененных в коммите файлов только те, которые соответсвуют маске
   *
   * @param changedFiles string[] - все измененные в коммите файлы
   * @param mask string - регулярка от правила
   *
   * @returns string[]
   */
  protected conditionMet(changedFiles: string[], mask: string): string[] {
    return changedFiles.filter((el) => {

      const match = el.match(new RegExp(mask));
      if (match && match.length > 0) {
        return true;
      }

      return false;
    });
  }

  /**
   * Выполняет одно правило по списку соответстующих этому правилу файлов
   * В процесе дергает (возможно много раз) this.runCmd
   *
   * @param rule IRule - правило для старта
   * @param files string[] - список файлов, измененных в этом коммите
   */
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

  /**
   * Запускаем команду, и добавляем ее вывод в this.statuses
   *
   * @param cmd string - текст команды
   *
   * @returns boolean - true, если команда выполнена успешно
   */
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

    this.addStatus(cmd, success, message);
    return success;
  }

  /**
   * Сохраняем статус выполнения команды
   *
   * @param cmd string - выполненная команда
   * @param success boolean - статус завершения
   * @param message string - сообщение
   */
  private addStatus(cmd: string, success: boolean, message: string): void {
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
  private getCmdForFilename(filename: string, cmd: string): string {
    return cmd.replace('${filename}', filename);
  }
}
