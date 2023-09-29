import {
  defaultCss,
  errorCss,
  variableCss,
} from '../../customPluginUtils';

export const getUnmatchedSecretKeyMessage = (secretKey: string) => [
  `${defaultCss}Secret key `,
  `${variableCss}${secretKey} `,
  `${defaultCss}has `,
  `${errorCss}no matching custom env var`,
].join('');

export const getUnmatchedParamMessage = (param: string) => [
  `${defaultCss}Param `,
  `${variableCss}${param} `,
  `${defaultCss}has `,
  `${errorCss}no matching secret`,
].join('');

export const getUnmatchedSecretMessage = (secret: string) => [
  `${defaultCss}Secret `,
  `${variableCss}${secret} `,
  `${defaultCss}has `,
  `${errorCss}no matching param`,
].join('');