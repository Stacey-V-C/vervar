import path from "path";
import { FileHandle } from "fs/promises";

import { defaultGetSingleFileFn } from "../customPluginUtils";

import type { VerVarPlugin } from "../customPluginUtils/types";

type CustomEnvVarResult = {
  custom_env_vars: string[],
}

type CustomEnvVarResultKeys = keyof CustomEnvVarResult;

const customEnvVarResultKeys: CustomEnvVarResultKeys[] = ['custom_env_vars'];

const extractCustomEnvVarsForJson = async (file: FileHandle, pluginConfig: any) => {
  const res: CustomEnvVarResult = {
    custom_env_vars: [],
  };

  const json = await file.readFile('utf-8');

  const parsed = JSON.parse(json);

  const pushRecursive = (val: any) => {
    if (typeof val === 'string') {
      res.custom_env_vars.push(val);
    } else {
      for (const key in val) {
        if (key !== '__format') {
          pushRecursive(val[key]);
        }
      }
    }
  };

  pushRecursive(parsed);

  const additionalEnvVars = pluginConfig?.additionalEnvVars || [];

  res.custom_env_vars.push(...additionalEnvVars);

  return res;
};

export const CustomEnvVarPlugin: VerVarPlugin<
  CustomEnvVarResult,
  CustomEnvVarResultKeys
> = {
  name: 'custom_env_vars',
  defaultPath: path.join(process.cwd(),
    'config', 'custom-environment-variables.json',
  ),
  resultNames: customEnvVarResultKeys,
  getFilesFn: defaultGetSingleFileFn,
  extractFn: extractCustomEnvVarsForJson,
};

export default CustomEnvVarPlugin;