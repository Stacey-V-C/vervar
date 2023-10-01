import { trimPath } from "./util";

describe('Trim Path', () => {
  it('should trim the path', () => {
    const path = process.cwd() + '/src/index.ts';
    const result = trimPath(path);
    expect(result).toBe('src/index.ts');
  });
});