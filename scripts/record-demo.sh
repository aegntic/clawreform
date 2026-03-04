#!/bin/bash
# clawREFORM by aegntic.ai Demo Recording Script
# Records actual usage, combines with Remotion overlay, adds voiceover

set -e
PROJECT_DIR="/a0/usr/projects/clawreform"
DEMO_DIR="$PROJECT_DIR/demo"
RECORDING_DIR="$DEMO_DIR/raw-recordings"
OUTPUT_DIR="$DEMO_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🦾 clawREFORM by aegntic.ai Demo Recording Script${NC}"
echo "=================================="

# Create directories
mkdir -p "$RECORDING_DIR"

# Check for required tools
echo -e "${YELLOW}Checking dependencies...${NC}"
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg required"; exit 1; }

# Function to record terminal session
record_terminal() {
    echo -e "${GREEN}Recording terminal session...${NC}"
    echo "Run your clawREFORM by aegntic.ai commands, then press Ctrl+D to finish"
    
    # Use asciinema if available, otherwise script command
    if command -v asciinema >/dev/null 2>&1; then
        asciinema rec "$RECORDING_DIR/terminal.cast" --overwrite
        # Convert to video
        asciinema rec "$RECORDING_DIR/terminal.cast" --overwrite && \
        agg "$RECORDING_DIR/terminal.cast" "$RECORDING_DIR/terminal.mp4" 2>/dev/null || \
        echo "Install 'agg' to convert asciinema to video"
    else
        # Use script + ttyrec + tty2gif
        script -q -t 2>"$RECORDING_DIR/terminal.timing" "$RECORDING_DIR/terminal.log"
        echo "Terminal log saved. Use ttygif or similar to convert."
    fi
}

# Function to capture screenshots
capture_screenshots() {
    echo -e "${GREEN}Capturing screenshots...${NC}"
    
    # Wait for user to set up screen
    echo "Position clawREFORM by aegntic.ai dashboard in browser, then press Enter..."
    read
    
    # Capture using scrot or import (ImageMagick)
    if command -v scrot >/dev/null 2>&1; then
        scrot "$RECORDING_DIR/screenshot-01-dashboard.png"
        echo "Screenshot 1: Dashboard captured"
        
        echo "Show self-modification feature, then press Enter..."
        read
        scrot "$RECORDING_DIR/screenshot-02-selfmodify.png"
        
        echo "Show MCP servers status, then press Enter..."
        read
        scrot "$RECORDING_DIR/screenshot-03-mcp.png"
        
        echo "Show skills list, then press Enter..."
        read
        scrot "$RECORDING_DIR/screenshot-04-skills.png"
    elif command -v import >/dev/null 2>&1; then
        import "$RECORDING_DIR/screenshot-01-dashboard.png"
        echo "Screenshots captured"
    else
        echo "Install scrot or ImageMagick for screenshots"
    fi
}

# Function to record screen with ffmpeg
record_screen() {
    echo -e "${GREEN}Recording screen (15 seconds)...${NC}"
    echo "Make sure clawREFORM by aegntic.ai dashboard is visible!"
    sleep 3
    
    # Record screen using x11grab (requires X11)
    ffmpeg -f x11grab -video_size 1920x1080 -i :0.0 \
        -t 15 -c:v libx264 -preset fast -crf 22 \
        "$RECORDING_DIR/screen-recording.mp4" 2>/dev/null || \
    echo "Screen recording requires X11. Use alternative method."
}

# Function to generate voiceover using TTS
generate_voiceover() {
    echo -e "${GREEN}Generating voiceover...${NC}"
    
    VOICEOVER_TEXT="Welcome to clawREFORM by aegntic.ai, the Self-Evolving Agent Operating System.
    clawREFORM by aegntic.ai can modify itself through natural language requests.
    It comes with 61 bundled skills and 23 plus MCP servers.
    Seven specialized hands enable browser automation, clip operations, and more.
    Built in Rust for performance and reliability.
    clawREFORM by aegntic.ai. The AI that evolves."
    
    # Use espeak or festival for TTS
    if command -v espeak >/dev/null 2>&1; then
        espeak -v en-us -s 150 -w "$RECORDING_DIR/voiceover.wav" "$VOICEOVER_TEXT"
        ffmpeg -i "$RECORDING_DIR/voiceover.wav" -ac 2 -ar 44100 "$RECORDING_DIR/voiceover.mp3" 2>/dev/null
        echo "Voiceover generated"
    elif command -v festival >/dev/null 2>&1; then
        echo "$VOICEOVER_TEXT" | text2wave -o "$RECORDING_DIR/voiceover.wav"
        ffmpeg -i "$RECORDING_DIR/voiceover.wav" -ac 2 -ar 44100 "$RECORDING_DIR/voiceover.mp3" 2>/dev/null
        echo "Voiceover generated"
    else
        echo "Install espeak or festival for TTS voiceover"
    fi
}

# Function to combine everything
combine_demo() {
    echo -e "${GREEN}Combining demo components...${NC}"
    
    REMOTION_VIDEO="$DEMO_DIR/clawreform-remotion.mp4"
    OUTPUT_VIDEO="$OUTPUT_DIR/clawreform-complete-demo.mp4"
    
    if [ -f "$REMOTION_VIDEO" ]; then
        # Overlay Remotion video on top of screen recording
        if [ -f "$RECORDING_DIR/screen-recording.mp4" ]; then
            ffmpeg -i "$RECORDING_DIR/screen-recording.mp4" \
                   -i "$REMOTION_VIDEO" \
                   -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,180)'" \
                   -c:v libx264 -preset medium -crf 23 \
                   "$OUTPUT_VIDEO"
            echo -e "${GREEN}Complete demo created: $OUTPUT_VIDEO${NC}"
        else
            echo "No screen recording found. Using Remotion only."
            cp "$REMOTION_VIDEO" "$OUTPUT_VIDEO"
        fi
        
        # Add voiceover if available
        if [ -f "$RECORDING_DIR/voiceover.mp3" ]; then
            ffmpeg -i "$OUTPUT_VIDEO" -i "$RECORDING_DIR/voiceover.mp3" \
                   -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 \
                   "${OUTPUT_VIDEO%.mp4}-with-voice.mp4"
            echo -e "${GREEN}Demo with voiceover: ${OUTPUT_VIDEO%.mp4}-with-voice.mp4${NC}"
        fi
    else
        echo "Remotion video not found at $REMOTION_VIDEO"
    fi
}

# Main menu
main() {
    echo ""
    echo "1) Record terminal session"
    echo "2) Capture screenshots"
    echo "3) Record screen (15s)"
    echo "4) Generate voiceover (TTS)"
    echo "5) Combine all into final demo"
    echo "6) Full workflow (all steps)"
    echo "q) Quit"
    echo ""
    read -p "Select option: " choice
    
    case $choice in
        1) record_terminal ;;
        2) capture_screenshots ;;
        3) record_screen ;;
        4) generate_voiceover ;;
        5) combine_demo ;;
        6) 
           capture_screenshots
           record_screen
           generate_voiceover
           combine_demo
           ;;
        q) exit 0 ;;
        *) echo "Invalid option" ;;
    esac
}

main
