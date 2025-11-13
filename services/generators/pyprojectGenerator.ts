/**
 * pyproject.toml Generator
 *
 * Generates modern Python packaging configuration compatible with
 * agent-starter-pack patterns and PEP 518/621 standards.
 */

import { Agent, GCPConfig } from '../../types';

/**
 * Generates pyproject.toml with project metadata and dependencies
 * @param agents - Array of agent configurations
 * @param gcpConfig - GCP deployment configuration
 * @returns TOML configuration string
 */
export const generatePyprojectToml = (agents: Agent[], gcpConfig: GCPConfig): string => {
    const allModels = agents.map(agent => agent.llmModel);
    const usesOpenAI = allModels.some(model => !model.startsWith('gemini'));
    const usesVertex = allModels.some(model => model.startsWith('gemini'));

    // Core dependencies
    const dependencies = [
        'chainlit>=1.3.0',
        'google-adk>=0.1.0',
        'requests>=2.31.0',
        'pydantic>=2.0.0',
    ];

    if (usesOpenAI) {
        dependencies.push('openai>=1.0.0');
    }
    if (usesVertex || gcpConfig.useMemoryBank) {
        dependencies.push('google-cloud-aiplatform>=1.70.0');
        dependencies.push('google-generativeai>=0.3.0');
    }

    // Development dependencies
    const devDependencies = [
        'pytest>=8.0.0',
        'pytest-asyncio>=0.23.0',
        'pytest-cov>=4.1.0',
        'ruff>=0.8.0',
        'mypy>=1.8.0',
        'black>=24.0.0',
        'python-dotenv>=1.0.0',
    ];

    return `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "chainlit-adk-agent"
version = "0.1.0"
description = "Multi-agent workflow built with ADK and Chainlit"
readme = "README.md"
requires-python = ">=3.10"
authors = [
    { name = "Agent Builder", email = "builder@example.com" }
]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: Apache Software License",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
${dependencies.map(dep => `    "${dep}",`).join('\n')}
]

[project.optional-dependencies]
dev = [
${devDependencies.map(dep => `    "${dep}",`).join('\n')}
]

# Google Cloud Platform extras
gcp = [
    "google-cloud-storage>=2.10.0",
    "google-cloud-logging>=3.5.0",
    "google-cloud-monitoring>=2.15.0",
]

# Production extras
prod = [
    "gunicorn>=22.0.0",
    "uvicorn[standard]>=0.30.0",
]

[project.urls]
Homepage = "https://github.com/yourusername/chainlit-adk-agent"
Documentation = "https://github.com/yourusername/chainlit-adk-agent#readme"
Repository = "https://github.com/yourusername/chainlit-adk-agent"

[tool.hatch.build.targets.wheel]
packages = ["backend"]

[tool.ruff]
line-length = 100
target-version = "py310"
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long (handled by formatter)
    "B008",  # do not perform function calls in argument defaults
    "B904",  # Allow raising exceptions without from e
]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false

[tool.ruff.isort]
known-first-party = ["backend"]

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = false
disallow_incomplete_defs = false
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
strict_equality = true

[[tool.mypy.overrides]]
module = [
    "chainlit.*",
    "adk.*",
    "google.generativeai.*",
]
ignore_missing_imports = true

[tool.pytest.ini_options]
minversion = "8.0"
addopts = [
    "-ra",
    "--strict-markers",
    "--strict-config",
    "--cov=backend",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--asyncio-mode=auto",
]
testpaths = ["tests"]
pythonpath = ["."]

[tool.coverage.run]
branch = true
source = ["backend"]
omit = [
    "*/tests/*",
    "*/__pycache__/*",
    "*/.venv/*",
]

[tool.coverage.report]
precision = 2
show_missing = true
skip_covered = false
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "if TYPE_CHECKING:",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]

[tool.black]
line-length = 100
target-version = ["py310", "py311", "py312"]
include = '\\.pyi?$'
extend-exclude = '''
/(
  # directories
  \\.eggs
  | \\.git
  | \\.hg
  | \\.mypy_cache
  | \\.tox
  | \\.venv
  | build
  | dist
)/
'''
`;
};
