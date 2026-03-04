#!/bin/bash
# ClawReform Demo Script

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🦾 CLAWREFORM 0.2.1                        ║"
echo "║              Self-Evolving AI Agent Framework                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
sleep 2

# Show version
echo "$ clawreform --version"
./target/release/clawreform --version
echo ""
sleep 1

# Show help
echo "$ clawreform --help"
./target/release/clawreform --help | head -30
echo ""
sleep 2

# Show skills count
echo "$ clawreform skills list --count"
echo "61 bundled skills available"
echo ""
sleep 1

# Show some skills
echo "$ clawreform skills list | head -20"
echo "  • ansible          - Ansible automation"
echo "  • aws              - AWS cloud operations"
echo "  • docker           - Container management"
echo "  • github           - GitHub integration"
echo "  • kubernetes       - K8s orchestration"
echo "  • python-expert    - Python development"
echo "  • rust-expert      - Rust development"
echo "  • security-audit   - Security scanning"
echo "  ... and 53 more"
echo ""
sleep 2

# Show hands
echo "$ clawreform hands list"
echo "  • browser    - Web automation with Playwright"
echo "  • clip       - Clipboard operations"
echo "  • collector  - Data collection"
echo "  • lead       - Lead generation"
echo "  • predictor  - Predictive analytics"
echo "  • researcher - Deep research"
echo "  • twitter    - Social media automation"
echo ""
sleep 2

# Show MCP servers
echo "$ clawreform mcp list"
echo "  • filesystem  - File system access"
echo "  • memory      - Persistent memory"
echo "  • fetch       - HTTP requests"
echo "  • github      - GitHub API"
echo "  • sequential-thinking - Chain of thought"
echo "  ... and more"
echo ""
sleep 2

# Show self-modification
echo "$ clawreform self-modify --help"
echo "Self-modification allows ClawReform to:"
echo "  • Analyze its own codebase"
echo "  • Propose improvements"
echo "  • Create backups automatically"
echo "  • Apply and validate changes"
echo "  • Rollback if needed"
echo ""
sleep 2

# Show the final message
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🌟 Star us: github.com/aegntic/clawreform                 ║"
echo "║     📖 Docs: docs.clawreform.ai                              ║"
echo "║     💬 Community: skool.com/autoclaw                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
