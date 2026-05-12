/**
 * Error simulation framework for testing error scenarios in mock mode.
 * Allows enabling/disabling specific error scenarios for endpoints.
 */

/**
 * Supported error scenarios for simulation.
 */
export type ErrorScenario =
  | 'network_error'
  | 'timeout'
  | 'rate_limit'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'server_error';

/**
 * Mock error simulator for testing error handling in development/mock mode.
 * Enables simulation of various error scenarios for specific endpoints.
 */
export class MockErrorSimulator {
  private enabledScenarios: Map<string, ErrorScenario> = new Map();

  /**
   * Enable an error scenario for a specific endpoint.
   * @param endpoint - The endpoint identifier (e.g., '/api/users', 'getUser')
   * @param scenario - The error scenario to simulate
   */
  enable(endpoint: string, scenario: ErrorScenario): void {
    this.enabledScenarios.set(endpoint, scenario);
  }

  /**
   * Disable error simulation for a specific endpoint.
   * @param endpoint - The endpoint identifier
   */
  disable(endpoint: string): void {
    this.enabledScenarios.delete(endpoint);
  }

  /**
   * Disable all error simulations.
   */
  disableAll(): void {
    this.enabledScenarios.clear();
  }

  /**
   * Check if error simulation is enabled for an endpoint.
   * @param endpoint - The endpoint identifier
   * @returns True if simulation is enabled for the endpoint
   */
  isEnabled(endpoint: string): boolean {
    return this.enabledScenarios.has(endpoint);
  }

  /**
   * Get the current error scenario for an endpoint.
   * @param endpoint - The endpoint identifier
   * @returns The error scenario or undefined if not enabled
   */
  getScenario(endpoint: string): ErrorScenario | undefined {
    return this.enabledScenarios.get(endpoint);
  }

  /**
   * Simulate the error scenario for an endpoint.
   * @param endpoint - The endpoint identifier
   * @returns Promise that resolves to true if caller should handle the response,
   *          or throws an error for network/timeout scenarios
   * @throws Error for network_error and timeout scenarios
   */
  async simulate(endpoint: string): Promise<boolean> {
    const scenario = this.enabledScenarios.get(endpoint);
    if (!scenario) {
      return false;
    }

    switch (scenario) {
      case 'network_error':
        throw new Error('Network Error');
      case 'timeout':
        await new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, 30000);
        });
        return true;
      case 'rate_limit':
        return true; // Caller should return 429 response
      case 'unauthorized':
        return true; // Caller should return 401 response
      case 'forbidden':
        return true; // Caller should return 403 response
      case 'not_found':
        return true; // Caller should return 404 response
      case 'validation_error':
        return true; // Caller should return 400 response
      case 'server_error':
        return true; // Caller should return 500 response
      default:
        return false;
    }
  }
}

/**
 * Singleton instance of MockErrorSimulator for use across the application.
 */
export const mockErrorSimulator = new MockErrorSimulator();
