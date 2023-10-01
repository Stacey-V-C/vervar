import path from "path";
import { FileHandle } from "fs/promises";

import { defaultGetSingleFileFn } from "../../customPluginUtils";
import type { VerVarPlugin } from "../../customPluginUtils/types";

type TerraformResult = { params: string[] };
const terraformResultKeys: (keyof TerraformResult)[] = ['params'];

const extractTerraformParams = async (file: FileHandle) => {
  const params = [];
  const paramsRegEx = /string, "(\S*)"/; // TODO there's got to be a more specific regex for this

  for await (const line of file.readLines()) {
    if (paramsRegEx.test(line)) {
      const match = line.match(paramsRegEx);
      if (match && match[1]) params.push(match[1]);
    }
  };

  return { params };
}

// const getAppAndWorkerTerraformFiles = async (terraformDir: string) => {
//   const appPath = path.join(terraformDir, 'app', 'variables.tf');
//   const workerPath = path.join(terraformDir, 'worker', 'variables.tf');

//   const files = await Promise.all([
//     defaultGetSingleFileFn(appPath),
//     defaultGetSingleFileFn(workerPath),
//   ]);

//   return files;
// }

export const TerraformPlugin: VerVarPlugin<TerraformResult> = {
  name: 'terraform',
  path: path.join(process.cwd(), '_infra', 'terraform'),
  getFilesFn: defaultGetSingleFileFn,
  resultNames: terraformResultKeys,
  extractFn: extractTerraformParams,
};

export default TerraformPlugin;