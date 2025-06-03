import { NextFunction, Request, Response } from 'express';
import { sanitizeRequest, validateRequest, validateRequestFormat } from './validation';
import { ValidationError } from '../errors/ErrorTypes';

// Mock dependencies
jest.mock('../utils/logger');

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      correlationId: 'test-correlation-id',
      method: 'POST',
      get: jest.fn(),
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    describe('Basic Functionality', () => {
      it('should successfully validate valid data from body', () => {
        // Arrange
        const validationFn = jest.fn().mockReturnValue({ name: 'test', age: 25 });
        const middleware = validateRequest(validationFn, 'body');
        req.body = { name: 'test', age: 25 };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({ name: 'test', age: 25 });
        expect(req.body).toEqual({ name: 'test', age: 25 });
        expect(next).toHaveBeenCalledWith();
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('should successfully validate valid data from params', () => {
        // Arrange
        const validationFn = jest.fn().mockReturnValue({ id: '123' });
        const middleware = validateRequest(validationFn, 'params');
        req.params = { id: '123' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({ id: '123' });
        expect(req.params).toEqual({ id: '123' });
        expect(next).toHaveBeenCalledWith();
      });

      it('should successfully validate valid data from query', () => {
        // Arrange
        const validationFn = jest.fn().mockReturnValue({ page: '1', limit: '10' });
        const middleware = validateRequest(validationFn, 'query');
        req.query = { page: '1', limit: '10' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({ page: '1', limit: '10' });
        expect(req.query).toEqual({ page: '1', limit: '10' });
        expect(next).toHaveBeenCalledWith();
      });

      it('should default to body source when no source specified', () => {
        // Arrange
        const validationFn = jest.fn().mockReturnValue({ data: 'test' });
        const middleware = validateRequest(validationFn); // No source specified
        req.body = { data: 'test' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({ data: 'test' });
        expect(req.body).toEqual({ data: 'test' });
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Error Handling', () => {
      it('should handle ValidationError thrown by validation function', () => {
        // Arrange
        const validationError = new ValidationError('Invalid input data', {
          field: 'error message',
        });
        const validationFn = jest.fn().mockImplementation(() => {
          throw validationError;
        });
        const middleware = validateRequest(validationFn, 'body');
        req.body = { invalid: 'data' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({ invalid: 'data' });
        expect(next).toHaveBeenCalledWith(validationError);
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('should wrap generic Error in ValidationError', () => {
        // Arrange
        const genericError = new Error('Something went wrong');
        const validationFn = jest.fn().mockImplementation(() => {
          throw genericError;
        });
        const middleware = validateRequest(validationFn, 'body');
        req.body = { data: 'test' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({ data: 'test' });
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));

        const passedError = (next as jest.Mock).mock.calls[0][0];
        expect(passedError).toBeInstanceOf(ValidationError);
        expect(passedError.message).toBe('Something went wrong');
      });

      it('should wrap non-Error objects in ValidationError', () => {
        // Arrange
        const validationFn = jest.fn().mockImplementation(() => {
          throw 'String error';
        });
        const middleware = validateRequest(validationFn, 'body');
        req.body = { data: 'test' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));

        const passedError = (next as jest.Mock).mock.calls[0][0];
        expect(passedError).toBeInstanceOf(ValidationError);
        expect(passedError.message).toBe('Request validation failed');
      });

      it('should handle null/undefined validation function input', () => {
        // Arrange
        const validationFn = jest.fn().mockReturnValue(null);
        const middleware = validateRequest(validationFn, 'body');
        req.body = null;

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith(null);
        expect(req.body).toBe(null);
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Data Source Validation', () => {
      it('should validate and update body data', () => {
        // Arrange
        const transformedData = { cleanName: 'TEST', age: 25 };
        const validationFn = jest.fn().mockReturnValue(transformedData);
        const middleware = validateRequest(validationFn, 'body');
        req.body = { name: 'test', age: 25 };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual(transformedData);
        expect(next).toHaveBeenCalledWith();
      });

      it('should validate and update params data', () => {
        // Arrange
        const transformedData = { id: 123 }; // Converted from string to number
        const validationFn = jest.fn().mockReturnValue(transformedData);
        const middleware = validateRequest(validationFn, 'params');
        req.params = { id: '123' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(req.params).toEqual(transformedData);
        expect(next).toHaveBeenCalledWith();
      });

      it('should validate and update query data', () => {
        // Arrange
        const transformedData = { page: 1, limit: 10 }; // Converted from strings to numbers
        const validationFn = jest.fn().mockReturnValue(transformedData);
        const middleware = validateRequest(validationFn, 'query');
        req.query = { page: '1', limit: '10' };

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(req.query).toEqual(transformedData);
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Complex Validation Scenarios', () => {
      it('should handle complex nested object validation', () => {
        // Arrange
        const complexData = {
          user: { name: 'John', address: { street: '123 Main St', city: 'NYC' } },
          items: [
            { id: 1, quantity: 5 },
            { id: 2, quantity: 3 },
          ],
        };
        const validationFn = jest.fn().mockReturnValue(complexData);
        const middleware = validateRequest(validationFn, 'body');
        req.body = complexData;

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith(complexData);
        expect(req.body).toEqual(complexData);
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle empty object validation', () => {
        // Arrange
        const validationFn = jest.fn().mockReturnValue({});
        const middleware = validateRequest(validationFn, 'body');
        req.body = {};

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith({});
        expect(req.body).toEqual({});
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle array data validation', () => {
        // Arrange
        const arrayData = [{ name: 'item1' }, { name: 'item2' }];
        const validationFn = jest.fn().mockReturnValue(arrayData);
        const middleware = validateRequest(validationFn, 'body');
        req.body = arrayData;

        // Act
        middleware(req as Request, res as Response, next);

        // Assert
        expect(validationFn).toHaveBeenCalledWith(arrayData);
        expect(req.body).toEqual(arrayData);
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('validateRequestFormat', () => {
    describe('Content-Type Validation', () => {
      it('should pass validation for GET requests without content-type', () => {
        // Arrange
        req.method = 'GET';
        req.get = jest.fn().mockReturnValue(undefined);

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('should pass validation for POST requests with application/json content-type', () => {
        // Arrange
        req.method = 'POST';
        req.get = jest.fn().mockReturnValue('application/json');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
        expect(req.get).toHaveBeenCalledWith('content-type');
      });

      it('should pass validation for PUT requests with application/json content-type', () => {
        // Arrange
        req.method = 'PUT';
        req.get = jest.fn().mockReturnValue('application/json; charset=utf-8');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
      });

      it('should pass validation for PATCH requests with application/json content-type', () => {
        // Arrange
        req.method = 'PATCH';
        req.get = jest.fn().mockReturnValue('application/json');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
      });

      it('should fail validation for POST requests without content-type header', () => {
        // Arrange
        req.method = 'POST';
        req.get = jest.fn().mockReturnValue(undefined);

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));

        const passedError = (next as jest.Mock).mock.calls[0][0];
        expect(passedError).toBeInstanceOf(ValidationError);
        expect(passedError.message).toBe('Content-Type header is required');
      });

      it('should fail validation for POST requests with non-JSON content-type', () => {
        // Arrange
        req.method = 'POST';
        req.get = jest.fn().mockReturnValue('text/plain');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));

        const passedError = (next as jest.Mock).mock.calls[0][0];
        expect(passedError).toBeInstanceOf(ValidationError);
        expect(passedError.message).toBe('Content-Type must be application/json');
      });

      it('should fail validation for PUT requests with XML content-type', () => {
        // Arrange
        req.method = 'PUT';
        req.get = jest.fn().mockReturnValue('application/xml');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));

        const passedError = (next as jest.Mock).mock.calls[0][0];
        expect(passedError.message).toBe('Content-Type must be application/json');
      });

      it('should fail validation for PATCH requests with form-encoded content-type', () => {
        // Arrange
        req.method = 'PATCH';
        req.get = jest.fn().mockReturnValue('application/x-www-form-urlencoded');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));

        const passedError = (next as jest.Mock).mock.calls[0][0];
        expect(passedError.message).toBe('Content-Type must be application/json');
      });
    });

    describe('HTTP Method Coverage', () => {
      const nonDataMethods = ['GET', 'DELETE', 'HEAD', 'OPTIONS'];
      const dataMethods = ['POST', 'PUT', 'PATCH'];

      nonDataMethods.forEach(method => {
        it(`should not require content-type for ${method} requests`, () => {
          // Arrange
          req.method = method;
          req.get = jest.fn().mockReturnValue(undefined);

          // Act
          validateRequestFormat(req as Request, res as Response, next);

          // Assert
          expect(next).toHaveBeenCalledWith();
          expect(req.get).not.toHaveBeenCalled();
        });
      });

      dataMethods.forEach(method => {
        it(`should require JSON content-type for ${method} requests`, () => {
          // Arrange
          req.method = method;
          req.get = jest.fn().mockReturnValue(undefined);

          // Act
          validateRequestFormat(req as Request, res as Response, next);

          // Assert
          expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
          expect(req.get).toHaveBeenCalledWith('content-type');
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle case-insensitive content-type checking', () => {
        // Arrange
        req.method = 'POST';
        req.get = jest.fn().mockReturnValue('APPLICATION/JSON');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle content-type with additional parameters', () => {
        // Arrange
        req.method = 'POST';
        req.get = jest.fn().mockReturnValue('application/json; charset=utf-8; boundary=something');

        // Act
        validateRequestFormat(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('sanitizeRequest', () => {
    describe('Body Sanitization', () => {
      it('should remove dangerous fields from request body', () => {
        // Arrange
        req.body = {
          name: 'test',
          constructor: 'dangerous',
          prototype: { hack: 'attempt' },
          normalField: 'safe',
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual({
          name: 'test',
          normalField: 'safe',
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle nested objects with dangerous fields', () => {
        // Arrange
        req.body = {
          user: {
            name: 'john',
            profile: {
              age: 25,
              constructor: 'dangerous nested',
              address: {
                street: '123 Main St',
                prototype: 'deep nested danger',
              },
            },
          },
          constructor: 'top level danger',
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual({
          user: {
            name: 'john',
            profile: {
              age: 25,
              address: {
                street: '123 Main St',
              },
            },
          },
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle arrays with dangerous objects', () => {
        // Arrange
        req.body = {
          items: [
            {
              id: 1,
              name: 'item1',
            },
            {
              id: 2,
              constructor: 'another danger',
              name: 'item2',
            },
          ],
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual({
          items: [
            { id: 1, name: 'item1' },
            { id: 2, name: 'item2' },
          ],
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle primitive values in body', () => {
        // Arrange
        req.body = 'string value';

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toBe('string value');
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle null body', () => {
        // Arrange
        req.body = null;

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toBe(null);
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle undefined body', () => {
        // Arrange
        req.body = undefined;

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toBe(undefined);
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Query Sanitization', () => {
      it('should remove dangerous fields from query parameters', () => {
        // Arrange
        req.query = {
          search: 'test',
          constructor: 'dangerous query',
          prototype: { hack: 'query attempt' },
          page: '1',
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.query).toEqual({
          search: 'test',
          page: '1',
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle nested query objects', () => {
        // Arrange
        req.query = {
          filter: {
            name: 'john',
            status: 'active',
          },
          constructor: 'top level query danger',
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.query).toEqual({
          filter: {
            name: 'john',
            status: 'active',
          },
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle arrays in query parameters', () => {
        // Arrange
        req.query = {
          tags: ['tag1', 'tag2'],
          filters: [
            { type: 'status', value: 'active' },
            { type: 'category', value: 'tech', constructor: 'query danger' },
          ],
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.query).toEqual({
          tags: ['tag1', 'tag2'],
          filters: [
            { type: 'status', value: 'active' },
            { type: 'category', value: 'tech' },
          ],
        });
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('Edge Cases and Data Types', () => {
      it('should handle mixed data types correctly', () => {
        // Arrange
        req.body = {
          string: 'test',
          number: 42,
          boolean: true,
          date: new Date('2023-01-01'),
          nested: {
            array: [1, 2, { id: 3, constructor: 'nested array danger' }],
            null: null,
            undefined,
          },
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual({
          string: 'test',
          number: 42,
          boolean: true,
          date: new Date('2023-01-01'),
          nested: {
            array: [1, 2, { id: 3 }],
            null: null,
            undefined,
          },
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle deeply nested structures', () => {
        // Arrange
        const deeplyNested = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    data: 'deep',
                  },
                  constructor: 'level4 danger',
                },
              },
            },
          },
        };
        req.body = deeplyNested;

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual({
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    data: 'deep',
                  },
                },
              },
            },
          },
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle empty objects and arrays', () => {
        // Arrange
        req.body = {
          emptyObject: {},
          emptyArray: [],
        };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.body).toEqual({
          emptyObject: {},
          emptyArray: [],
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should handle circular references gracefully', () => {
        // Arrange
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const circular: any = { name: 'test' };
        circular.self = circular;
        // Don't add __proto__ as it's deprecated and causes linting issues
        req.body = circular;

        // Act & Assert - Should not throw an error
        expect(() => {
          sanitizeRequest(req as Request, res as Response, next);
        }).not.toThrow();

        expect(next).toHaveBeenCalledWith();
        // The circular reference should be replaced with an empty object
        expect(req.body).toEqual({ name: 'test', self: {} });
      });
    });

    describe('No Body or Query', () => {
      it('should handle requests with no body or query', () => {
        // Arrange
        delete req.body;
        delete req.query;

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
      });

      it('should preserve other request properties', () => {
        // Arrange
        req.params = { id: '123' };
        req.headers = { 'content-type': 'application/json' };
        req.body = { name: 'test', __proto__: { malicious: 'code' } };

        // Act
        sanitizeRequest(req as Request, res as Response, next);

        // Assert
        expect(req.params).toEqual({ id: '123' });
        expect(req.headers).toEqual({ 'content-type': 'application/json' });
        expect(req.body).toEqual({ name: 'test' });
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly when all middleware functions are chained', () => {
      // Arrange
      const validationFn = jest.fn().mockReturnValue({ name: 'CLEAN_NAME', age: 25 });
      const validateMiddleware = validateRequest(validationFn, 'body');

      req.method = 'POST';
      req.get = jest.fn().mockReturnValue('application/json');
      req.body = {
        name: 'test name',
        age: 25,
        __proto__: { malicious: 'code' },
      };

      const nextSpy = jest.fn();

      // Act - Chain the middleware
      validateRequestFormat(req as Request, res as Response, nextSpy);
      expect(nextSpy).toHaveBeenCalledWith(); // Format validation passed

      nextSpy.mockClear();
      sanitizeRequest(req as Request, res as Response, nextSpy);
      expect(nextSpy).toHaveBeenCalledWith(); // Sanitization passed
      expect(req.body).toEqual({ name: 'test name', age: 25 }); // Dangerous field removed

      nextSpy.mockClear();
      validateMiddleware(req as Request, res as Response, nextSpy);

      // Assert
      expect(validationFn).toHaveBeenCalledWith({ name: 'test name', age: 25 });
      expect(req.body).toEqual({ name: 'CLEAN_NAME', age: 25 });
      expect(nextSpy).toHaveBeenCalledWith();
    });

    it('should handle validation failure in middleware chain', () => {
      // Arrange
      const validationFn = jest.fn().mockImplementation(() => {
        throw new ValidationError('Age must be a number');
      });
      const validateMiddleware = validateRequest(validationFn, 'body');

      req.method = 'POST';
      req.get = jest.fn().mockReturnValue('application/json');
      req.body = { name: 'test', age: 'invalid' };

      const nextSpy = jest.fn();

      // Act
      validateRequestFormat(req as Request, res as Response, nextSpy);
      expect(nextSpy).toHaveBeenCalledWith(); // Format validation passed

      nextSpy.mockClear();
      sanitizeRequest(req as Request, res as Response, nextSpy);
      expect(nextSpy).toHaveBeenCalledWith(); // Sanitization passed

      nextSpy.mockClear();
      validateMiddleware(req as Request, res as Response, nextSpy);

      // Assert
      expect(nextSpy).toHaveBeenCalledWith(expect.any(ValidationError));
      const passedError = nextSpy.mock.calls[0][0];
      expect(passedError.message).toBe('Age must be a number');
    });
  });
});
