/**
 * Simple Dependency Injection Container following Dependency Inversion Principle.
 * Manages service registration, resolution, and lifecycle.
 * Implements factory pattern for service creation.
 */

// Service registration types
type ServiceFactory<T = any> = (...args: any[]) => T;
type ServiceInstance<T = any> = T;
type ServiceLifetime = 'singleton' | 'transient';

interface ServiceRegistration<T = any> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: ServiceInstance<T>;
}

/**
 * Service identifier type for type-safe service resolution
 */
export type ServiceIdentifier<T = any> = string | symbol | (new (...args: any[]) => T);

/**
 * Simple dependency injection container implementation
 */
export class DIContainer {
  private readonly services = new Map<ServiceIdentifier, ServiceRegistration>();
  private readonly resolutionStack = new Set<ServiceIdentifier>();

  /**
   * Registers a service with the container using a factory function
   * @param identifier - Unique identifier for the service
   * @param factory - Factory function that creates the service instance
   * @param lifetime - Service lifetime (singleton or transient)
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    if (this.services.has(identifier)) {
      throw new Error(`Service with identifier '${String(identifier)}' is already registered`);
    }

    this.services.set(identifier, {
      factory,
      lifetime,
      instance: undefined
    });
  }

  /**
   * Registers a singleton service with the container
   * @param identifier - Unique identifier for the service
   * @param factory - Factory function that creates the service instance
   */
  registerSingleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>
  ): void {
    this.register(identifier, factory, 'singleton');
  }

  /**
   * Registers a transient service with the container
   * @param identifier - Unique identifier for the service
   * @param factory - Factory function that creates the service instance
   */
  registerTransient<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>
  ): void {
    this.register(identifier, factory, 'transient');
  }

  /**
   * Registers an existing instance as a singleton service
   * @param identifier - Unique identifier for the service
   * @param instance - Pre-created service instance
   */
  registerInstance<T>(
    identifier: ServiceIdentifier<T>,
    instance: T
  ): void {
    this.services.set(identifier, {
      factory: () => instance,
      lifetime: 'singleton',
      instance
    });
  }

  /**
   * Resolves a service from the container
   * @param identifier - Unique identifier for the service
   * @returns The resolved service instance
   * @throws Error if service is not registered or circular dependency is detected
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const registration = this.services.get(identifier);
    
    if (!registration) {
      throw new Error(`Service with identifier '${String(identifier)}' is not registered`);
    }

    // Check for circular dependencies
    if (this.resolutionStack.has(identifier)) {
      const stackArray = Array.from(this.resolutionStack);
      throw new Error(
        `Circular dependency detected: ${stackArray.map(id => String(id)).join(' -> ')} -> ${String(identifier)}`
      );
    }

    // For singleton services, return existing instance if available
    if (registration.lifetime === 'singleton' && registration.instance !== undefined) {
      return registration.instance;
    }

    // Add to resolution stack for circular dependency detection
    this.resolutionStack.add(identifier);

    try {
      // Create new instance using factory
      const instance = registration.factory(this);

      // Store instance for singleton services
      if (registration.lifetime === 'singleton') {
        registration.instance = instance;
      }

      return instance;
    } finally {
      // Remove from resolution stack
      this.resolutionStack.delete(identifier);
    }
  }

  /**
   * Checks if a service is registered with the container
   * @param identifier - Unique identifier for the service
   * @returns True if the service is registered, false otherwise
   */
  isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.services.has(identifier);
  }

  /**
   * Removes a service registration from the container
   * @param identifier - Unique identifier for the service
   * @returns True if the service was removed, false if it wasn't registered
   */
  unregister<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.services.delete(identifier);
  }

  /**
   * Clears all service registrations from the container
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Gets all registered service identifiers
   * @returns Array of all registered service identifiers
   */
  getRegisteredServices(): ServiceIdentifier[] {
    return Array.from(this.services.keys());
  }

  /**
   * Creates a child container that inherits from this container
   * Child containers can override parent registrations
   * @returns New child container instance
   */
  createChild(): DIContainer {
    const child = new DIContainer();
    
    // Copy parent registrations to child
    for (const [identifier, registration] of this.services) {
      child.services.set(identifier, {
        factory: registration.factory,
        lifetime: registration.lifetime,
        instance: registration.instance
      });
    }

    return child;
  }

  /**
   * Registers a service, allowing override of existing registrations
   * @param identifier - Unique identifier for the service
   * @param factory - Factory function that creates the service instance
   * @param lifetime - Service lifetime (singleton or transient)
   * @param allowOverride - Whether to allow overriding existing registrations
   */
  registerWithOverride<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = 'singleton',
    allowOverride: boolean = true
  ): void {
    if (!allowOverride && this.services.has(identifier)) {
      throw new Error(`Service with identifier '${String(identifier)}' is already registered`);
    }

    this.services.set(identifier, {
      factory,
      lifetime,
      instance: undefined
    });
  }

  /**
   * Disposes of all singleton instances that implement IDisposable
   * Useful for cleanup when shutting down the application
   */
  dispose(): void {
    for (const registration of this.services.values()) {
      if (registration.instance && typeof registration.instance === 'object') {
        const disposable = registration.instance as any;
        if (typeof disposable.dispose === 'function') {
          try {
            disposable.dispose();
          } catch (error) {
            // Error disposing service
          }
        }
      }
    }
    
    this.clear();
  }
}

/**
 * Default container instance for application-wide use
 */
export const defaultContainer = new DIContainer();