import type { FileHandle } from 'fs/promises';

export type ExtractResults<R extends Record<string, string[]>> = {
  path: string;
  extractedVars: R;
};

export type TargetFile = {
  path: string;
  file: FileHandle;
};

export type ArgPaths = [string, string][];

export type VerifyStep = {
  argPaths: ArgPaths;
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
  path: string;
  getFilesFn:
  | ((path: string) => Promise<TargetFile | TargetFile[]>)
  | ((path: string, pluginSpecific?: Record<string, any>) => Promise<TargetFile | TargetFile[]>);
  extractFn:
  | ((file: FileHandle) => Promise<R>)
  | ((file: FileHandle, pluginSpecific?: Record<string, any>) => Promise<R>);
  verifySteps?: VerifyStep[];
  getSuccessMessage?: (path: string) => string;
  getFailureMessage?: (path: string) => string;
  resultNames: N[]; // since we're using previous results, we could just check the keys on that i think???
  pluginSpecific?: Record<string, any>;
};