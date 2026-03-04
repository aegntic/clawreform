#!/usr/bin/env python3
"""clawREFORM by aegntic.ai Demo Recording Script"""

import subprocess
import os
import sys
from pathlib import Path

PROJECT_DIR = Path("/a0/usr/projects/clawreform")
DEMO_DIR = PROJECT_DIR / "demo"
RECORDING_DIR = DEMO_DIR / "raw-recordings"

def run_cmd(cmd, check=True):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error: {result.stderr}")
    return result

def generate_voiceover():
    """Generate TTS voiceover"""
    RECORDING_DIR.mkdir(parents=True, exist_ok=True)
    
    text = ("Welcome to clawREFORM by aegntic.ai, the Self-Evolving Agent Operating System. "
            "Built entirely in Rust, clawREFORM by aegntic.ai represents a paradigm shift in AI agent architecture. "
            "With natural language self-modification, clawREFORM by aegntic.ai can update its own codebase "
            "through simple conversational requests. "
            "Sixty-one bundled skills cover everything from code execution to browser automation. "
            "Twenty-three MCP servers provide seamless integration with external tools. "
            "Seven specialized hands enable browser control, clipboard operations, and more. "
            "clawREFORM by aegntic.ai. The AI that evolves itself.")
    
    result = run_cmd("which espeak", check=False)
    if result.returncode == 0:
        wav_path = RECORDING_DIR / "voiceover.wav"
        mp3_path = RECORDING_DIR / "voiceover.mp3"
        run_cmd(f'espeak -v en-us -s 140 -w "{wav_path}" "{text}"')
        run_cmd(f'ffmpeg -y -i "{wav_path}" -ac 2 -ar 44100 "{mp3_path}"')
        print(f"Voiceover created: {mp3_path}")
        return mp3_path
    
    print("Install espeak for TTS")
    return None

def create_demo_video():
    """Combine Remotion video with voiceover"""
    RECORDING_DIR.mkdir(parents=True, exist_ok=True)
    
    remotion = DEMO_DIR / "clawreform-remotion.mp4"
    voiceover = RECORDING_DIR / "voiceover.mp3"
    output = DEMO_DIR / "clawreform-demo-with-voice.mp4"
    
    if not remotion.exists():
        print(f"Remotion video not found: {remotion}")
        return
    
    if voiceover.exists():
        cmd = f'ffmpeg -y -i "{remotion}" -i "{voiceover}" -c:v libx264 -preset medium -crf 23 -c:a aac -map 0:v:0 -map 1:a:0 -shortest "{output}"'
        run_cmd(cmd)
        print(f"Demo with voiceover: {output}")
    else:
        run_cmd(f'cp "{remotion}" "{output}"')
        print(f"Demo without voiceover: {output}")

if __name__ == "__main__":
    print("clawREFORM by aegntic.ai Demo Recording Script")
    generate_voiceover()
    create_demo_video()
