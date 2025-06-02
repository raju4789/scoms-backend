import { getDiscountRate, haversineDistanceKm, runInTransaction } from './orderUtils';
import * as DataSourceConsul from '../config/data-source-consul';

describe('orderUtils', () => {
  describe('haversineDistanceKm', () => {
    it('returns 0 for identical coordinates', () => {
      expect(haversineDistanceKm(0, 0, 0, 0)).toBeCloseTo(0, 5);
    });
    it('calculates correct distance between two known points', () => {
      // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ~343km
      const dist = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
      expect(dist).toBeGreaterThan(340);
      expect(dist).toBeLessThan(350);
    });
    it('is symmetric', () => {
      const a = haversineDistanceKm(10, 20, 30, 40);
      const b = haversineDistanceKm(30, 40, 10, 20);
      expect(a).toBeCloseTo(b, 5);
    });
  });

  describe('getDiscountRate', () => {
    it('returns 0 for quantity below all tiers', () => {
      expect(getDiscountRate(1)).toBe(0);
      expect(getDiscountRate(24)).toBe(0);
    });
    it('returns correct discount for each tier', () => {
      expect(getDiscountRate(25)).toBe(0.05);
      expect(getDiscountRate(50)).toBe(0.1);
      expect(getDiscountRate(100)).toBe(0.15);
      expect(getDiscountRate(250)).toBe(0.2);
    });
    it('returns highest applicable discount for large quantity', () => {
      expect(getDiscountRate(1000)).toBe(0.2);
    });
    it('returns correct discount for values between tiers', () => {
      expect(getDiscountRate(49)).toBe(0.05);
      expect(getDiscountRate(99)).toBe(0.1);
      expect(getDiscountRate(249)).toBe(0.15);
    });
  });

  describe('runInTransaction', () => {
    it('calls the provided function with a manager and returns its result', async () => {
      // Mock getDataSource().transaction
      const mockManager = { id: 123 };
      const mockTransaction = jest.fn(async (fn: (manager: any) => Promise<any>) =>
        fn(mockManager),
      );
      jest.spyOn(DataSourceConsul, 'getDataSource').mockReturnValue({
        transaction: mockTransaction,
      } as unknown as import('typeorm').DataSource);
      const fn = jest.fn(async (manager) => manager.id);
      const result = await runInTransaction(fn);
      expect(fn).toHaveBeenCalledWith(mockManager);
      expect(result).toBe(123);
    });
  });
});

// NOTE: AppDataSource is not used in this project. Use getDataSource from data-source-consul if needed.
