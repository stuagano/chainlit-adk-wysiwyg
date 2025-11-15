/**
 * __init__.py Generator
 *
 * Generates Python package initialization files
 */

/**
 * Generates backend/__init__.py
 * @returns Python package init content
 */
export const generateBackendInit = (): string => {
    return `"""
Chainlit ADK Multi-Agent Workflow Backend

This package contains the agent workflow implementation using
Google's Agent Development Kit (ADK) and Chainlit.
"""

__version__ = "0.1.0"
__author__ = "Agent Builder"

# Package-level imports for convenience
from .main import *
from .tools import *

__all__ = ["__version__", "__author__"]
`;
};
