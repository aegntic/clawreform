
import subprocess
import os
import math

os.chdir('/a0/usr/projects/clawreform')

# Terminal segments with timing
segments = [('\n\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m\n\x1b[36m║\x1b[0m                    \x1b[1;37m🦾 CLAWREFORM 0.2.1\x1b[0m                        \x1b[36m║\x1b[0m\n\x1b[36m║\x1b[0m              \x1b[37mSelf-Evolving AI Agent Framework\x1b[0m                 \x1b[36m║\x1b[0m\n\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m\n', 8), ('\x1b[32m$\x1b[0m clawreform --version\n\x1b[1;37mclawreform 0.2.1\x1b[0m\n\n', 4), ('\x1b[32m$\x1b[0m clawreform --help\n\x1b[33mUSAGE:\x1b[0m\n    clawreform [OPTIONS] [COMMAND]\n\n\x1b[33mCOMMANDS:\x1b[0m\n    start       Start the ClawReform daemon\n    stop        Stop the daemon\n    status      Show daemon status\n    skills      Manage skills\n    hands       Manage hands\n    mcp         MCP server management\n    self-modify Self-modification system\n', 8), ('\x1b[32m$\x1b[0m clawreform skills list --count\n\x1b[1;32m✓\x1b[0m \x1b[1;37m61 bundled skills available\x1b[0m\n\n\x1b[32m$\x1b[0m clawreform skills list | head -10\n\x1b[36m  •\x1b[0m ansible          - Ansible automation\n\x1b[36m  •\x1b[0m aws              - AWS cloud operations\n\x1b[36m  •\x1b[0m docker           - Container management\n\x1b[36m  •\x1b[0m github           - GitHub integration\n\x1b[36m  •\x1b[0m kubernetes       - K8s orchestration\n', 10), ('\x1b[32m$\x1b[0m clawreform hands list\n\x1b[1;34mHANDS:\x1b[0m\n\x1b[36m  •\x1b[0m browser    - Web automation with Playwright\n\x1b[36m  •\x1b[0m clip       - Clipboard operations\n\x1b[36m  •\x1b[0m collector  - Data collection\n\x1b[36m  •\x1b[0m researcher - Deep research\n\x1b[36m  •\x1b[0m twitter    - Social media automation\n', 8), ('\x1b[32m$\x1b[0m clawreform mcp list\n\x1b[1;35mMCP SERVERS:\x1b[0m\n\x1b[36m  •\x1b[0m filesystem          - File system access\n\x1b[36m  •\x1b[0m memory              - Persistent memory\n\x1b[36m  •\x1b[0m fetch               - HTTP requests\n\x1b[36m  •\x1b[0m github              - GitHub API\n\x1b[36m  •\x1b[0m sequential-thinking - Chain of thought\n', 8), ('\x1b[32m$\x1b[0m clawreform self-modify --help\n\x1b[1;33mSELF-MODIFICATION:\x1b[0m\n\x1b[37m  ClawReform can analyze and modify its own codebase:\x1b[0m\n\x1b[32m  ✓\x1b[0m Analyze codebase structure\n\x1b[32m  ✓\x1b[0m Propose improvements via natural language\n\x1b[32m  ✓\x1b[0m Create automatic backups\n\x1b[32m  ✓\x1b[0m Apply and validate changes\n\x1b[32m  ✓\x1b[0m Rollback if needed\n', 10), ('\n\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m\n\x1b[36m║\x1b[0m     \x1b[1;33m🌟 Star us: github.com/aegntic/clawreform\x1b[0m                 \x1b[36m║\x1b[0m\n\x1b[36m║\x1b[0m     \x1b[37m📖 Docs: docs.clawreform.ai\x1b[0m                              \x1b[36m║\x1b[0m\n\x1b[36m║\x1b[0m     \x1b[37m💬 Community: skool.com/autoclaw\x1b[0m                         \x1b[36m║\x1b[0m\n\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m\n', 8)]

# Generate video using ffmpeg drawtext filter
# Create a background and overlay text

fps = 30
width = 1920
height = 1080

# Build filter complex for all segments
current_time = 0
filter_parts = []

for i, (text, duration) in enumerate(segments):
    start_frame = int(current_time * fps)
    end_frame = int((current_time + duration) * fps)

    # Escape text for ffmpeg
    escaped_text = text.replace("'", "'\''").replace(":", "\:").replace("\x1b", "\x1b")

    current_time += duration

print(f"Total video duration: {current_time} seconds")

# Use a simpler approach - create video from images
