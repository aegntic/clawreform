#!/usr/bin/env python3
"""clawREFORM by aegntic.ai Social Media Updater - Auto-generates posts for Skool and X"""

import os, json, subprocess
from datetime import datetime

def get_commit_info():
    result = subprocess.run(['git', 'log', '-1', '--pretty=format:%H%n%h%n%s%n%b'], capture_output=True, text=True)
    lines = result.stdout.strip().split('\n')
    return {'hash': lines[0], 'short_hash': lines[1], 'subject': lines[2], 'body': '\n'.join(lines[3:]) if len(lines) > 3 else ''}

def generate_announcement(commit):
    subject = commit['subject'].lower()
    if 'self-modify' in subject: emoji, category = '🦾', 'Self-Modification'
    elif 'mcp' in subject: emoji, category = '🔌', 'MCP Integration'
    elif 'skill' in subject: emoji, category = '📚', 'New Skill'
    elif 'fix' in subject or 'bug' in subject: emoji, category = '🔧', 'Bug Fix'
    elif 'feature' in subject or 'add' in subject: emoji, category = '✨', 'New Feature'
    else: emoji, category = '🦀', 'Improvement'
    
    tweet = f"""{emoji} clawREFORM by aegntic.ai Update: {category}

{commit['subject']}

🔗 github.com/aegntic/clawreform/commit/{commit['short_hash']}

#clawREFORM by aegntic.ai #AI #SelfEvolving #AgentOS #Rust"""
    return {'tweet': tweet[:280], 'category': category}

def main():
    print("🦾 clawREFORM by aegntic.ai Social Updater")
    commit = get_commit_info()
    announcement = generate_announcement(commit)
    print(f"\nCommit: {commit['short_hash']} - {commit['subject']}")
    print(f"\nTweet ({len(announcement['tweet'])} chars):\n{announcement['tweet']}")
    os.makedirs('/tmp/clawreform_updates', exist_ok=True)
    with open('/tmp/clawreform_updates/tweet.txt', 'w') as f: f.write(announcement['tweet'])
    print("\n📱 Ready to post to:")
    print("  - Skool: https://skool.com/autoclaw")
    print("  - X: https://x.com/clawreform")

if __name__ == '__main__':
    main()
