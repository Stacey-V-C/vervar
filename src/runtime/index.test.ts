import { PlugInRunner } from ".";
import type { VerVarPlugin, VerifyStep } from "../types"
import { getMissingRequirementMessage } from "../output/messages";

const mockGetOneFileFn = jest.fn().mockReturnValue(Promise.resolve([
  {
    path: "mock/path",
    file: {},
  }
]));

const mockGetTwoFilesFn = jest.fn().mockReturnValue(Promise.resolve([
  {
    path: "mock/path",
    file: {},
  },
  {
    path: "mock/other/path",
    file: {},
  },
]));

const mockExtractFn = jest.fn().mockReturnValue(Promise.resolve({ variables: ["variable"] }));

const mockPlugin: VerVarPlugin<{ variables: string[] }> = {
  name: "Mock",
  path: "mock/path",
  getFilesFn: mockGetOneFileFn,
  extractFn: mockExtractFn,
  resultNames: ["variables"],
}

const otherMockPlugin: VerVarPlugin<{ variables: string[] }> = {
  name: "Other",
  path: "other/mock/path",
  getFilesFn: mockGetOneFileFn,
  extractFn: mockExtractFn,
  resultNames: ["variables"],
}

const mockSelfVerifyStep: VerifyStep = {
  argPaths: [["this", "variables"]],
  fn: jest.fn().mockReturnValue([]),
}

const mockOtherVerifyStep: VerifyStep = {
  argPaths: [["Other", "variables"]],
  fn: jest.fn().mockReturnValue([]),
}

const invalidVerifyStep: VerifyStep = {
  argPaths: [["this", "variables"]],
  fn: jest.fn().mockReturnValue(["error"]),
}

describe("Test PluginRunner class", () => {
  describe("Test verifyRequirements method", () => {
    it("should succeed if there are no verify steps and no previous plugins", () => {
      const runner = new PlugInRunner(mockPlugin);

      const res = runner.verifyRequirements([]);

      expect(res).toEqual([]);
    });

    it("should succeed if there are no verify steps and previous plugins", () => {
      const runner = new PlugInRunner(mockPlugin);

      const res = runner.verifyRequirements([otherMockPlugin]);

      expect(res).toEqual([]);
    })

    it("should succeed if there are verify steps requiring valid owned variables", () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        verifySteps: [mockSelfVerifyStep],
      });

      const res = runner.verifyRequirements([]);

      expect(res).toEqual([]);
    });

    it("should fail if there are verify steps with previous plugin requirements and no previous plugins", () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        verifySteps: [mockOtherVerifyStep],
      });

      const res = runner.verifyRequirements([]);

      expect(res).toEqual([getMissingRequirementMessage("Other", "variables")]);
    });
  });

  describe("Test runPluginRoutine method", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    })

    it("should call extract function once when a single file is read", async () => {
      const runner = new PlugInRunner(mockPlugin);

      await runner.runPluginRoutine();

      expect(mockExtractFn).toHaveBeenCalledTimes(1);
    })

    it("should call extract function multiple times when multiple files are read", async () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        getFilesFn: mockGetTwoFilesFn,
      });

      await runner.runPluginRoutine();

      expect(mockExtractFn).toHaveBeenCalledTimes(2);
    });

    it("should correctly label results from different files with their paths", async () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        getFilesFn: mockGetTwoFilesFn,
      });

      const res = await runner.runPluginRoutine();

      expect(res).toEqual(expect.objectContaining({
        name: mockPlugin.name,
        path: mockPlugin.path,
        results: [
          {
            path: "mock/path",
            extractedVars: { variables: ["variable"] },
          },
          {
            path: "mock/other/path",
            extractedVars: { variables: ["variable"] },
          },
        ],
      }));
    })

    it("should mark foundErrors false if there are no verify steps", async () => {
      const runner = new PlugInRunner(mockPlugin);

      const res = await runner.runPluginRoutine();

      expect(res.foundErrors).toEqual(false);
    });

    it("should mark hasErrors true if there are verify steps which return errors", async () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        verifySteps: [invalidVerifyStep],
      });

      const res = await runner.runPluginRoutine();

      expect(invalidVerifyStep.fn).toHaveBeenCalledTimes(1);
      expect(res.foundErrors).toEqual(true);
    });

    it("should mark foundErrors false if there are verify steps which return no errors", async () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        verifySteps: [mockSelfVerifyStep],
      });

      const res = await runner.runPluginRoutine();

      expect(mockSelfVerifyStep.fn).toHaveBeenCalledTimes(1);
      expect(res.foundErrors).toEqual(false);
    });

    it("should call each verify step once per file read", async () => {
      const runner = new PlugInRunner({
        ...mockPlugin,
        getFilesFn: mockGetTwoFilesFn,
        verifySteps: [mockSelfVerifyStep, mockOtherVerifyStep],
      });

      await runner.runPluginRoutine();

      expect(mockSelfVerifyStep.fn).toHaveBeenCalledTimes(2);
      expect(mockOtherVerifyStep.fn).toHaveBeenCalledTimes(2);
    })
  })
});