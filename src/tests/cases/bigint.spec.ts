import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('BigInt precision', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('N19: +id loses precision beyond MAX_SAFE_INTEGER [BUG]', () => {
    const bigIdStr = '9007199254740993';
    const converted = +bigIdStr;
    expect(`${converted}`).not.toBe(bigIdStr);
    expect(`${converted}`).toBe('9007199254740992');
  });

  it('N19b: seed data ids survive +id conversion (small values)', () => {
    expect(+('1')).toBe(1);
    expect(+('2')).toBe(2);
    expect(+('3')).toBe(3);
  });

  it('N19c: find with large id does not match', async () => {
    const result = await service.findOne({ id: 9007199254740993 });
    expect(result).toBeUndefined();
  });
});
