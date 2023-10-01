import fs from 'fs';
import path from 'path';

import type { TargetFile } from '../types';

const walkDirAndSelectFilesMatchingRegEx = async (
  targetDir: string,
  regEx: RegExp,
): Promise<TargetFile[]> => {
  const res: TargetFile[] = [];

  const dirEntries = await fs.promises.readdir(
    targetDir,
    { withFileTypes: true }
  );

  // TODO reject if initial path is not a directory or does not exist?;

  for (const dirEntry of dirEntries) {
    const dirEntryPath = path.join(targetDir, dirEntry.name);

    if (dirEntry.isDirectory()) {
      const subDirFiles = await walkDirAndSelectFilesMatchingRegEx(dirEntryPath, regEx);

      res.push(...subDirFiles);
    } else if (regEx.test(dirEntryPath)) {
      const file = await fs.promises.open(dirEntryPath, 'r');

      res.push({ path: dirEntryPath, file });
    }
  }

  return res;
};

export const defaultGetMultipleFilesFn = (regEx: RegExp) =>
  (targetDir: string) => walkDirAndSelectFilesMatchingRegEx(targetDir, regEx);

export const defaultGetSingleFileFn = async (targetFile: string) => {
  const file = await fs.promises.open(targetFile, 'r');

  const res: TargetFile = {
    path: targetFile,
    file,
  };

  return [res];
};