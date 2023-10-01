import path from 'path';
import { FileHandle } from 'fs/promises';

import { defaultGetMultipleFilesFn } from '../../customPluginUtils';
import type { VerVarPlugin, VerifyStep } from '../../customPluginUtils/types';

import { getUnmatchedVarMessage } from './text';

type DotEnvResult = { 'envFileVars': string[] };

const extractEnvVarKeys = async (file: FileHandle) => {
  const envFileVars: string[] = [];
  const envFileVarDeclaration = /^(\S+)\s*=\s*\S+/;

  for await (const line of file.readLines()) {
    const match = line.match(envFileVarDeclaration);
    if (match && match[1]) envFileVars.push(match[1]);
  };

  return { envFileVars };
};

const verifyEnvVarsAreUsed: VerifyStep = {
  argPaths: [
    ['this', 'envFileVariables'],
    ['configCustomEnvVars', 'configCustomEnvVars'],
  ],
  fn: (_: unknown, envFileVars: string[], configCustomEnvVars: string[]) => {
    const errors = envFileVars
      .filter(v => !configCustomEnvVars.includes(v))
      .map(v => getUnmatchedVarMessage(v));

    return errors;
  },
}

export const DotEnvPlugin: VerVarPlugin<DotEnvResult> = {
  name: 'dotEnv',
  path: path.join(process.cwd(), '_infra'),
  resultNames: ['envFileVars'],
  getFilesFn: defaultGetMultipleFilesFn(/\.env$/),
  extractFn: extractEnvVarKeys,
  verifySteps: [verifyEnvVarsAreUsed],
};

export default DotEnvPlugin;