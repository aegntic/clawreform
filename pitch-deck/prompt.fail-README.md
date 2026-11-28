# prompt.fail

A playful, creative landing page for the `prompt.fail` domain that documents AI prompt failures and promotes ClawPrompt + DevScribe products.

## Concept

- **Domain**: prompt.fail
- **Tagline**: "Your AI Prompts, Documented"
- **Tone**: Humorous, self-aware, helpful
- **Purpose**: Drive traffic to ClawPrompt and DevScribe while providing entertainment value

## Key Sections

1. **Hero**: Welcoming visitors to the "mistake museum"
2. **Terminal Animation**: Shows bash history of common prompt failures
3. **Hall of Shame**: Gallery of classic prompt failures (roleplay overflow, phantom libraries, etc.)
4. **Solutions**: Product cards for ClawPrompt and DevScribe
5. **Stats**: Humorous metrics (∞ failed prompts, 0 shame)
6. **Footer**: Links to aegntic.ai and clawREFORM

## Files

| File | Purpose |
|------|---------|
| `prompt.fail.html` | Main landing page |
| `prompt.fail-redirect.html` | Simple redirect to clawreform.com |
| `prompt.fail-README.md` | This documentation |

## Deployment Options

### Option 1: Standalone Static Site
Deploy `prompt.fail.html` as `index.html` to:
- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages

### Option 2: Redirect to Main Site
Use `prompt.fail-redirect.html` to redirect to `clawreform.com/prompt-fail`

### Option 3: Cloudflare Worker
```javascript
export default {
  async fetch(request) {
    return Response.redirect('https://clawreform.com/prompt-fail', 301);
  }
}
```

## DNS Setup

```
prompt.fail.    A       76.76.21.21  (Vercel)
# or
prompt.fail.    CNAME   clawreform.com
```

## Product Links

- **ClawPrompt**: `https://clawreform.com/clawprompt`
- **DevScribe**: `https://clawreform.com/devscribe`
- **aegntic.ai**: `https://aegntic.ai`

## Design System

Uses the clawREFORM design language:
- Dark theme with navy/charcoal backgrounds
- Amber/gold accent color (`#d9a75a`)
- Purple secondary accent (`#a58ef0`)
- Error red for failures (`#f07178`)
- Space Grotesk for headings
- JetBrains Mono for code/terminal

## License

Part of the clawREFORM project by aegntic.ai.
