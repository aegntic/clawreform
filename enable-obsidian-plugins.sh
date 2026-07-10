#!/bin/bash

# Enable Obsidian Community Plugins and Configure API
# Usage: ./enable-obsidian-plugins.sh /path/to/vault

VAULT_PATH="$1"

if [ -z "$VAULT_PATH" ]; then
    echo "Usage: $0 /path/to/obsidian/vault"
    exit 1
fi

OBSIDIAN_CONFIG="$VAULT_PATH/.obsidian/app.json"
COMMUNITY_PLUGIN_PATH="$VAULT_PATH/.obsidian/community-plugins.json"

echo "Enabling community plugins for vault at: $VAULT_PATH"

# Create .obsidian directory if it doesn't exist
mkdir -p "$VAULT_PATH/.obsidian"

# Enable community plugins in app.json
if [ -f "$OBSIDIAN_CONFIG" ]; then
    # Update existing config
    python3 -c "
import json
with open('$OBSIDIAN_CONFIG', 'r') as f:
    config = json.load(f)
config['communityPlugins'] = True
config['pluginImportDisabled'] = False
with open('$OBSIDIAN_CONFIG', 'w') as f:
    json.dump(config, f, indent=2)
print('Community plugins enabled in app.json')
"
else
    # Create new config
    echo '{
  "communityPlugins": true,
  "pluginImportDisabled": false,
  "legacyEditor": false,
  "livePreview": true
}' > "$OBSIDIAN_CONFIG"
    echo "Created app.json with community plugins enabled"
fi

# Create empty community-plugins.json if it doesn't exist
if [ ! -f "$COMMUNITY_PLUGIN_PATH" ]; then
    echo '[]' > "$COMMUNITY_PLUGIN_PATH"
    echo "Created community-plugins.json"
fi

# List of recommended plugins for semantic organization
echo "
RECOMMENDED PLUGINS TO INSTALL:

1. Smart Connections - AI-powered semantic search
2. Dataview - Dynamic queries and organization
3. Local Graph - Enhanced graph visualization
4. Excalidraw - Visual diagrams
5. Kanban - Task organization
6. Templater - Template automation

INSTALLATION COMMANDS (run after Obsidian restarts):
"

# Restart Obsidian to apply changes
echo "Restarting Obsidian to apply changes..."
obsidian --vault "$VAULT_PATH" --new-window &

sleep 3

echo "
NEXT STEPS:
1. Open Obsidian Settings (Ctrl/Cmd + ,)
2. Go to Community Plugins
3. Click 'Browse' to search and install plugins
4. Enable installed plugins by toggling them on

For Gemini API integration:
1. Install 'Smart Connections' or 'Text Generator' plugin
2. Go to plugin settings
3. Select Gemini as AI provider
4. Enter your Gemini Pro API key
5. Configure embedding model for semantic search
"

echo "Community plugins enabled. Restart Obsidian to see changes."