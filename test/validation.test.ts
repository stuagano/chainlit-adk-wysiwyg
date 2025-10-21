import { describe, it, expect } from 'vitest';
import { validateFilename, validateFilenames, sanitizeFilename } from '../utils/validation';

describe('validateFilename', () => {
  describe('should accept valid filenames', () => {
    it('accepts simple filenames', () => {
      expect(validateFilename('main.py')).toBe(true);
      expect(validateFilename('tools.py')).toBe(true);
      expect(validateFilename('README.md')).toBe(true);
      expect(validateFilename('requirements.txt')).toBe(true);
    });

    it('accepts filenames with subdirectories', () => {
      expect(validateFilename('src/main.py')).toBe(true);
      expect(validateFilename('lib/utils.py')).toBe(true);
      expect(validateFilename('docs/api.md')).toBe(true);
    });

    it('accepts filenames with dashes and underscores', () => {
      expect(validateFilename('my-file.py')).toBe(true);
      expect(validateFilename('my_file.py')).toBe(true);
      expect(validateFilename('cloud-build.yaml')).toBe(true);
    });

    it('accepts filenames with dots', () => {
      expect(validateFilename('.env')).toBe(true);
      expect(validateFilename('.gitignore')).toBe(true);
      expect(validateFilename('file.test.ts')).toBe(true);
    });
  });

  describe('should reject path traversal attempts', () => {
    it('rejects parent directory references', () => {
      expect(validateFilename('../etc/passwd')).toBe(false);
      expect(validateFilename('../../etc/passwd')).toBe(false);
      expect(validateFilename('dir/../../../etc/passwd')).toBe(false);
    });

    it('rejects filenames containing ..', () => {
      expect(validateFilename('file..txt')).toBe(false);
      expect(validateFilename('..hidden')).toBe(false);
    });

    it('rejects absolute paths (Unix)', () => {
      expect(validateFilename('/etc/passwd')).toBe(false);
      expect(validateFilename('/home/user/file.txt')).toBe(false);
      expect(validateFilename('/var/log/app.log')).toBe(false);
    });

    it('rejects absolute paths (Windows)', () => {
      expect(validateFilename('C:\\Windows\\System32\\file.txt')).toBe(false);
      expect(validateFilename('D:\\data\\file.txt')).toBe(false);
      expect(validateFilename('c:\\file.txt')).toBe(false);
    });
  });

  describe('should reject dangerous characters', () => {
    it('rejects null bytes', () => {
      expect(validateFilename('file\0.txt')).toBe(false);
      expect(validateFilename('file.txt\0')).toBe(false);
    });

    it('rejects shell metacharacters', () => {
      expect(validateFilename('file|command.txt')).toBe(false);
      expect(validateFilename('file&command.txt')).toBe(false);
      expect(validateFilename('file;command.txt')).toBe(false);
      expect(validateFilename('file$var.txt')).toBe(false);
      expect(validateFilename('file`command`.txt')).toBe(false);
      expect(validateFilename('file!.txt')).toBe(false);
      expect(validateFilename('file<redirect.txt')).toBe(false);
      expect(validateFilename('file>redirect.txt')).toBe(false);
    });
  });

  describe('should reject invalid inputs', () => {
    it('rejects empty strings', () => {
      expect(validateFilename('')).toBe(false);
      expect(validateFilename('   ')).toBe(false);
    });

    it('rejects non-string inputs', () => {
      expect(validateFilename(null as any)).toBe(false);
      expect(validateFilename(undefined as any)).toBe(false);
      expect(validateFilename(123 as any)).toBe(false);
      expect(validateFilename({} as any)).toBe(false);
    });
  });
});

describe('validateFilenames', () => {
  it('validates an array of filenames', () => {
    const result = validateFilenames(['main.py', 'tools.py', 'README.md']);
    expect(result.isValid).toBe(true);
    expect(result.invalidFiles).toEqual([]);
  });

  it('identifies invalid filenames in an array', () => {
    const result = validateFilenames([
      'main.py',
      '../etc/passwd',
      'tools.py',
      '/etc/hosts',
      'valid.txt'
    ]);
    expect(result.isValid).toBe(false);
    expect(result.invalidFiles).toEqual(['../etc/passwd', '/etc/hosts']);
  });

  it('handles empty array', () => {
    const result = validateFilenames([]);
    expect(result.isValid).toBe(true);
    expect(result.invalidFiles).toEqual([]);
  });

  it('identifies all invalid filenames', () => {
    const result = validateFilenames([
      '../bad1',
      '/bad2',
      'file\0bad3',
      'file|bad4'
    ]);
    expect(result.isValid).toBe(false);
    expect(result.invalidFiles.length).toBe(4);
  });
});

describe('sanitizeFilename', () => {
  it('removes path traversal sequences', () => {
    expect(sanitizeFilename('../file.txt')).toBe('_file.txt');
    expect(sanitizeFilename('../../etc/passwd')).toBe('__etc_passwd');
  });

  it('replaces path separators with underscores', () => {
    expect(sanitizeFilename('/etc/passwd')).toBe('_etc_passwd');
    expect(sanitizeFilename('C:\\Windows\\file.txt')).toBe('C:_Windows_file.txt');
  });

  it('removes null bytes', () => {
    expect(sanitizeFilename('file\0.txt')).toBe('file.txt');
  });

  it('removes dangerous shell characters', () => {
    expect(sanitizeFilename('file|command.txt')).toBe('filecommand.txt');
    expect(sanitizeFilename('file&cmd.txt')).toBe('filecmd.txt');
    expect(sanitizeFilename('file;cmd.txt')).toBe('filecmd.txt');
    expect(sanitizeFilename('file$var.txt')).toBe('filevar.txt');
  });

  it('trims whitespace', () => {
    expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
  });

  it('handles empty or invalid input', () => {
    expect(sanitizeFilename('')).toBe('');
    expect(sanitizeFilename(null as any)).toBe('');
    expect(sanitizeFilename(undefined as any)).toBe('');
  });

  it('preserves valid filenames', () => {
    expect(sanitizeFilename('valid-file_name.txt')).toBe('valid-file_name.txt');
    expect(sanitizeFilename('my.test.file.js')).toBe('my.test.file.js');
  });
});
