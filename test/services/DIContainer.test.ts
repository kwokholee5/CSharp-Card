import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DIContainer } from '../../src/services/DIContainer';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('Service Registration', () => {
    it('should register a singleton service', () => {
      const factory = vi.fn(() => ({ value: 'test' }));
      
      container.registerSingleton('testService', factory);
      
      expect(container.isRegistered('testService')).toBe(true);
    });

    it('should register a transient service', () => {
      const factory = vi.fn(() => ({ value: 'test' }));
      
      container.registerTransient('testService', factory);
      
      expect(container.isRegistered('testService')).toBe(true);
    });

    it('should register an instance', () => {
      const instance = { value: 'test' };
      
      container.registerInstance('testService', instance);
      
      expect(container.isRegistered('testService')).toBe(true);
    });

    it('should throw error when registering duplicate service', () => {
      const factory = () => ({ value: 'test' });
      
      container.registerSingleton('testService', factory);
      
      expect(() => {
        container.registerSingleton('testService', factory);
      }).toThrow("Service with identifier 'testService' is already registered");
    });
  });

  describe('Service Resolution', () => {
    it('should resolve a singleton service', () => {
      const factory = vi.fn(() => ({ value: 'test' }));
      
      container.registerSingleton('testService', factory);
      const result = container.resolve('testService');
      
      expect(result).toEqual({ value: 'test' });
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should return same instance for singleton services', () => {
      const factory = vi.fn(() => ({ value: Math.random() }));
      
      container.registerSingleton('testService', factory);
      
      const result1 = container.resolve('testService');
      const result2 = container.resolve('testService');
      
      expect(result1).toBe(result2);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should return different instances for transient services', () => {
      const factory = vi.fn(() => ({ value: Math.random() }));
      
      container.registerTransient('testService', factory);
      
      const result1 = container.resolve('testService');
      const result2 = container.resolve('testService');
      
      expect(result1).not.toBe(result2);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should resolve registered instance', () => {
      const instance = { value: 'test' };
      
      container.registerInstance('testService', instance);
      const result = container.resolve('testService');
      
      expect(result).toBe(instance);
    });

    it('should throw error when resolving unregistered service', () => {
      expect(() => {
        container.resolve('nonExistentService');
      }).toThrow("Service with identifier 'nonExistentService' is not registered");
    });
  });

  describe('Dependency Injection', () => {
    interface IRepository {
      getData(): string;
    }

    interface IService {
      processData(): string;
    }

    class Repository implements IRepository {
      getData(): string {
        return 'data';
      }
    }

    class Service implements IService {
      constructor(private repository: IRepository) {}

      processData(): string {
        return `processed: ${this.repository.getData()}`;
      }
    }

    it('should inject dependencies through factory function', () => {
      container.registerSingleton<IRepository>('IRepository', () => new Repository());
      container.registerSingleton<IService>('IService', (container) => {
        const repository = container.resolve<IRepository>('IRepository');
        return new Service(repository);
      });

      const service = container.resolve<IService>('IService');
      const result = service.processData();

      expect(result).toBe('processed: data');
    });

    it('should handle complex dependency chains', () => {
      interface ILogger {
        log(message: string): void;
      }

      interface IDatabase {
        query(sql: string): string[];
      }

      interface IUserService {
        getUsers(): string[];
      }

      class Logger implements ILogger {
        log(message: string): void {
          // Mock implementation
        }
      }

      class Database implements IDatabase {
        constructor(private logger: ILogger) {}

        query(sql: string): string[] {
          this.logger.log(`Executing: ${sql}`);
          return ['user1', 'user2'];
        }
      }

      class UserService implements IUserService {
        constructor(
          private database: IDatabase,
          private logger: ILogger
        ) {}

        getUsers(): string[] {
          this.logger.log('Getting users');
          return this.database.query('SELECT * FROM users');
        }
      }

      container.registerSingleton<ILogger>('ILogger', () => new Logger());
      container.registerSingleton<IDatabase>('IDatabase', (container) => {
        const logger = container.resolve<ILogger>('ILogger');
        return new Database(logger);
      });
      container.registerSingleton<IUserService>('IUserService', (container) => {
        const database = container.resolve<IDatabase>('IDatabase');
        const logger = container.resolve<ILogger>('ILogger');
        return new UserService(database, logger);
      });

      const userService = container.resolve<IUserService>('IUserService');
      const users = userService.getUsers();

      expect(users).toEqual(['user1', 'user2']);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect circular dependencies', () => {
      container.registerSingleton('serviceA', (container) => {
        const serviceB = container.resolve('serviceB');
        return { name: 'A', dependency: serviceB };
      });

      container.registerSingleton('serviceB', (container) => {
        const serviceA = container.resolve('serviceA');
        return { name: 'B', dependency: serviceA };
      });

      expect(() => {
        container.resolve('serviceA');
      }).toThrow(/Circular dependency detected/);
    });

    it('should detect complex circular dependencies', () => {
      container.registerSingleton('serviceA', (container) => {
        const serviceB = container.resolve('serviceB');
        return { name: 'A', dependency: serviceB };
      });

      container.registerSingleton('serviceB', (container) => {
        const serviceC = container.resolve('serviceC');
        return { name: 'B', dependency: serviceC };
      });

      container.registerSingleton('serviceC', (container) => {
        const serviceA = container.resolve('serviceA');
        return { name: 'C', dependency: serviceA };
      });

      expect(() => {
        container.resolve('serviceA');
      }).toThrow(/Circular dependency detected/);
    });
  });

  describe('Container Management', () => {
    it('should unregister services', () => {
      const factory = () => ({ value: 'test' });
      
      container.registerSingleton('testService', factory);
      expect(container.isRegistered('testService')).toBe(true);
      
      const removed = container.unregister('testService');
      expect(removed).toBe(true);
      expect(container.isRegistered('testService')).toBe(false);
    });

    it('should return false when unregistering non-existent service', () => {
      const removed = container.unregister('nonExistentService');
      expect(removed).toBe(false);
    });

    it('should clear all services', () => {
      container.registerSingleton('service1', () => ({ value: 1 }));
      container.registerSingleton('service2', () => ({ value: 2 }));
      
      expect(container.getRegisteredServices()).toHaveLength(2);
      
      container.clear();
      
      expect(container.getRegisteredServices()).toHaveLength(0);
    });

    it('should get all registered service identifiers', () => {
      container.registerSingleton('service1', () => ({ value: 1 }));
      container.registerSingleton('service2', () => ({ value: 2 }));
      
      const services = container.getRegisteredServices();
      
      expect(services).toContain('service1');
      expect(services).toContain('service2');
      expect(services).toHaveLength(2);
    });
  });

  describe('Child Containers', () => {
    it('should create child container with parent registrations', () => {
      container.registerSingleton('parentService', () => ({ value: 'parent' }));
      
      const child = container.createChild();
      
      expect(child.isRegistered('parentService')).toBe(true);
      
      const result = child.resolve('parentService');
      expect(result).toEqual({ value: 'parent' });
    });

    it('should allow child to override parent registrations', () => {
      container.registerSingleton('service', () => ({ value: 'parent' }));
      
      const child = container.createChild();
      child.registerWithOverride('service', () => ({ value: 'child' }), 'singleton', true);
      
      const parentResult = container.resolve('service');
      const childResult = child.resolve('service');
      
      expect(parentResult).toEqual({ value: 'parent' });
      expect(childResult).toEqual({ value: 'child' });
    });
  });

  describe('Disposal', () => {
    it('should dispose services that implement dispose method', () => {
      const disposableMock = {
        value: 'test',
        dispose: vi.fn()
      };

      container.registerInstance('disposableService', disposableMock);
      container.resolve('disposableService'); // Ensure it's resolved
      
      container.dispose();
      
      expect(disposableMock.dispose).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', () => {
      const disposableMock = {
        value: 'test',
        dispose: vi.fn(() => {
          throw new Error('Disposal error');
        })
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      container.registerInstance('disposableService', disposableMock);
      container.resolve('disposableService');
      
      expect(() => container.dispose()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error disposing service:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should clear all services after disposal', () => {
      container.registerSingleton('service1', () => ({ value: 1 }));
      container.registerSingleton('service2', () => ({ value: 2 }));
      
      container.dispose();
      
      expect(container.getRegisteredServices()).toHaveLength(0);
    });
  });

  describe('Symbol Identifiers', () => {
    it('should work with symbol identifiers', () => {
      const serviceId = Symbol('TestService');
      const factory = () => ({ value: 'test' });
      
      container.registerSingleton(serviceId, factory);
      
      expect(container.isRegistered(serviceId)).toBe(true);
      
      const result = container.resolve(serviceId);
      expect(result).toEqual({ value: 'test' });
    });

    it('should work with class constructors as identifiers', () => {
      class TestService {
        getValue(): string {
          return 'test';
        }
      }

      container.registerSingleton(TestService, () => new TestService());
      
      expect(container.isRegistered(TestService)).toBe(true);
      
      const result = container.resolve(TestService);
      expect(result).toBeInstanceOf(TestService);
      expect(result.getValue()).toBe('test');
    });
  });
});