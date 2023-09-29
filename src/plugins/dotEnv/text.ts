import {
  defaultCss,
  errorCss,
  variableCss,
} from '../../customPluginUtils';

export const getUnmatchedVarMessage = (envVar: string) => [
  `${defaultCss}Env var `,
  `${variableCss}${envVar} `,
  `${defaultCss}has `,
  `${errorCss}no matching custom env var`,
].join('');