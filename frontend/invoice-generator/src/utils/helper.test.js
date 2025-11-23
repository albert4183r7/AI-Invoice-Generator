import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword } from './helper';

// UNIT TESTING
// We are testing pure functions in isolation. No UI, no Backend.

describe('Helper Functions', () => {
  
  describe('validateEmail', () => {
    it('should return valid for a correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result).toBe(''); // Assuming empty string means no error
    });

    it('should return error for invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result).toBe('Please enter a valid email address');
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result).toBe('Email is required');
    });
  });

  describe('validatePassword', () => {
    it('should fail if password is too short', () => {
      const result = validatePassword('123');
      expect(result).toBe('Password must be at least 6 characters');
    });

    it('should pass if password is long enough', () => {
      const result = validatePassword('1234567');
      expect(result).toBe('');
    });
  });
});