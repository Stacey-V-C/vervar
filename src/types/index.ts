import type { FileHandle } from 'fs/promises';

export type ExtractResults<R extends Record<string, string[]>> = {
  path: string;
  extractedVars: R;
};

export type TargetFile = {
  path: string;
  file: FileHandle;
};

export type VerifyStep = {
  readonly argPaths: [string, string][];
  fn: (pluginSpecificData?: Record<string, any>, ...args: string[][]) => string[];
};

export type PlugInRoutineResult<R extends Record<string, string[]>> = {
  name: string;
  path: string;
  results: ExtractResults<R>[];
  foundErrors: boolean;
};

export type VerVarPlugin<
  R extends Record<string, string[]>,
> = {
  name: string;
  path: string;
  getFilesFn: ((path: string, pluginSpecificData?: Record<string, any>) => Promise<TargetFile[]>);
  extractFn: ((file: FileHandle, pluginSpecificData?: Record<string, any>) => Promise<R>);
  verifySteps?: VerifyStep[];
  getSuccessMessage?: (path: string) => string;
  getFailureMessage?: (path: string) => string;
  readonly resultNames: (keyof R)[]; // since we're using previous results, we could just check the keys on that i think???
  pluginSpecificData?: Record<string, any>;
};