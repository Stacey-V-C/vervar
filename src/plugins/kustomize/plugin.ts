import path from 'path';
import { FileHandle } from 'fs/promises';

import { defaultGetMultipleFilesFn } from '../../customPluginUtils';
import type { VerVarPlugin, VerifyStep } from '../../types';

import {
  getUnmatchedParamMessage,
  getUnmatchedSecretKeyMessage,
  getUnmatchedSecretMessage
} from './text';

type KustomizeResult = {
  secretKeys: string[],
  secrets: string[],
  params: string[],
}
const kustomizeResultKeys: (keyof KustomizeResult)[] = ['secretKeys', 'secrets', 'params'];

const extractParamsSecretsAndSecretKeys = async (file: FileHandle) => {
  const results: Record<keyof KustomizeResult, string[]> = {
    secretKeys: [],
    secrets: [],
    params: [],
  }

  const paramsRegEx = /- objectName: "(\S*)"/;
  const secretsRegEx = /objectName: (\.[\S]*)/;
  const secretKeysRegEx = /- key: (\S*)/;

  for await (const line of file.readLines()) {
    if (paramsRegEx.test(line)) {
      const res = line.match(paramsRegEx);
      if (res && res[1]) results.params.push(res[1]);
    }

    if (secretsRegEx.test(line)) {
      const res = line.match(secretsRegEx);
      if (res && res[1]) results.secrets.push(res[1]);
    }

    if (secretKeysRegEx.test(line)) {
      const res = line.match(secretKeysRegEx);
      if (res && res[1]) results.secretKeys.push(res[1]);
    }
  }

  return results;
};

const verifySecretKeysAreUsed: VerifyStep = {
  argPaths: [
    ['this', 'secretKeys'],
    ['configCustomEnvVars', 'configCustomEnvVars']
  ],
  fn: (_: unknown, secretKeys: string[], configCustomEnvVars: string[]) => {
    const errors = secretKeys
      .filter(secretKey => !configCustomEnvVars.includes(secretKey))
      .map(secretKey => getUnmatchedSecretKeyMessage(secretKey));

    return errors;
  },
};

const verifyParamsAndSecretsMatch: VerifyStep = {
  argPaths: [
    ['this', 'params'],
    ['this', 'secrets']
  ],
  fn: (_: unknown, params: string[], secrets: string[]) => {

    const formattedSecrets = secrets.map(secret => secret.replace(/\./g, '/'));

    const paramErrors = params
      .filter(param => !formattedSecrets.includes(param))
      .map(param => getUnmatchedParamMessage(param));

    const secretErrors = formattedSecrets
      .filter(secret => !params.includes(secret))
      .map(secret => getUnmatchedSecretMessage(secret));

    return [...paramErrors, ...secretErrors];
  }
};

export const verifyTerraformPassesParams: VerifyStep = {
  argPaths: [
    ['this', 'params'],
    ['terraform', 'params']
  ],
  fn: (_: unknown, params: string[], terraformParams: string[]) => {
    const errors = params //TODO we can probably make this a generic function
      .filter(param => !terraformParams.includes(param))
      .map(param => `Param ${param} has no matching terraform param`);

    return errors;
  },
};

export const KustomizePlugin: VerVarPlugin<KustomizeResult> = {
  name: 'kustomize',
  path: path.join(process.cwd(), '_infra'),
  resultNames: kustomizeResultKeys,
  getFilesFn: defaultGetMultipleFilesFn(/kustomization\.yaml$/),
  extractFn: extractParamsSecretsAndSecretKeys,
  verifySteps: [
    verifyParamsAndSecretsMatch,
    verifySecretKeysAreUsed,
    verifyTerraformPassesParams,
  ]
};

export default KustomizePlugin;