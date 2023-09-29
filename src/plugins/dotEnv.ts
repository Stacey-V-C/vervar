import path from 'path';
import { FileHandle } from 'fs/promises';

import {
  defaultCss,
  errorCss,
  variableCss,
  defaultGetMultipleFilesFn
} from '../customPluginUtils';

import type { VerVarPlugin } from '../customPluginUtils/types';

type DotEnvResult = {
  env_vars: string[],
};

type DotEnvResultKeys = keyof DotEnvResult;

const dotEnvResultKeys: DotEnvResultKeys[] = ['env_vars'];

const getUnmatchedVarMessage = (envVar: string) => [
  `${defaultCss}Env var `,
  `${variableCss}${envVar} `,
  `${defaultCss}has `,
  `${errorCss}no matching custom env var`,
].join('');

const extractEnvVarKeys = async (file: FileHandle) => {
  const res: DotEnvResult = {
    env_vars: [],
  };

  const envVarRegEx = /^(\S+)\s*=\s*\S+/;

  for await (const line of file.readLines()) {
    if (envVarRegEx.test(line)) {
      const match = line.match(envVarRegEx);
      if (match && match[1]) res.env_vars.push(match[1]);
    }
  };

  return res;
};

const verifyEnvVarsAreUsed = {
  argPaths: ['this.env_vars', 'customEnvVars.customEnvVars'],
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