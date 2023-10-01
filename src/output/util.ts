export const trimPath = (path: string) => {
  const [_, pathInsideDirectory] = path.split(process.cwd() + '/');

  return pathInsideDirectory;{}
}