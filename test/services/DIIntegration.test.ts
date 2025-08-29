import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DIContainer } from '../../src/services/DIContainer';
import { ApplicationFactory } from '../../src/services/ApplicationFactory';
import { ServiceLocator, ServiceIdentifiers } from '../../src/services/ServiceConfiguration';
import { QuestionNotFoundError } from '../../src/errors/QuestionNotFoundError';
import { ValidationError } from '../../src/errors/ValidationError';
import { DataLoadError } from '../../src/errors/DataLoadError';
import { NavigationError } from '../../src/errors/NavigationError';

/**
 * Integration tests for Dependency Injection Container error handling scenarios
 * Tests the complete error handling flow across all DI components
 */
describe('DI Container Integration - Error Handling', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  afterEach(() => {
    ServiceLocator.clear();
    container.dispose();
  });

  describe('Service Registration Error Scenarios', () => {
    it('should handle duplicate service registration gracefully', () => {
      const factory = () => ({ value: 'test' });
      
      container.registerSingleton('testService', factory);
      
      expect(() => {
        container.registerSingleton('testService', factory);
      }).toThrow("Service with identifier 'testService' is already registered");
    });

    it('should handle registration with override when allowed', () => {
      const factory1 = () => ({ value: 'original' });
      const factory2 = () => ({ value: 'override' });
      
      container.registerSingleton('testService', factory1);
      
      // Should not throw when override is allowed
      expect(() => {
        container.registerWithOverride('testService', factory2, 'singleton', true);
      }).not.toThrow();
      
      const result = container.resolve('testService');
      expect(result.value).toBe('override');
    });

    it('should prevent registration override when not allowed', () => {
      const factory1 = () => ({ value: 'original' });
      const factory2 = () => ({ value: 'override' });
      
      container.registerSingleton('testService', factory1);
      
      expect(() => {
        container.registerWithOverride('testService', factory2, 'singleton', false);
      }).toThrow("Service with identifier 'testService' is already registered");
    });
  });

  describe('Service Resolution Error Scenarios', () => {
    it('should handle unregistered service resolution', () => {
      expect(() => {
        container.resolve('nonExistentService');
      }).toThrow("Service with identifier 'nonExistentService' is not registered");
    });

    it('should detect and prevent circular dependencies', () => {
      container.registerSingleton('serviceA', (container) => {
        return { dependency: container.resolve('serviceB') };
      });

      container.registerSingleton('serviceB', (container) => {
        return { dependency: container.resolve('serviceA') };
      });

      expect(() => {
        container.resolve('serviceA');
      }).toThrow(/Circular dependency detected/);
    });

    it('should handle factory function errors during resolution', () => {
      container.registerSingleton('errorService', () => {
        throw new Error('Factory error');
      });

      expect(() => {
        container.resolve('errorService');
      }).toThrow('Factory error');
    });

    it('should handle complex circular dependency chains', () => {
      container.registerSingleton('serviceA', (container) => {
        return { dependency: container.resolve('serviceB') };
      });

      container.registerSingleton('serviceB', (container) => {
        return { dependency: container.resolve('serviceC') };
      });

      container.registerSingleton('serviceC', (container) => {
        return { dependency: container.resolve('serviceA') };
      });

      expect(() => {
        container.resolve('serviceA');
      }).toThrow(/Circular dependency detected.*serviceA.*serviceB.*serviceC.*serviceA/);
    });
  });

  describe('Application Factory Error Scenarios', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock the question repository to fail during initialization
      await expect(
        ApplicationFactory.createApplication({
          questionPaths: ['non-existent-path'],
          autoInitialize: true
        })
      ).rejects.toThrow('Failed to initialize application');
    });

    it('should handle service locator configuration errors', () => {
      expect(() => {
        ServiceLocator.get(ServiceIdentifiers.QuestionManager);
      }).toThrow('ServiceLocator container is not configured. Call setContainer() first.');
    });

    it('should handle disposal errors without throwing', () => {
      const context = ApplicationFactory.createApplicationSync();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the container dispose to throw an error
      vi.spyOn(context.container, 'dispose').mockImplementation(() => {
        throw new Error('Disposal failed');
      });

      expect(() => {
        ApplicationFactory.dispose(context);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error disposing application context:', 
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handler Integration', () => {
    it('should handle application errors through the error handler', async () => {
      const app = await ApplicationFactory.createApplication({
        autoInitialize: false
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Test different error types
      const questionNotFoundError = new QuestionNotFoundError('test-id');
      const validationError = new ValidationError('Validation failed', ['Error 1']);
      const dataLoadError = new DataLoadError('test.json');
      const navigationError = new NavigationError('Navigation failed');

      expect(() => app.errorHandler.handleError(questionNotFoundError)).not.toThrow();
      expect(() => app.errorHandler.handleError(validationError)).not.toThrow();
      expect(() => app.errorHandler.handleError(dataLoadError)).not.toThrow();
      expect(() => app.errorHandler.handleError(navigationError)).not.toThrow();

      // Verify errors were logged
      expect(consoleSpy).toHaveBeenCalledWith('[QUESTION_NOT_FOUND] Question with id test-id not found');
      expect(consoleSpy).toHaveBeenCalledWith('[VALIDATION_ERROR] Validation failed');
      expect(consoleSpy).toHaveBeenCalledWith('[DATA_LOAD_ERROR] Failed to load data from test.json');
      expect(consoleSpy).toHaveBeenCalledWith('[NAVIGATION_ERROR] Navigation failed');

      consoleSpy.mockRestore();
      ApplicationFactory.dispose(app);
    });

    it('should handle non-application errors', async () => {
      const app = await ApplicationFactory.createApplication({
        autoInitialize: false
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const regularError = new Error('Regular error');

      expect(() => app.errorHandler.handleError(regularError)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', regularError);

      consoleSpy.mockRestore();
      ApplicationFactory.dispose(app);
    });
  });

  describe('Container Disposal Error Scenarios', () => {
    it('should handle disposal of services with dispose methods', () => {
      const disposableMock = {
        value: 'test',
        dispose: vi.fn()
      };

      container.registerInstance('disposableService', disposableMock);
      container.resolve('disposableService');

      expect(() => container.dispose()).not.toThrow();
      expect(disposableMock.dispose).toHaveBeenCalled();
    });

    it('should handle disposal errors from individual services', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const faultyDisposable = {
        value: 'test',
        dispose: vi.fn(() => {
          throw new Error('Disposal failed');
        })
      };

      container.registerInstance('faultyService', faultyDisposable);
      container.resolve('faultyService');

      expect(() => container.dispose()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error disposing service:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should clear all services after disposal even if some fail', () => {
      const workingDisposable = {
        dispose: vi.fn()
      };

      const faultyDisposable = {
        dispose: vi.fn(() => {
          throw new Error('Disposal failed');
        })
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      container.registerInstance('workingService', workingDisposable);
      container.registerInstance('faultyService', faultyDisposable);

      container.resolve('workingService');
      container.resolve('faultyService');

      container.dispose();

      expect(container.getRegisteredServices()).toHaveLength(0);
      expect(workingDisposable.dispose).toHaveBeenCalled();
      expect(faultyDisposable.dispose).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Child Container Error Scenarios', () => {
    it('should handle errors in child containers independently', () => {
      container.registerSingleton('parentService', () => ({ value: 'parent' }));
      
      const child = container.createChild();
      
      // Child should inherit parent services
      expect(() => child.resolve('parentService')).not.toThrow();
      
      // Child should handle its own errors
      expect(() => child.resolve('nonExistentService')).toThrow();
      
      // Parent should not be affected by child errors
      expect(() => container.resolve('parentService')).not.toThrow();
    });

    it('should handle circular dependencies across parent-child boundaries', () => {
      container.registerSingleton('parentService', (container) => {
        return { dependency: container.resolve('childService') };
      });

      const child = container.createChild();
      child.registerSingleton('childService', (container) => {
        return { dependency: container.resolve('parentService') };
      });

      expect(() => {
        child.resolve('parentService');
      }).toThrow(/Circular dependency detected/);
    });
  });

  describe('Service Locator Error Scenarios', () => {
    it('should handle service locator without configured container', () => {
      ServiceLocator.clear();
      
      expect(() => {
        ServiceLocator.get(ServiceIdentifiers.QuestionManager);
      }).toThrow('ServiceLocator container is not configured. Call setContainer() first.');
    });

    it('should handle service locator after container disposal', async () => {
      const app = await ApplicationFactory.createApplication({
        configureServiceLocator: true,
        autoInitialize: false
      });

      expect(ServiceLocator.isConfigured()).toBe(true);

      ApplicationFactory.dispose(app);

      expect(ServiceLocator.isConfigured()).toBe(false);
      expect(() => {
        ServiceLocator.get(ServiceIdentifiers.QuestionManager);
      }).toThrow('ServiceLocator container is not configured. Call setContainer() first.');
    });
  });

  describe('Memory Management and Resource Cleanup', () => {
    it('should properly clean up resources on container disposal', () => {
      const resources: any[] = [];
      
      container.registerSingleton('resourceService', () => {
        const resource = { id: Math.random() };
        resources.push(resource);
        return {
          resource,
          dispose: () => {
            const index = resources.indexOf(resource);
            if (index > -1) {
              resources.splice(index, 1);
            }
          }
        };
      });

      // Create multiple instances (should be same for singleton)
      const service1 = container.resolve('resourceService');
      const service2 = container.resolve('resourceService');
      
      expect(service1).toBe(service2);
      expect(resources).toHaveLength(1);

      container.dispose();

      expect(resources).toHaveLength(0);
    });

    it('should handle memory cleanup for transient services', () => {
      let instanceCount = 0;
      
      container.registerTransient('transientService', () => {
        instanceCount++;
        return { id: instanceCount };
      });

      const service1 = container.resolve('transientService');
      const service2 = container.resolve('transientService');

      expect(service1).not.toBe(service2);
      expect(instanceCount).toBe(2);

      // Transient services are not tracked for disposal
      container.dispose();
      
      // Container should be cleared
      expect(container.getRegisteredServices()).toHaveLength(0);
    });
  });
});