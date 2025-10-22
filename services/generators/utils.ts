/**
 * Utility functions for code generation
 *
 * Provides string formatting and type conversion utilities
 * used across all code generators.
 */

import { Parameter } from '../../types';

/**
 * Converts a string to snake_case format for Python identifiers
 * @param str - The string to convert
 * @returns Snake case formatted string safe for Python variable names
 * @example
 * toSnakeCase("My Agent Name") // returns "my_agent_name"
 * toSnakeCase("123 Test") // returns "_123_test"
 */
export const toSnakeCase = (str: string): string => {
    // Sanitize the name to be a valid Python identifier
    return str
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
        .replace(/^(\d)/, '_$1');    // Prepend underscore if it starts with a number
};

/**
 * Converts a string to kebab-case format
 * @param str - The string to convert
 * @returns Kebab case formatted string
 * @example
 * toKebabCase("My Service Name") // returns "my-service-name"
 */
export const toKebabCase = (str: string): string => {
    return str
        .replace(/[\s_]+/g, '-')
        .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
        .replace(/^-/, '')
        .toLowerCase();
};

/**
 * Converts a string to PascalCase format
 * @param str - The string to convert
 * @returns PascalCase formatted string for Python class names
 * @example
 * toPascalCase("my agent name") // returns "MyAgentName"
 */
export const toPascalCase = (str: string): string => {
    return str.replace(
        /(?:^|[^a-zA-Z0-9])([a-zA-Z0-9])/g,
        (g) => g.toUpperCase().replace(/[^a-zA-Z0-9]/g, '')
    );
};

/**
 * Maps TypeScript parameter types to Python types
 * @param type - The parameter type from the UI
 * @returns The corresponding Python type annotation
 * @example
 * getPythonType('string') // returns 'str'
 * getPythonType('number') // returns 'float'
 */
export const getPythonType = (type: Parameter['type']): string => {
    switch (type) {
        case 'number': return 'float';
        case 'boolean': return 'bool';
        default: return 'str';
    }
};
