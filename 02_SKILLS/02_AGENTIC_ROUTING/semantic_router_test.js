const semanticRouter = require('./semantic_router');

describe('Semantic Router routeQuery', () => {
  let loadRegistrySpy;

  const mockRegistry = {
    skills: [
      {
        id: "simulation",
        name: "Physics Simulation",
        tags: ["gazebo", "dynamics"],
        keywords: ["ode", "solver"],
        dependencies: [],
        entrypoint: "path/to/simulation",
        validation: "path/to/validation"
      },
      {
        id: "pcb_design",
        name: "PCB Design",
        tags: ["electronics"],
        keywords: ["circuit"],
        dependencies: ["power_systems"],
        entrypoint: "path/to/pcb_design",
        validation: "path/to/pcb_validation"
      },
      {
        id: "power_systems",
        name: "Power Systems",
        tags: ["power"],
        keywords: ["battery"],
        dependencies: [],
        entrypoint: "path/to/power_systems",
        validation: "path/to/power_validation"
      },
      {
        id: "circular_a",
        name: "Circular A",
        tags: ["circ"],
        keywords: ["circ_a"],
        dependencies: ["circular_b"],
        entrypoint: "path/to/circular_a",
        validation: "path/to/val"
      },
      {
        id: "circular_b",
        name: "Circular B",
        tags: ["circ"],
        keywords: ["circ_b"],
        dependencies: ["circular_a"],
        entrypoint: "path/to/circular_b",
        validation: "path/to/val"
      }
    ]
  };

  beforeEach(() => {
    loadRegistrySpy = jest.spyOn(semanticRouter, 'loadRegistry').mockReturnValue(mockRegistry);
  });

  afterEach(() => {
    loadRegistrySpy.mockRestore();
  });

  test('should return success: false when no skill matches', () => {
    const result = semanticRouter.routeQuery('unrelated query text');
    expect(result.success).toBe(false);
    expect(result.message).toBe("No matching capabilities found in the registry.");
    expect(result.matches).toEqual([]);
  });

  test('should match skill exactly by ID and name (ID: 10 + name: 5 = 15)', () => {
    const result = semanticRouter.routeQuery('simulation');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('simulation');
    expect(result.confidence_score).toBe(1.0); // 15 / 15
    expect(result.all_matches).toContainEqual({ id: 'simulation', score: 15 });
  });

  test('should match skill by name word only (score 5)', () => {
    const result = semanticRouter.routeQuery('physics');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('simulation');
    expect(result.confidence_score).toBeCloseTo(5 / 15, 2);
    expect(result.all_matches).toContainEqual({ id: 'simulation', score: 5 });
  });

  test('should match skill by tag only (score 3)', () => {
    const result = semanticRouter.routeQuery('gazebo');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('simulation');
    expect(result.confidence_score).toBeCloseTo(3 / 15, 2);
    expect(result.all_matches).toContainEqual({ id: 'simulation', score: 3 });
  });

  test('should match skill by keyword only (score 2)', () => {
    const result = semanticRouter.routeQuery('ode');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('simulation');
    expect(result.confidence_score).toBeCloseTo(2 / 15, 2);
    expect(result.all_matches).toContainEqual({ id: 'simulation', score: 2 });
  });

  test('should aggregate multiple match scores correctly', () => {
    // For simulation: matches tag 'gazebo' (3) and keyword 'ode' (2) = 5
    const result = semanticRouter.routeQuery('gazebo ode');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('simulation');
    expect(result.confidence_score).toBeCloseTo(5 / 15, 2);
    const matchObj = result.all_matches.find(m => m.id === 'simulation');
    expect(matchObj.score).toBe(5);
  });

  test('should return transitively resolved dependencies', () => {
    // pcb_design matches tag "electronics" (3). It has dependency power_systems.
    const result = semanticRouter.routeQuery('electronics');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('pcb_design');
    expect(result.dependencies_to_load).toEqual(['power_systems']);
  });

  test('should safely handle circular dependencies without hanging', () => {
    const result = semanticRouter.routeQuery('circ_a');
    expect(result.success).toBe(true);
    expect(result.matched_skill.id).toBe('circular_a');
    expect(result.dependencies_to_load).toEqual(['circular_b', 'circular_a']);
  });
});
