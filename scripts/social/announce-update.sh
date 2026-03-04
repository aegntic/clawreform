#!/bin/bash
# clawREFORM by aegntic.ai Social Announcement Script
# Posts updates to Skool and X when improvements are made

set -e

echo "🦾 clawREFORM by aegntic.ai Social Update System"
echo "================================="

# Get commit info
COMMIT_MSG=$(git log -1 --pretty=%B | head -1)
COMMIT_HASH=$(git log -1 --pretty=%h)
COMMIT_DATE=$(date +"%Y-%m-%d %H:%M")

echo "Commit: $COMMIT_HASH - $COMMIT_MSG"
echo "Date: $COMMIT_DATE"

# Generate announcement message
MESSAGE="🦾 clawREFORM by aegntic.ai Update!

$COMMIT_MSG

Commit: $COMMIT_HASH
#clawREFORM by aegntic.ai #AI #SelfEvolving #AgentOS"

echo ""
echo "Announcement:"
echo "$MESSAGE"

# Save updates
mkdir -p /tmp/clawreform_updates
echo "$MESSAGE" > /tmp/clawreform_updates/last_update.txt
echo "✅ Updates saved to /tmp/clawreform_updates/"
