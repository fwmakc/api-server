import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';
import { SafeIdPipe } from '@core/common';
import { BadRequestException } from '@nestjs/common';

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

  it('N19: +id loses precision beyond MAX_SAFE_INTEGER (JS limitation)', () => {
    const bigIdStr = '9007199254740993';
    const converted = +bigIdStr;
    expect(`${converted}`).not.toBe(bigIdStr);
    expect(`${converted}`).toBe('9007199254740992');
  });

  it('N19b: seed data ids survive +id conversion (small values)', () => {
    expect(+'1').toBe(1);
    expect(+'2').toBe(2);
    expect(+'3').toBe(3);
  });

  it('N19c: find with large id does not match (no such record)', async () => {
    const result = await service.findOne({ id: '9007199254740993' });
    expect(result).toBeUndefined();
  });

  it('N19d: SafeIdPipe preserves bigint precision', () => {
    const pipe = new SafeIdPipe();
    const bigIdStr = '9007199254740993';
    const result = pipe.transform(bigIdStr);
    expect(result).toBe(bigIdStr);
    expect(typeof result).toBe('string');
  });

  it('N19e: SafeIdPipe rejects non-numeric input', () => {
    const pipe = new SafeIdPipe();
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
    expect(() => pipe.transform('1.5')).toThrow(BadRequestException);
    expect(() => pipe.transform('-1')).toThrow(BadRequestException);
  });

  it('N19f: SafeIdPipe accepts valid numeric strings', () => {
    const pipe = new SafeIdPipe();
    expect(pipe.transform('1')).toBe('1');
    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform('9007199254740993')).toBe('9007199254740993');
  });
});
