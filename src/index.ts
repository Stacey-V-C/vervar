import { getPluginsFromConfigFile } from './files';
import { runRoutines } from './runtime';

const plugins = getPluginsFromConfigFile();

runRoutines(plugins);