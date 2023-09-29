import path from "path";
import { FileHandle } from "fs/promises";

import { defaultGetSingleFileFn } from "../../customPluginUtils";
import type { VerVarPlugin } from "../../customPluginUtils/types";

type CustomEnvVarResult = { customEnvVars: string[] }
type CustomEnvVarResultKeys = keyof CustomEnvVarResult;
const customEnvVarResultKeys: CustomEnvVarResultKeys[] = ['customEnvVars'];

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

  const customEnvVars = [
    ...parsedEnvVars,
    ...additionalEnvVars,
  ];

  return { customEnvVars };
};

export const CustomEnvVarPlugin: VerVarPlugin<
  CustomEnvVarResult,
  CustomEnvVarResultKeys
> = {
  name: 'customEnvVars',
  defaultPath: path.join(process.cwd(),
    'config', 'custom-environment-variables.json',
  ),
  resultNames: customEnvVarResultKeys,
  getFilesFn: defaultGetSingleFileFn,
  extractFn: extractCustomEnvVarsForJson,
};

export default CustomEnvVarPlugin;