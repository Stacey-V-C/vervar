import path from "path";
import { FileHandle } from "fs/promises";

import { defaultGetSingleFileFn } from "../../customPluginUtils";
import type { VerVarPlugin } from "../../customPluginUtils/types";

type CustomEnvVarResult = { configCustomEnvVars: string[] }

export const extractJSONEnvVarRecursive = (val: any): string[] => typeof val === 'string'
  ? [val]
  : Object.keys(val)
    .filter(key => key !== '__format')
    .map(key => val[key])
    .flatMap(extractJSONEnvVarRecursive);

const extractCustomEnvVarsForJson = async (file: FileHandle, pluginConfig: any) => {
  const json = await file.readFile('utf-8');

  const parsed = JSON.parse(json);

  const parsedEnvVars = extractJSONEnvVarRecursive(parsed);

  const additionalEnvVars: string[] = pluginConfig?.additionalEnvVars || [];

  const configCustomEnvVars = [
    ...parsedEnvVars,
    ...additionalEnvVars,
  ];

  return { configCustomEnvVars };
};

export const CustomEnvVarPlugin: VerVarPlugin<CustomEnvVarResult> = {
  name: 'configCustomEnvVars',
  path: path.join(process.cwd(),
    'config', 'custom-environment-variables.json',
  ),
  resultNames: ['configCustomEnvVars'],
  getFilesFn: defaultGetSingleFileFn,
  extractFn: extractCustomEnvVarsForJson,
};

export default CustomEnvVarPlugin;