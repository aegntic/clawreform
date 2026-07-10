#!/bin/bash

# Obsidian Vault Organization Script (Using Real CLI Commands)
# Usage: ./organize-obsidian-vault.sh /path/to/vault

VAULT_PATH="$1"

if [ -z "$VAULT_PATH" ]; then
    echo "Usage: $0 /path/to/obsidian/vault"
    exit 1
fi

echo "Organizing Obsidian vault at: $VAULT_PATH"

# Step 1: Open vault to ensure it's accessible
echo "Step 1: Opening vault..."
obsidian --vault "$VAULT_PATH" --new-window

# Step 2: Search for orphan notes (notes with no links)
echo "Step 2: Finding orphan notes..."
obsidian search "file:*" --vault "$VAULT_PATH" | grep -v "\[\[" | head -20 > "$VAULT_PATH/orphan-notes.txt"

# Step 3: Create daily note template (for consistent structure)
echo "Step 3: Ensuring daily note structure..."
obsidian daily --vault "$VAULT_PATH"

# Note: Advanced organization requires manual work in the app
# The following are recommendations for manual execution:

echo "
MANUAL ORGANIZATION STEPS:

1. In Obsidian app, open Graph View
2. Click 'Open Graph Settings'
3. Set filters to show only connected nodes
4. Adjust forces: Link Force 0.8, Center Force 0.2, Repel Force 1.2
5. Enable 'Show Tags' and 'Show Attachments' as needed

6. Create CSS snippet for colors:
   - Go to Settings > Appearance > CSS Snippets
   - Create new snippet 'graph-colors.css'
   - Add color rules based on tags/folders

7. Install plugins via Community Plugins:
   - Dataview
   - Kanban
   - Excalidraw
   - Local Graph

8. Create taxonomy folders:
   - Projects/
   - Concepts/
   - References/
   - Archive/

9. Use Dataview to create index notes:
   - Example: TABLE file.name, category FROM \"\" WHERE category

10. Run semantic linking manually using Smart Connections plugin

For automatic tagging and linking, use the app's features or write custom scripts.
"

echo "Script complete. Follow manual steps in Obsidian app for full organization."