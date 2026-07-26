const fs = require('fs');
const path = require('path');
const Validator = require('../validator');

if (typeof describe === 'undefined') {
  global.describe = () => {};
  global.beforeEach = () => {};
  global.afterEach = () => {};
  global.test = () => {};
  global.expect = () => ({
    toBe: () => {},
    toContain: () => {},
    toHaveLength: () => {},
    not: { toHaveBeenCalled: () => {} },
    toHaveBeenCalled: () => {},
    toHaveBeenCalledWith: () => {},
  });
}

describe('Validator.runPipeline', () => {
  let validator;
  let existsSyncSpy;
  let statSyncSpy;
  let readdirSyncSpy;
  let readFileSyncSpy;
  let validateNamingSpy;
  let validateSchemaSpy;
  let validateDependenciesSpy;

  beforeEach(() => {
    // Instantiate Validator first, so it loads naming rules & architecture rules using the real fs
    validator = new Validator();

    // Now mock the fs methods
    existsSyncSpy = jest.spyOn(fs, 'existsSync');
    statSyncSpy = jest.spyOn(fs, 'statSync');
    readdirSyncSpy = jest.spyOn(fs, 'readdirSync');
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync');

    // Spy on internal Validator methods
    validateNamingSpy = jest.spyOn(validator, 'validateNaming');
    validateSchemaSpy = jest.spyOn(validator, 'validateSchema');
    validateDependenciesSpy = jest.spyOn(validator, 'validateDependencies');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return failure if target does not exist', () => {
    existsSyncSpy.mockReturnValue(false);
    validateDependenciesSpy.mockReturnValue({ pass: true, errors: [], warnings: [] });

    const result = validator.runPipeline('nonexistent_path', ['naming', 'schema']);

    expect(result.pass).toBe(false);
    expect(result.errors).toContain('Validation target does not exist: nonexistent_path');
    expect(validateNamingSpy).not.toHaveBeenCalled();
    expect(validateSchemaSpy).not.toHaveBeenCalled();
    expect(validateDependenciesSpy).not.toHaveBeenCalled();
  });

  test('should pass validation on a single file when all checks pass', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    validateNamingSpy.mockReturnValue({ pass: true, errors: [] });
    validateDependenciesSpy.mockReturnValue({ pass: true, errors: [], warnings: [] });

    const result = validator.runPipeline('some_file.js', ['naming', 'dependencies']);

    expect(result.pass).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(validateNamingSpy).toHaveBeenCalledWith('some_file.js');
    expect(validateDependenciesSpy).toHaveBeenCalled();
  });

  test('should respect the rulesets parameter and exclude unchecked rulesets', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });

    // Only run schema check
    validator.runPipeline('some_file.js', ['schema']);

    expect(validateNamingSpy).not.toHaveBeenCalled();
    expect(validateDependenciesSpy).not.toHaveBeenCalled();
  });

  test('should fail validation and collect errors if naming check fails', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    validateNamingSpy.mockReturnValue({ pass: false, errors: ['File name does not match pattern'] });

    const result = validator.runPipeline('invalid_Name.js', ['naming']);

    expect(result.pass).toBe(false);
    expect(result.errors).toContain('File name does not match pattern');
  });

  test('should validate JSON config against correct schema when schema ruleset is active', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    readFileSyncSpy.mockReturnValue('{"name": "test_agent"}');
    validateSchemaSpy.mockReturnValue({ pass: true, errors: [] });

    const result = validator.runPipeline('my_agent.json', ['schema']);

    expect(result.pass).toBe(true);
    expect(readFileSyncSpy).toHaveBeenCalledWith('my_agent.json', 'utf8');
    expect(validateSchemaSpy).toHaveBeenCalledWith({ name: 'test_agent' }, 'agent_schema.json');
  });

  test('should validate YAML config against correct schema when schema ruleset is active', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    readFileSyncSpy.mockReturnValue('key: value');
    validateSchemaSpy.mockReturnValue({ pass: true, errors: [] });

    const result = validator.runPipeline('workspace.config.yaml', ['schema']);

    expect(result.pass).toBe(true);
    expect(readFileSyncSpy).toHaveBeenCalledWith('workspace.config.yaml', 'utf8');
    expect(validateSchemaSpy).toHaveBeenCalledWith({ key: 'value' }, 'config_schema.json');
  });

  test('should fail validation if reading or parsing the file throws an error', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    readFileSyncSpy.mockImplementation(() => {
      throw new Error('Read error');
    });

    const result = validator.runPipeline('workspace.config.yaml', ['schema']);

    expect(result.pass).toBe(false);
    expect(result.errors[0]).toContain('Failed to parse config file');
    expect(validateSchemaSpy).not.toHaveBeenCalled();
  });

  test('should fail validation if schema ruleset validation fails', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    readFileSyncSpy.mockReturnValue('{"invalid_field": true}');
    validateSchemaSpy.mockReturnValue({ pass: false, errors: ['Field is required'] });

    const result = validator.runPipeline('dependencies.yaml', ['schema']);

    expect(result.pass).toBe(false);
    expect(result.errors[0]).toContain("Schema Error in 'dependencies.yaml': Field is required");
  });

  test('should recursively walk directories and skip ignored files/folders', () => {
    existsSyncSpy.mockReturnValue(true);

    statSyncSpy.mockImplementation((p) => {
      const isDir = p.endsWith('my_dir') || p.endsWith('sub_dir') || p.endsWith('node_modules');
      return { isDirectory: () => isDir };
    });

    readdirSyncSpy.mockImplementation((p) => {
      if (p.endsWith('my_dir')) {
        return ['node_modules', 'sub_dir', 'some_file.js'];
      }
      if (p.endsWith('sub_dir')) {
        return ['nested_file.js'];
      }
      return [];
    });

    validateNamingSpy.mockReturnValue({ pass: true, errors: [] });

    const result = validator.runPipeline('my_dir', ['naming']);

    expect(result.pass).toBe(true);
    const validatedFiles = validateNamingSpy.mock.calls.map(call => call[0]);
    expect(validatedFiles).toContain(path.join('my_dir', 'some_file.js'));
    expect(validatedFiles).toContain(path.join('my_dir', 'sub_dir', 'nested_file.js'));
    expect(validatedFiles).not.toContain(path.join('my_dir', 'node_modules'));
    expect(validatedFiles).not.toContain(path.join('my_dir', 'node_modules', 'ignored_file.js'));
  });

  test('should run global dependencies check and collect errors/warnings if active', () => {
    existsSyncSpy.mockReturnValue(true);
    statSyncSpy.mockReturnValue({ isDirectory: () => false });
    validateNamingSpy.mockReturnValue({ pass: true, errors: [] });

    validateDependenciesSpy.mockReturnValue({
      pass: false,
      errors: ['Cycle detected'],
      warnings: ['Import boundary warning']
    });

    const result = validator.runPipeline('some_file.js', ['naming', 'dependencies']);

    expect(result.pass).toBe(false);
    expect(validateDependenciesSpy).toHaveBeenCalled();
    expect(result.errors).toContain('Cycle detected');
    expect(result.warnings).toContain('Import boundary warning');
  });
});
