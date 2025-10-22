/**
 * Utility functions for sanitizing and transforming strings for code generation.
 */

/**
 * Converts a string to snake_case and ensures it's a valid Python identifier.
 * - Trims whitespace
 * - Converts to lowercase
 * - Replaces invalid characters with underscores
 * - Prepends underscore if it starts with a digit
 *
 * @param str - The string to convert
 * @returns A valid Python identifier in snake_case
 *
 * @example
 * toSnakeCase("My Tool Name") // => "my_tool_name"
 * toSnakeCase("123invalid") // => "_123invalid"
 */
export const toSnakeCase = (str: string): string => {
    return str
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
        .replace(/^(\d)/, '_$1');    // Prepend underscore if it starts with a number
};

/**
 * Converts a string to kebab-case (useful for service names, URLs, etc.).
 *
 * @param str - The string to convert
 * @returns A kebab-case string
 *
 * @example
 * toKebabCase("My Service Name") // => "my-service-name"
 * toKebabCase("CamelCase") // => "camel-case"
 */
export const toKebabCase = (str: string): string => {
    return str
        .replace(/[\s_]+/g, '-')
        .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
        .replace(/^-/, '')
        .toLowerCase();
};

/**
 * Converts a string to PascalCase (useful for Python class names).
 *
 * @param str - The string to convert
 * @returns A PascalCase string
 *
 * @example
 * toPascalCase("my_tool_name") // => "MyToolName"
 * toPascalCase("hello world") // => "HelloWorld"
 */
export const toPascalCase = (str: string): string => {
    return str.replace(/(?:^|[^a-zA-Z0-9])([a-zA-Z0-9])/g, (g) =>
        g.toUpperCase().replace(/[^a-zA-Z0-9]/g, '')
    );
};

/**
 * Escapes a string for safe use in Python string literals.
 * Escapes backslashes and double quotes.
 *
 * @param str - The string to escape
 * @returns An escaped string safe for Python
 *
 * @example
 * escapePythonString('He said "hello"') // => 'He said \\"hello\\"'
 * escapePythonString('C:\\path\\file') // => 'C:\\\\path\\\\file'
 */
export const escapePythonString = (str: string): string => {
    return str
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"');    // Then escape double quotes
};
