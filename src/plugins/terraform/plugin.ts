import path from "path";
import { FileHandle } from "fs/promises";

import { defaultGetSingleFileFn } from "../../customPluginUtils";
import type { VerVarPlugin } from "../../customPluginUtils/types";

type TerraformResult = { params: string[] };
type TerraformResultKeys = keyof TerraformResult;
const terraformResultKeys: TerraformResultKeys[] = ['params'];

const extractTerraformParams = async (file: FileHandle) => {
  const res: TerraformResult = {
    params: [],
  };

  const paramsRegEx = /string, "(\S*)"/; // TODO there's no way this is correct lmao

  for await (const line of file.readLines()) {
    if (paramsRegEx.test(line)) {
      const match = line.match(paramsRegEx);
      if (match && match[1]) res.params.push(match[1]);
    }
  };

  return res;
}

const getAppAndWorkerTerraformFiles = async (terraformDir: string) => {
  const appPath = path.join(terraformDir, 'app', 'variables.tf');
  const workerPath = path.join(terraformDir, 'worker', 'variables.tf');

  const files = await Promise.all([
    defaultGetSingleFileFn(appPath),
    defaultGetSingleFileFn(workerPath),
  ]);

  return files;
}


export const TerraformPlugin: VerVarPlugin<
  TerraformResult,
  TerraformResultKeys
> = {
  name: 'terraform',
  defaultPath: path.join(process.cwd(),
    '_infra', 'terraform',
  ),
  getFilesFn: getAppAndWorkerTerraformFiles,//defaultGetSingleFileFn,
  resultNames: terraformResultKeys,
  extractFn: extractTerraformParams,
};

export default TerraformPlugin;