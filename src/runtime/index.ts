import path from 'path';
import { defaultGetSingleFileFn } from '../files';

import type { FileHandle } from 'fs/promises';

import type {
  ExtractResults,
  PlugInRoutineResult,
  TargetFile,
  VerifyStep,
  VerVarPlugin,
} from '../types';

import {
  getDefaultFailureMessage,
  getDefaultSuccessMessage,
  getFailedRequirementsMessage,
  getFormattedErrors,
  getMissingRequirementMessage,
  getMissingResultFieldMessage,
  getRequirementFormattingError,
  getSummary,
} from '../output';

export class PlugInRunner<
  R extends Record<string, string[]>,
  N extends keyof R,
> implements VerVarPlugin<R, N> {
  name: string;
  path: string;
  getFilesFn:
    | ((path: string) => Promise<TargetFile | TargetFile[]>)
    | ((path: string, pluginSpecific: Record<string, any> | undefined) => Promise<TargetFile | TargetFile[]>);
  extractFn:
    | ((file: FileHandle) => Promise<R>)
    | ((file: FileHandle, pluginSpecific: Record<string, any> | undefined) => Promise<R>);
  verifySteps: VerifyStep[];
  getSuccessMessage: (path: string) => string;
  getFailureMessage: (path: string) => string;
  resultNames: N[];
  results: ExtractResults<R>[] | null;
  previousResults: PlugInRoutineResult<any>[];
  pluginSpecific?: Record<string, any>;

  constructor(
    plugin: VerVarPlugin<R, N>,
    previousResults?: PlugInRoutineResult<any>[]
  ) {
    this.name = plugin.name;
    this.path = plugin.path;
    this.getFilesFn = plugin.getFilesFn || defaultGetSingleFileFn;
    this.extractFn = plugin.extractFn;
    this.verifySteps = plugin.verifySteps || [];
    this.getSuccessMessage = plugin.getSuccessMessage || getDefaultSuccessMessage;
    this.getFailureMessage = plugin.getFailureMessage || getDefaultFailureMessage;
    this.resultNames = plugin.resultNames;
    this.results = null;
    this.previousResults = previousResults || [];
    this.pluginSpecific = plugin?.pluginSpecific;
  }

  verifyRequirements = (previousPlugins: VerVarPlugin<any, any>[]) => {
    const errors: string[] = [];

    const requirements = this.verifySteps
      .flatMap(verifyFn => verifyFn.argPaths);

    for (const requirement of requirements) {
      if (requirement.length !== 2) {
        errors.push(getRequirementFormattingError(requirement));
        continue;
      }

      const [pluginName, resultName] = requirement;

      if (pluginName === 'this') continue;

      const plugin = previousPlugins.find(p => p.name === pluginName);

      if (!plugin) {
        errors.push(getMissingRequirementMessage(requirement));
        continue;
      }

      if (!plugin.resultNames.includes(resultName as any)) {
        errors.push(getMissingResultFieldMessage(requirement));
        continue;
      }
    }

    return errors;
  }

  extractFromFile = async (target: TargetFile): Promise<ExtractResults<R>> => {
    const { path, file } = target;

    const extractedVars = await this.extractFn(file, this.pluginSpecific);

    return { path, extractedVars };
  };

  runPluginRoutine = async (): Promise<PlugInRoutineResult<R>> => {
    let hasErrors = false;

    const files = await this.getFilesFn(this.path, this.pluginSpecific);

    const multipleFiles = Array.isArray(files);

    const results = await Promise.all(
      multipleFiles
        ? files.map(this.extractFromFile)
        : [this.extractFromFile(files)]
    );

    for (const result of results) {
      const { path } = result;

      const errors = this.verifySteps
        .flatMap(this.runVerifyStep(result));

      if (errors.length > 0) {
        hasErrors = true;

        console.log(this.getFailureMessage(path));
        console.log(getFormattedErrors(errors))
      } else {
        console.log(this.getSuccessMessage(path));
      }
    }

    return {
      name: this.name,
      path: this.path,
      results,
      hasErrors,
    };
  }

  runVerifyStep = (result: ExtractResults<R>) => (step: VerifyStep) => {
    const args = step.argPaths.map(([pluginName, resultName]) => {
      const pluginResult = pluginName === 'this'
        ? result
        : this.previousResults
          .find(r => r.name === pluginName)
          ?.results;

      if (!pluginResult) {
        console.log(`Could not find plugin ${pluginName}`);
        return [];
      }

      const varResults: string[] = !Array.isArray(pluginResult)
        ? pluginResult.extractedVars[resultName]
        : pluginResult
          ?.flatMap(r => r.extractedVars[resultName]) || [];

      if (!varResults) {
        const pluginDisplayName = pluginName === 'this'
          ? this.name
          : pluginName;

        console.log(
          'Could not find variable ',
          `%c${resultName}`, 'color: red;',
          `in %c${pluginDisplayName}`, 'color: blue;',
        );
        return [];
      }

      return varResults;
    });

    return step.fn(this.pluginSpecific, ...args,);
  }
}

export const runRoutines = async (plugs: VerVarPlugin<any, any>[]) => {
  let failed = false;

  let previousResults: PlugInRoutineResult<any>[] = []; // TODO could probably use recursion;

  const routines = plugs.map((plug, i) => async () => {
    const previousPlugins = plugs.slice(0, i);

    const runner = new PlugInRunner(
      plug,
      previousResults
    );

    const errors = runner.verifyRequirements(previousPlugins);

    if (errors.length > 0) {
      console.log(getFailedRequirementsMessage(plug.name, errors))

      failed = true;
    }

    if (!failed) {
      const results = await runner.runPluginRoutine();

      previousResults.push(results);
    }
  })

  for (const routine of routines) {
    await routine();
  }

  const hasErrors = previousResults.some(r => r.hasErrors);

  console.log(getSummary(failed, hasErrors));
};