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
  argPaths: string[];
  fn: (pluginSpecific?: Record<string, any>, ...args: string[][]) => string[];
};

export type PlugInRoutineResult<R extends Record<string, string[]>> = {
  name: string;
  path: string;
  results: ExtractResults<R>[];
  hasErrors: boolean;
};

export interface VerVarPlugin<R extends Record<string, string[]>, N extends keyof R> {
  name: string;
  defaultPath: string;
  getFilesFn:
  | ((path: string) => Promise<TargetFile | TargetFile[]>)
  | ((path: string, pluginSpecific?: Record<string, any>) => Promise<TargetFile | TargetFile[]>);
  extractFn:
  | ((file: FileHandle) => Promise<R>)
  | ((file: FileHandle, pluginSpecific?: Record<string, any>) => Promise<R>);
  verifySteps?: VerifyStep[];
  resultNames: N[]; // since we're using previous results, we could just check the keys on that i think???
  getSuccessMessage?: (path: string) => string;
  getFailureMessage?: (path: string) => string;
  pluginSpecific?: Record<string, any>;
};