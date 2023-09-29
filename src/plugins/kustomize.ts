import path from 'path';
import { FileHandle } from 'fs/promises';

import {
  defaultCss,
  errorCss,
  variableCss,
  defaultGetMultipleFilesFn,
} from '../customPluginUtils';

import type { VerVarPlugin } from '../types';

type KustomizeResult = {
  secret_keys: string[],
  secrets: string[],
  params: string[],
}

type KustomizeResultKeys = keyof KustomizeResult;

const kustomizeResultKeys: KustomizeResultKeys[] = ['secret_keys', 'secrets', 'params'];

const extractParamsSecretsAndSecretKeys = async (file: FileHandle) => {
  const results: Record<keyof KustomizeResult, string[]> = {
    secret_keys: [],
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
      if (res && res[1]) results.secret_keys.push(res[1]);
    }
  }

  return results;
};

const getUnmatchedSecretKeyMessage = (secretKey: string) => [
  `${defaultCss}Secret key `,
  `${variableCss}${secretKey} `,
  `${defaultCss}has `,
  `${errorCss}no matching custom env var`,
].join('');

const verifySecretKeysAreUsed = {
  argPaths: ['this.secret_keys', 'customEnvVars.customEnvVars'],
  fn: (_: unknown, secretKeys: string[], customEnvVars: string[]) => {
    const errors = secretKeys
      .filter(secretKey => !customEnvVars.includes(secretKey))
      .map(secretKey => getUnmatchedSecretKeyMessage(secretKey));

    return errors;
  },
};

const getUnmatchedParamMessage = (param: string) => [
  `${defaultCss}Param `,
  `${variableCss}${param} `,
  `${defaultCss}has `,
  `${errorCss}no matching secret`,
].join('');

const getUnmatchedSecretMessage = (secret: string) => [
  `${defaultCss}Secret `,
  `${variableCss}${secret} `,
  `${defaultCss}has `,
  `${errorCss}no matching param`,
].join('');

const verifyParamsAndSecretsMatch = {
  argPaths: ['this.params', 'this.secrets'],
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

export const verifyTerraformPassesParams = {
  argPaths: ['this.params', 'terraform.params'],
  fn: (_: unknown, params: string[], terraformParams: string[]) => {
    const errors = params //TODO we can probably make this a generic function
      .filter(param => !terraformParams.includes(param))
      .map(param => `Param ${param} has no matching terraform param`);

    return errors;
  },
};

export const KustomizePlugin: VerVarPlugin<
  KustomizeResult,
  KustomizeResultKeys
> = {
  name: 'kustomize',
  defaultPath: path.join(process.cwd(), '_infra'),
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