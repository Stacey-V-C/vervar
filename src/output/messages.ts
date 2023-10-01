export const defaultCss = '\x1b[0m';
export const errorCss = '\x1b[31m';
export const successCss = '\x1b[32m';
export const fileCss = '\x1b[34m';
export const variableCss = '\x1b[36m';
export const pluginCss = '\x1b[35m';
export const infoCss = '\x1b[33m';

import { trimPath } from './util';

export const getDefaultSuccessMessage = (path: string) =>
  [
    fileCss + `${trimPath(path)}`,
    defaultCss + ' verified ',
    successCss + 'successfully' + defaultCss,
  ].join('');

export const getDefaultFailureMessage = (path: string) =>
  [
    defaultCss + 'Found the following ',
    errorCss + 'errors',
    defaultCss + ' in ',
    fileCss + `${trimPath(path)}` + defaultCss,
  ].join('');

export const getMissingRequirementMessage = (pluginName: string, resultName: string) => [
  defaultCss + 'Requirement ',
  variableCss + `${pluginName}.${resultName}`,
  errorCss + ' not found' + defaultCss,
].join('');

export const getMissingResultFieldMessage = (pluginName: string, resultName: string) => [
  defaultCss + `Value `,
  variableCss + `${resultName}`,
  defaultCss + ' is ',
  errorCss + 'not a valid result name',
  defaultCss + ' on plugin ',
  pluginCss + `${pluginName}` + defaultCss,
].join('');

export const getRequirementFormattingError = (value: unknown) => [
  defaultCss + `Requirement `,
  pluginCss + `'${JSON.stringify(value)}'`,
  defaultCss + ' is not formatted correctly',
  '\n',
  'Requirements should be formatted as an array with form ',
  infoCss + `'[pluginName, resultFieldKey]'` + defaultCss,
].join('');

export const getFailedRequirementsMessage = (name: string, errors: string[]) => {
  const heading = [
    defaultCss + 'Found the following ',
    errorCss + 'plugin requirement errors',
    defaultCss + ` in `,
    fileCss + `${name}`,
    defaultCss + '\n',
  ].join('')

  const formattedErrors = getFormattedErrors(errors);

  return [
    heading,
    formattedErrors,
  ].join('');
};

export const getFormattedErrors = (errors: string[]) =>
  errors.map(
    error => [defaultCss + '- ', error.replace(/\n/g, '\n\t'), '\n'].join('')
  ).join('') + defaultCss;

export const getSummary = (somePluginsFailedRequirements: boolean, somePluginsFoundVariableErrors: boolean) => {
  if (somePluginsFailedRequirements) {
    return errorCss + 'Could not complete verification due to plugin requirement failues' + defaultCss;
  } else if (somePluginsFoundVariableErrors) {
    return infoCss + 'Verification finished with errors' + defaultCss;
  } else {
    return successCss + 'Verification successful' + defaultCss;
  }
}