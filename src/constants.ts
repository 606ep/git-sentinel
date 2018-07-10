import * as os from 'os';

interface IConstant {
  dirDelimiter: string;
}

interface IConstants {
  [os: string]: IConstant;
}

export const all: IConstants = {
  Windows_NT: {
    dirDelimiter: '\\',
  },
  Linux: {
    dirDelimiter: '/',
  },
};

export default all[os.type()];
