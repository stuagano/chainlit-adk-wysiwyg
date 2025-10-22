/**
 * Tools Generator
 *
 * Generates tools.py file containing Pydantic models and tool functions
 * for all tools used across agents.
 */

import { Tool } from '../../types';
import { toSnakeCase, toPascalCase, getPythonType } from './utils';

/**
 * Generates the complete tools.py file
 * @param allTools - Array of all tools from all agents
 * @returns Python code string for tools.py
 */
export const generateToolsPy = (allTools: Tool[]): string => {
    if (allTools.length === 0) {
        return `# No tools defined across any agents.`;
    }

    const hasWeatherTool = allTools.some(tool => toSnakeCase(tool.name) === 'get_weather');

    const imports = hasWeatherTool
        ? `from __future__ import annotations

import requests
from datetime import datetime
from typing import Optional
import typing
from pydantic import BaseModel, Field

`
        : `from pydantic import BaseModel, Field
import typing

`;

    // Remove duplicate tools by name
    const uniqueTools = Array.from(new Map(allTools.map(tool => [tool.name, tool])).values());

    const classAndFuncStrings = uniqueTools.map(tool => {
        if (toSnakeCase(tool.name) === 'get_weather') {
            return generateWeatherTool(tool);
        }
        return generateGenericTool(tool);
    }).join('\n');

    const toolList = `
tools = [${uniqueTools.map(t => toSnakeCase(t.name)).join(', ')}]
`;

    return imports + classAndFuncStrings + toolList;
};

/**
 * Generates the special weather tool with full implementation
 * @param tool - Weather tool configuration
 * @returns Python code for weather tool
 */
function generateWeatherTool(tool: Tool): string {
    const snakeCaseToolName = toSnakeCase(tool.name);
    const modelName = `${toPascalCase(tool.name)}Input`;

    return `
WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


class ${modelName}(BaseModel):
    location: str = Field(..., description="The city and state, e.g., 'San Francisco, CA'")
    unit: Optional[str] = Field(None, description="Temperature unit to return (celsius or fahrenheit). Defaults to fahrenheit.")
    time: Optional[str] = Field(None, description="Optional ISO timestamp or hour (e.g., '2025-10-20T22:00', '10 PM').")


def _geocode_${snakeCaseToolName}(name: str) -> tuple[float, float, str]:
    response = requests.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": name, "count": 1, "language": "en", "format": "json"},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    results = payload.get("results") or []
    if not results:
        raise ValueError(f"No geocoding results found for '{name}'.")
    result = results[0]
    label = ", ".join(filter(None, [result.get("name"), result.get("admin1"), result.get("country")]))
    return float(result["latitude"]), float(result["longitude"]), label


def _pick_unit_${snakeCaseToolName}(unit: Optional[str]) -> tuple[str, str]:
    normalized = (unit or "fahrenheit").strip().lower()
    if normalized in {"c", "celsius"}:
        return "celsius", "°C"
    return "fahrenheit", "°F"


def _match_hour_${snakeCaseToolName}(hours: list[str], target: Optional[str]) -> int:
    if not target or not hours:
        return 0
    try:
        return hours.index(target)
    except ValueError:
        try:
            desired = datetime.fromisoformat(target)
        except ValueError:
            return 0
        deltas = [abs((datetime.fromisoformat(ts) - desired).total_seconds()) for ts in hours]
        return int(min(range(len(deltas)), key=deltas.__getitem__))


def ${snakeCaseToolName}(inputs: ${modelName}) -> str:
    """${tool.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""

    latitude, longitude, label = _geocode_${snakeCaseToolName}(inputs.location)
    temperature_unit, unit_suffix = _pick_unit_${snakeCaseToolName}(inputs.unit)

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,weather_code,wind_speed_10m",
        "hourly": "temperature_2m,weather_code",
        "temperature_unit": temperature_unit,
        "forecast_days": 1,
    }
    forecast = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=10)
    forecast.raise_for_status()
    data = forecast.json()

    current = data.get("current", {})
    hourly = data.get("hourly", {})
    hourly_times = hourly.get("time", [])

    target_iso = None
    if inputs.time:
        try:
            dt = datetime.fromisoformat(inputs.time)
            target_iso = dt.replace(minute=0, second=0, microsecond=0).isoformat()
        except ValueError:
            try:
                parsed = datetime.strptime(inputs.time.strip().upper(), "%I %p")
                now = datetime.utcnow()
                dt = now.replace(hour=parsed.hour, minute=0, second=0, microsecond=0)
                target_iso = dt.isoformat(timespec="seconds")
            except ValueError:
                target_iso = None

    summary = [f"Weather for {label}"]
    temp = current.get("temperature_2m")
    if temp is not None:
        summary.append(f"Current temperature: {float(temp):.1f}{unit_suffix}")
    code = int(current.get("weather_code", 0))
    summary.append(f"Conditions: {WEATHER_CODES.get(code, 'Unknown conditions')}")
    wind = current.get("wind_speed_10m")
    if wind is not None:
        summary.append(f"Wind speed: {float(wind):.1f} m/s")

    if hourly_times:
        idx = _match_hour_${snakeCaseToolName}(hourly_times, target_iso)
        hourly_temp = hourly.get("temperature_2m", [None])[idx] if idx < len(hourly.get("temperature_2m", [])) else None
        hourly_code = hourly.get("weather_code", [None])[idx] if idx < len(hourly.get("weather_code", [])) else None
        hourly_desc = WEATHER_CODES.get(int(hourly_code or 0), "Unknown conditions")
        hourly_time = hourly_times[idx]
        if hourly_temp is not None:
            summary.append(f"Forecast @ {hourly_time}: {float(hourly_temp):.1f}{unit_suffix}, {hourly_desc}")

    return '\\n'.join(summary)
`;
}

/**
 * Generates a generic tool with placeholder implementation
 * @param tool - Tool configuration
 * @returns Python code for the tool
 */
function generateGenericTool(tool: Tool): string {
    const snakeCaseToolName = toSnakeCase(tool.name);
    const modelName = `${toPascalCase(tool.name)}Input`;

    const fields = tool.parameters.map(param => {
        const pythonType = getPythonType(param.type);
        const required = param.required;
        // Escape backslashes and double quotes for Python string literal
        const escapedParamDesc = param.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const fieldArgs = `description="${escapedParamDesc}"`;
        return `    ${toSnakeCase(param.name)}: ${required ? pythonType : `typing.Optional[${pythonType}]`} = Field(${required ? '...' : 'None'}, ${fieldArgs})`;
    }).join('\n');

    const model = `class ${modelName}(BaseModel):\n${fields || '    pass'}\n`;

    // Escape backslashes and double quotes for Python docstring
    const escapedToolDesc = tool.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const functionDef = `
def ${snakeCaseToolName}(inputs: ${modelName}) -> str:
    """${escapedToolDesc}"""
    # TODO: Implement the actual logic for this tool.
    # This is a placeholder implementation.
    print(f"Executing tool '${snakeCaseToolName}' with inputs: {inputs.dict()}")
    return f"Tool '${snakeCaseToolName}' executed successfully with inputs: {inputs.dict()}"
`;
    return model + functionDef;
}
