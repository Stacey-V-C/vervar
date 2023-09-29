import { extractJSONEnvVarRecursive } from "./plugin"

describe('test extraction function', () => {
  it('should handle a single string', () => {
    const result = extractJSONEnvVarRecursive('foo');
    expect(result).toEqual(['foo']);
  })

  it('should handle an object with a single level', () => {
    const result = extractJSONEnvVarRecursive({
      foo: 'bar',
      baz: 'qux',
    });
    expect(result).toEqual(['bar', 'qux']);
  })

  it('should handle multiple levels of nesting', () => {
    const result = extractJSONEnvVarRecursive({
      foo: 'bar',
      baz: {
        qux: 'quux',
        corge: {
          grault: 'garply',
        },
      },
    });
    expect(result).toEqual(['bar', 'quux', 'garply']);
  })

  it('should not extract the __format key', () => {
    const result = extractJSONEnvVarRecursive({
      foo: 'bar',
      baz: {
        qux: 'quux',
        __format: 'boolean',
      },
    });
    expect(result).toEqual(['bar', 'quux']);
  })
})