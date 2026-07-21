import { createTestModule } from '../app.testingModule';
import { removePrivateFields } from '@core/common';
import { TestCycleAService } from '../services';

describe('Cycle protection in removePrivateFields', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let cycleAService: TestCycleAService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    cycleAService = moduleRef.get(TestCycleAService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('C1: self-referencing cycle does not crash', () => {
    const obj: any = { id: 1, name: 'root', secretA: 'hidden' };
    obj.self = obj;

    expect(removePrivateFields([obj], { allow: false })).toBeDefined();
  });

  it('C2: mutual cycle (A→B→A) does not crash', () => {
    const a: any = { id: 1, name: 'A', secretA: 'hidden_a' };
    const b: any = { id: 2, name: 'B', secretB: 'hidden_b' };
    a.b = b;
    b.a = a;

    expect(removePrivateFields([a], { allow: false })).toBeDefined();
  });

  it('C3: entity with circular TypeORM relation loads without crash', async () => {
    const result = await cycleAService.find({
      relations: [{ name: 'b' }],
    });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});