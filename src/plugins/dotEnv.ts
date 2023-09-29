import path from 'path';
import { FileHandle } from 'fs/promises';

import {
  defaultCss,
  errorCss,
  variableCss,
  defaultGetMultipleFilesFn
} from '../customPluginUtils';

import type { VerVarPlugin } from '../customPluginUtils/types';
import { ArgPaths } from '../types';

type DotEnvResult = {
  envVars: string[],
};

type DotEnvResultKeys = keyof DotEnvResult;

const dotEnvResultKeys: DotEnvResultKeys[] = ['envVars'];

const getUnmatchedVarMessage = (envVar: string) => [
  `${defaultCss}Env var `,
  `${variableCss}${envVar} `,
  `${defaultCss}has `,
  `${errorCss}no matching custom env var`,
].join('');

const extractEnvVarKeys = async (file: FileHandle) => {
  const res: DotEnvResult = {
    envVars: [],
  };

  const envVarRegEx = /^(\S+)\s*=\s*\S+/;

  for await (const line of file.readLines()) {
    if (envVarRegEx.test(line)) {
      const match = line.match(envVarRegEx);
      if (match && match[1]) res.envVars.push(match[1]);
    }
  };

  return res;
};

const verifyEnvVarsAreUsed = {
  argPaths: [
    ['this', 'envVars'],
    ['customEnvVars', 'customEnvVars'],
  ] as ArgPaths,
  fn: (_: unknown, envVars: string[], customEnvVars: string[]) => {
    const errors = envVars
      .filter(envVar => !customEnvVars.includes(envVar))
      .map(envVar => getUnmatchedVarMessage(envVar));

    return errors;
  },
}

export const DotEnvPlugin: VerVarPlugin<
  DotEnvResult,
  DotEnvResultKeys
> = {
  name: 'dotEnv',
  defaultPath: path.join(process.cwd(), '_infra'),
  resultNames: dotEnvResultKeys,
  getFilesFn: defaultGetMultipleFilesFn(/\.env$/),
  extractFn: extractEnvVarKeys,
  verifySteps: [
    verifyEnvVarsAreUsed,
  ],
};

export default DotEnvPlugin;