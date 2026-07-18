const test = require('node:test');
const assert = require('node:assert');
const semanticRouter = require('./semantic_router');

// Keep original loadRegistry to restore after tests
const originalLoadRegistry = semanticRouter.loadRegistry;

test('semantic_router.routeQuery unit tests', async (t) => {
  t.afterEach(() => {
    // Restore original loadRegistry after each test
    semanticRouter.loadRegistry = originalLoadRegistry;
  });

  await t.test('no match path returns success: false with correct message', () => {
    // Mock loadRegistry to return a registry
    semanticRouter.loadRegistry = () => ({
      skills: [
        {
          id: "robotics_kinematics",
          name: "Robotics Kinematics",
          entrypoint: "some_path",
          validation: "some_validation",
          tags: ["kinematics"],
          keywords: ["ik"]
        }
      ]
    });

    // Run query with absolutely no overlap to the skill tags/keywords/name/id
    const query = "completely unrelated search terms";
    const result = semanticRouter.routeQuery(query);

    assert.deepStrictEqual(result, {
      success: false,
      message: "No matching capabilities found in the registry.",
      matches: []
    });
  });

  await t.test('direct id match path returns correct matched skill', () => {
    semanticRouter.loadRegistry = () => ({
      skills: [
        {
          id: "robotics_kinematics",
          name: "Robotics Kinematics",
          entrypoint: "some_path",
          validation: "some_validation",
          tags: ["kinematics"],
          keywords: ["ik"]
        }
      ]
    });

    const query = "robotics_kinematics";
    const result = semanticRouter.routeQuery(query);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.matched_skill.id, "robotics_kinematics");
    assert.ok(result.confidence_score > 0);
  });

  await t.test('name match path returns correct matched skill', () => {
    semanticRouter.loadRegistry = () => ({
      skills: [
        {
          id: "robotics_kinematics",
          name: "Robotics Kinematics",
          entrypoint: "some_path",
          validation: "some_validation",
          tags: ["kinematics"],
          keywords: ["ik"]
        }
      ]
    });

    const query = "kinematics";
    const result = semanticRouter.routeQuery(query);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.matched_skill.id, "robotics_kinematics");
  });

  await t.test('transitive dependencies resolution resolved correctly', () => {
    semanticRouter.loadRegistry = () => ({
      skills: [
        {
          id: "robotics_kinematics",
          name: "Robotics Kinematics",
          entrypoint: "some_path",
          validation: "some_validation",
          tags: ["kinematics"],
          keywords: ["ik"],
          dependencies: ["sensor_driver"]
        },
        {
          id: "sensor_driver",
          name: "Sensor Driver",
          entrypoint: "sensor_path",
          dependencies: ["i2c_bus"]
        },
        {
          id: "i2c_bus",
          name: "I2C Bus",
          entrypoint: "i2c_path"
        }
      ]
    });

    const query = "robotics_kinematics";
    const result = semanticRouter.routeQuery(query);

    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.dependencies_to_load, ["sensor_driver", "i2c_bus"]);
  });

  await t.test('unmocked loadRegistry function works correctly if registry file exists', () => {
    // This tests the real loadRegistry function
    const registry = semanticRouter.loadRegistry();
    assert.ok(Array.isArray(registry.skills));
  });
});
