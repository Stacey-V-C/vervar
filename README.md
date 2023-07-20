VerVar is a tool for verifying variables either inside config files (where connections might not be verifiable at the level they are inside programming language files), across file types, or across workspaces.

It runs on plugins.  It is meant to be highly extensible.  It is meant to be useful.

Right now all plugins are file plugins, in the future it should be possible to add other kinds.  I am particularly interested in using language servers to verify data structures across repos, and possibly across languages, although this is all extremely speculative for the time being.

Model

The key components of VerVar are plugins, the runtime, and configuration.

A plugin is a program that will be run by the VerVar runtime.  It should include at least extract or verify logic, and often both.  It will pass extracted values back to the runtime, and can verify both values that it extracts, as well as previously extracted values via explicitly declared dependencies.  Right now all plugins are file plugins, and have the following parameters available:

- 'name' - the name of the plugin
- 'path' - the default path to look for - depending on the fileFn (see below) this might be a file or a directory
- 'fileFn' - a function that takes a path and returns a (node.JS) FileHandle or an array of FileHandles.  Gives an error if no files are found.
- 'extractFn' - a function that takes a FileHandle and returns a map of arrays of strings
- 'verifySteps'(optional) - an array of VerifyStep objects.  These include
  - An 'argPath' array, specifying which sets of values to use.
  - A 'fn' that takes these values and returns an array of messages for any errors found.
- 'successMessage'(optional) - a custom message to print if the plugin finds no errors.  Overrides default success message.
- 'failureMessage'(optional) - a custom message to print if the plugin finds errors.  Overrides default failure message.

The VerVar runtime takes care of 
- verifying declared dependencies between plugins
- passing values between the file, extract and verify steps 
- running the plugins in the correct order
- passing the correct values to the correct plugins
- printing error and success messages as appropriate

The config file is a JSON file.  It must be contain a field called "plugins" which must be an array.  Each element of this array can either be the path of a plugin (to match javascript import syntax) or an object with these fields:
- plugin: the path of the plugin (to match javascript import syntax)
- overrides: an object with any of the parameters available to a plugin.  Each of these will override the default value for that parameter for the plugin.  This allows small, repo-specific changes to be made to a plugin without having to write an entirely new plugin.

A short-term concern is adding the ability to run a loader script to return a config object as an alternative to a static JSON file, as currently it is only possible to override the name and path fields, not functions.

Origin

As a relatively new developer, I had just reached the point of maturity where I realized that adding additional verification tooling - such as tests and strong typing - would consistently:
- save me a lot of stress
- help me to think about data and logic design
- let me continue thinking about my code on a functional level (i.e. avoid having to constantly be dragged down into the level of manually checking token correctness and return formats when I run into unexpected behavior).

Then I started doing infrastructure work and suddenly found that I was making these same token/formatting level mistakes because I was working with a series of .yaml and JSON files that had none of the typechecking et al that I'd just gotten used to.  I had also noticed that verifying request and response types across HTTP calls, even when well typed (and this has not always been the case), would consistently bring back this friction due to lacking automatic tooling.

Design Thoughts

I knew I wanted a tool that I'd be able to use at my own workplace, and I also had a feeling it might be worth open sourcing this tool (or, at the very least, taking it with me into future projects and workplaces).  Having a completely modular architecture - and the ability to easily fine-tune those modules - is the way I hope to bridge the contradiction here.  This is especially true as I know my own knowledge of how config files can be structured (both within and among themselves) is fairly limited at this time.

To use named arrays of strings felt like the most flexible option here, vs attempting to match specific shapes used by various config files.  I was somewhat inspired by Doug McIllroy's incitement to "Write programs to handle text streams, because that is a universal interface." - however, it should be relatively easy to extend VerVar to handle other types of data structures if that should prove important in the future (and if I ever look into verifying types across repos and/or languages I have a feeling it will).

To use a command line binary run in specific folders felt like the most feasible way to begin using the tool regularly in small chunks, and I don't expect I'll need to run it particularly often at this point.  Eventually I'd be interesting in running a daemon with file watchers, continuing to keep the tool highly customizable at this level to avoid any overhead from unnecessary file lookups or pipelines.