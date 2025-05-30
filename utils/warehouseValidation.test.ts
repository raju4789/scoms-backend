import * as warehouseValidation from './warehouseValidation';
import { AppError } from '../errors/AppError';

describe('warehouseValidation', () => {
  describe('validateWarehouseId', () => {
    it('does not throw for valid id', () => {
      expect(() => warehouseValidation.validateWarehouseId(1)).not.toThrow();
      expect(() => warehouseValidation.validateWarehouseId(100)).not.toThrow();
    });
    it('throws for invalid id', () => {
      expect(() => warehouseValidation.validateWarehouseId(0)).toThrow(AppError);
      expect(() => warehouseValidation.validateWarehouseId(-1)).toThrow(AppError);
      expect(() => warehouseValidation.validateWarehouseId(1.5)).toThrow(AppError);
      expect(() => warehouseValidation.validateWarehouseId(NaN)).toThrow(AppError);
    });
  });

  describe('validateCreateWarehouseInput', () => {
    const valid = { name: 'Main', latitude: 10, longitude: 20, stock: 0 };
    it('does not throw for valid input', () => {
      expect(() => warehouseValidation.validateCreateWarehouseInput(valid)).not.toThrow();
    });
    it('throws for missing or invalid name', () => {
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, name: '' })).toThrow(AppError);
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, name: '   ' })).toThrow(AppError);
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, name: undefined as any })).toThrow(AppError);
    });
    it('throws for missing or invalid latitude/longitude', () => {
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, latitude: undefined as any })).toThrow(AppError);
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, longitude: undefined as any })).toThrow(AppError);
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, latitude: 'a' as any })).toThrow(AppError);
    });
    it('throws for negative or invalid stock', () => {
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, stock: -1 })).toThrow(AppError);
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, stock: undefined as any })).toThrow(AppError);
      expect(() => warehouseValidation.validateCreateWarehouseInput({ ...valid, stock: 'a' as any })).toThrow(AppError);
    });
  });

  describe('validateUpdateWarehouseInput', () => {
    it('does not throw for valid stock or undefined', () => {
      expect(() => warehouseValidation.validateUpdateWarehouseInput({ stock: 0 })).not.toThrow();
      expect(() => warehouseValidation.validateUpdateWarehouseInput({ stock: 10 })).not.toThrow();
      expect(() => warehouseValidation.validateUpdateWarehouseInput({})).not.toThrow();
    });
    it('throws for negative or invalid stock', () => {
      expect(() => warehouseValidation.validateUpdateWarehouseInput({ stock: -1 })).toThrow(AppError);
      expect(() => warehouseValidation.validateUpdateWarehouseInput({ stock: undefined as any })).not.toThrow();
      expect(() => warehouseValidation.validateUpdateWarehouseInput({ stock: 'a' as any })).toThrow(AppError);
    });
  });
});
