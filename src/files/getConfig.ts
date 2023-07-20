import path from 'path';

const isValidPluginConfigObj = (obj: any) => {
  if (typeof obj !== 'object') return false;
  if (typeof obj.plugin !== 'string') return false;
  if (typeof obj.overrides !== 'object') return false;

  return true;
};

export const getPluginsFromConfigFile = (customConfigPath?: string) => {
  const defaultConfigPath = path.join(process.cwd(), 'vervar.config.json');

  const configPath = customConfigPath || defaultConfigPath;

  const config = require(configPath);

  return importPluginsAndApplyOverrides(config.plugins);
};

export const getPluginsFromLoaderScript = (loaderScriptPath: string) => {
  const loaderScript = require(loaderScriptPath);

  const plugins = loaderScript?.ouput?.plugins;

  if (!plugins) throw new Error('No plugins found in loader script');

  return importPluginsAndApplyOverrides(plugins);
};

const importPluginsAndApplyOverrides = (plugins: any[]) =>
  plugins.map((plugin: any) => {
    if (typeof plugin === 'string') {
      return require(plugin).default;

    } else if (isValidPluginConfigObj(plugin)) {
      const basePlugin = require(plugin.plugin).default;

      return {
        ...basePlugin,
        ...plugin.overrides,
      };
    }
  });