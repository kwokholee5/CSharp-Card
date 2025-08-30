/**
 * Result of a validation operation
 */
export interface IValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** Array of validation error messages */
  errors: string[];
  
  /** Array of validation warning messages */
  warnings?: string[];
  
  /** Additional context or metadata about the validation */
  metadata?: Record<string, any>;
}