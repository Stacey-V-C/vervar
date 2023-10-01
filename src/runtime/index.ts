import type { FileHandle } from 'fs/promises';

import {
  getDefaultFailureMessage,
  getDefaultSuccessMessage,
  getFailedRequirementsMessage,
  getFormattedErrors,
  getMissingRequirementMessage,
  getMissingResultFieldMessage,
  getRequirementFormattingError,
  getSummary,
} from '../output/messages';
import { defaultGetSingleFileFn } from '../files';

import type {
  ExtractResults,
  PlugInRoutineResult,
  TargetFile,
  VerifyStep,
  VerVarPlugin,
} from '../types';

export class PlugInRunner<R extends Record<string, string[]>> implements VerVarPlugin<R> {
  name: string;
  path: string;
  getFilesFn: ((path: string, pluginSpecificData?: Record<string, any>) => Promise<TargetFile[]>);
  extractFn: ((file: FileHandle, pluginSpecificData?: Record<string, any>) => Promise<R>);
  verifySteps: VerifyStep[];
  getSuccessMessage: (path: string) => string;
  getFailureMessage: (path: string) => string;
  resultNames: (keyof R)[];
  previousResults: PlugInRoutineResult<any>[];
  pluginSpecificData?: Record<string, any>;

  constructor(
    plugin: VerVarPlugin<R>,
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
    this.previousResults = previousResults || [];
    this.pluginSpecificData = plugin?.pluginSpecificData;
  }

  verifyRequirements = (previousPlugins: VerVarPlugin<any>[]) => {
    const errors = [];
    const requirements = this.verifySteps
      .flatMap(verifyFn => verifyFn.argPaths);

    for (const requirement of requirements) {
      if (!Array.isArray(requirement) || requirement.length !== 2) {
        errors.push(getRequirementFormattingError(requirement));
        continue;
      }

      const [pluginName, resultName] = requirement;

      if (pluginName === 'this') {
        if (!this.resultNames.includes(resultName as any)) {
          errors.push(getMissingResultFieldMessage(pluginName, resultName));
        }

        continue;
      }

      const plugin = previousPlugins.find(p => p.name === pluginName);

      if (!plugin) {
        errors.push(getMissingRequirementMessage(pluginName, resultName));
        continue;
      }

      if (!plugin.resultNames.includes(resultName as any)) {
        errors.push(getMissingResultFieldMessage(pluginName, resultName));
        continue;
      }
    }

    return errors;
  }

  extractFromFile = async (target: TargetFile): Promise<ExtractResults<R>> => {
    const { path, file } = target;

    const extractedVars = await this.extractFn(file, this?.pluginSpecificData);

    return { path, extractedVars };
  }

  runVerifyStep = (result: ExtractResults<R>) => (step: VerifyStep) => {
    const args = step.argPaths.map(([pluginName, resultName]) => {
      const pluginResults = pluginName === 'this'
        ? [result]
        : this.previousResults.find(res => res.name === pluginName)?.results;

      if (!pluginResults) {
        console.log(getMissingRequirementMessage(pluginName, resultName));
        return [];
      }

      if (!pluginResults?.some(res => res.extractedVars?.[resultName])) {
        console.log(getMissingResultFieldMessage(pluginName, resultName));
        return [];
      }

      return pluginResults?.flatMap(res => res.extractedVars[resultName] || []);
    });

    return step.fn(this?.pluginSpecificData, ...args);
  }

  runPluginRoutine = async (): Promise<PlugInRoutineResult<R>> => {
    const files = await this.getFilesFn(this.path, this?.pluginSpecificData);
    const extractRoutines = files.map(this.extractFromFile);
    const results = await Promise.all(extractRoutines);

    let foundErrors = false;

    for (const result of results) {
      const errors = this.verifySteps.map(this.runVerifyStep(result)).flat();

      if (errors.length > 0) {
        foundErrors = true;
        console.log(this.getFailureMessage(result.path));
        console.log(getFormattedErrors(errors))
      } else {
        console.log(this.getSuccessMessage(result.path));
      }
    }

    return {
      name: this.name,
      path: this.path,
      results,
      foundErrors,
    };
  }
}

export const runRoutines = async (plugins: VerVarPlugin<any>[]) => {
  let previousResults: PlugInRoutineResult<any>[] = []; // TODO could probably use recursion?
  let somePluginsFailedRequirements = false;

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    const runner = new PlugInRunner(plugin, previousResults);

    const previousPlugins = plugins.slice(0, i);
    const requirementErrors = runner.verifyRequirements(previousPlugins);

    if (requirementErrors.length > 0) {
      somePluginsFailedRequirements = true;
      console.log(getFailedRequirementsMessage(plugin.name, requirementErrors))
    } else if (!somePluginsFailedRequirements) {
      previousResults.push(await runner.runPluginRoutine());
    }
  }

  const somePluginsFoundVariableErrors = previousResults.some(r => r.foundErrors);
  console.log(getSummary(somePluginsFailedRequirements, somePluginsFoundVariableErrors));
};