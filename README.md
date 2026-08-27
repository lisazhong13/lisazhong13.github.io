# Personal Website Template

A simple static portfolio website for GitHub Pages.

## Files
- `index.html`: website content
- `styles.css`: styling
- `script.js`: small dynamic year script
- `resume.pdf`: optional file you add yourself

## Deploy
Create a GitHub repository named `<your-github-username>.github.io`, upload these files to the root, then enable GitHub Pages from the `main` branch root folder.

## AI chat configuration (Vercel)

Add these environment variables in **Vercel → Project Settings → Environment Variables**:

- `GROQ_API_KEY`: your Groq secret key
- `GROQ_MODEL`: a model shown as available in your Groq account, for example `llama-3.3-70b-versatile`

Redeploy the project after changing an environment variable. Never put the Groq key in `script.js` or commit it to Git.
