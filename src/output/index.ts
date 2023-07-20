export const defaultCss = '\x1b[0m';
export const errorCss = '\x1b[31m';
export const successCss = '\x1b[32m';
export const fileCss = '\x1b[34m';
export const variableCss = '\x1b[36m';
export const pluginCss = '\x1b[35m';
export const infoCss = '\x1b[33m';

export const trimPath = (path: string) => {
  const [_, pathInsideDirectory] = path.split(process.cwd() + '/');

  return pathInsideDirectory;
}

export const getDefaultSuccessMessage = (path: string) =>
  [
    fileCss + `${trimPath(path)}`,
    defaultCss + ' verified ',
    successCss + 'successfully',
    '\n'
  ].join('');

export const getDefaultFailureMessage = (path: string) =>
  [
    defaultCss + 'Found the following ',
    errorCss + 'errors',
    defaultCss + ' in ',
    fileCss + `${trimPath(path)}`,
  ].join('');

export const getMissingRequirementMessage = (requirement: string[]) => [
  defaultCss + 'Requirement ',
  errorCss + `${requirement.join('.')}`,
  defaultCss + ' not found',
].join('');

export const getMissingResultFieldMessage = (requirement: string[]) => [
  defaultCss + `Requirement `,
  errorCss + `${requirement.join('.')}`,
  defaultCss + ' is not a valid result name for plugin ',
  pluginCss + `${requirement[0]}`,
].join('');

export const getRequirementFormattingError = (requirement: string[]) => [
  defaultCss + `Requirement `,
  pluginCss + `${requirement.join('.')}`,
  defaultCss + ' is not formatted correctly',
  '\n',
  '\tRequirements should be formatted in form ',
  infoCss + `'{pluginName}.{resultFieldKey}'`,
].join('');

export const getFailedRequirementsMessage = (name: string, errors: string[]) => {
  const heading = [
    defaultCss + 'Found the following ',
    errorCss + 'plugin requirement errors',
    defaultCss + ` in `,
    fileCss + `${name}`,
    '\n',
  ].join('')

  const formattedErrors = errors.map(
    error => [defaultCss + '- ', error, '\n'].join('')
  ).join('');

  return [
    heading,
    formattedErrors,
  ].join('');
};

export const getFormattedErrors = (errors: string[]) =>
  errors.map(
    error => [defaultCss + '- ', error, '\n'].join('')
  ).join('');

export const getSummary = (failed: boolean, hasErrors: boolean) => {
  if (failed) {
    return errorCss + 'Could not complete verification due to plugin requirement failues';
  } else if (hasErrors) {
    return infoCss + 'Verification finished with errors';
  } else {
    return successCss + 'Verification successful';
  }
}