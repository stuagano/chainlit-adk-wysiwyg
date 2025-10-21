# Chainlit Configuration Skill

This skill helps you work with Chainlit configurations and the live preview system.

## Context

The project integrates with Chainlit for live preview of generated agents. Chainlit runs on port 8000 and provides an interactive chat UI for testing agents.

## Key Responsibilities

1. **Chainlit UI Configuration**: Welcome messages, input placeholders, branding
2. **Process Management**: Starting/stopping Chainlit dev server
3. **Hot Reload**: Syncing code changes to live preview
4. **Port Management**: Ensuring Chainlit runs on correct port

## Key Files

- `components/ChainlitConfig.tsx` - Chainlit UI configuration panel
- `services/chainlitProcess.ts` - Process spawning and management
- `vite.config.ts` - Sync and launch API endpoints
- `chainlit.md` - Chainlit welcome screen content
- `chainlit_app/` - Generated Python app directory

## Chainlit Configuration Options

### UI Customization
- **Welcome Message**: Shown when chat starts
- **Input Placeholder**: Hint text in chat input
- **Agent Name**: Display name in UI
- **Starters**: Pre-defined conversation starters

### Generated Files
- `main.py` - Agent orchestration code
- `tools.py` - Tool implementations
- `requirements.txt` - Python dependencies
- `.chainlit/` - Chainlit config directory

## Common Tasks

### Adding New Chainlit UI Options

1. Update `Agent` interface in `types.ts`
2. Add UI controls in `ChainlitConfig.tsx`
3. Update code generation in `codeGenerator.ts`
4. Test with live preview

### Debugging Preview Issues

1. Check Chainlit process status
2. Verify port 8000 is available
3. Check Python compilation errors
4. Review Chainlit logs in console

### Syncing Code to Preview

Process flow:
1. User clicks "Sync to Chainlit"
2. Code written to temp directory
3. Python compile-time validation
4. Files copied to `chainlit_app/`
5. Chainlit auto-reloads

## API Endpoints (Vite Config)

### `/api/sync-chainlit` (POST)
Syncs generated code to Chainlit app directory.

Request:
```json
{
  "code": {
    "main.py": "...",
    "tools.py": "...",
    "requirements.txt": "..."
  }
}
```

### `/api/launch-chainlit` (POST)
Launches Chainlit dev server if not running.

Returns:
```json
{
  "success": true,
  "alreadyRunning": false
}
```

## Process Management

```typescript
// Check if running
const running = await isChainlitRunning();

// Launch if needed
if (!running) {
  await launchChainlit();
}
```

## Best Practices

1. Always validate code before syncing
2. Handle process errors gracefully
3. Auto-open preview in new tab
4. Show clear status messages
5. Kill process on app exit
6. Use hot reload for fast iteration

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:8000 | xargs kill -9
```

### Chainlit Not Starting
- Check Python installation
- Verify requirements installed
- Check file permissions

### Hot Reload Not Working
- Verify file watching enabled
- Check Chainlit version
- Restart dev server
