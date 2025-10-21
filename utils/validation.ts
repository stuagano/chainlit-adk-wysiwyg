/**
 * Security validation utilities for file operations
 */

/**
 * Validates a filename to prevent path traversal attacks
 *
 * @param filename - The filename to validate
 * @returns true if filename is safe, false otherwise
 *
 * @example
 * validateFilename("main.py") // true
 * validateFilename("../../etc/passwd") // false
 * validateFilename("/etc/passwd") // false
 * validateFilename("file\0.txt") // false
 */
export function validateFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // Reject if contains path traversal attempts
  if (filename.includes('..')) {
    return false;
  }

  // Reject if starts with absolute path
  if (filename.startsWith('/') || filename.startsWith('\\')) {
    return false;
  }

  // Reject if contains null bytes (could be used to bypass filters)
  if (filename.includes('\0')) {
    return false;
  }

  // Reject if contains Windows drive letters (C:, D:, etc.)
  if (/^[a-zA-Z]:/.test(filename)) {
    return false;
  }

  // Reject if filename is empty after trimming
  if (filename.trim().length === 0) {
    return false;
  }

  // Additional security: reject special shell characters that could be dangerous
  const dangerousChars = ['|', '&', ';', '$', '`', '!', '<', '>'];
  for (const char of dangerousChars) {
    if (filename.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates an array of filenames
 *
 * @param filenames - Array of filenames to validate
 * @returns Object with validation result and list of invalid filenames
 */
export function validateFilenames(filenames: string[]): {
  isValid: boolean;
  invalidFiles: string[];
} {
  const invalidFiles: string[] = [];

  for (const filename of filenames) {
    if (!validateFilename(filename)) {
      invalidFiles.push(filename);
    }
  }

  return {
    isValid: invalidFiles.length === 0,
    invalidFiles,
  };
}

/**
 * Sanitizes a filename by removing potentially dangerous characters
 * Note: This should be used in addition to validation, not as a replacement
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[|&;$`!<>]/g, '') // Remove dangerous shell chars
    .trim();
}
