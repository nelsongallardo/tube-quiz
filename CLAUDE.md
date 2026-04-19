# CLAUDE.md

Notes for future Claude sessions working in this repo. Focus is on things that are non-obvious from reading the code.

## Repo layout: three copies of the app

The frontend exists in three places. Keep them in sync:

- **`index.html` + `style.css`** — dev version, external stylesheet. Edit here first.
- **`docs/index.html`** — single-file build with CSS inlined. Must mirror the dev version. CSS changes need to be applied to both `style.css` *and* the inlined `<style>` block here.
- **`gh-pages` branch** (`index.html` + `CNAME`) — what's actually served at tubesoundquiz.com. Content is a copy of `docs/index.html`.

## Default branch is not `main`

The default branch is `claude/tube-sound-quiz-app-xd6AN`. PRs merge into it. Don't assume `main` exists.

## Deployment (important)

GitHub Pages serves from the **`gh-pages` branch**, with custom domain `tubesoundquiz.com`. **Pushing to the default branch does NOT deploy.** `gh-pages` is updated manually.

To deploy the current state of `docs/index.html`:

```bash
git worktree add /tmp/tq-ghpages gh-pages
cp docs/index.html /tmp/tq-ghpages/index.html
git -C /tmp/tq-ghpages commit -am "Deploy: <summary>"
git -C /tmp/tq-ghpages push origin gh-pages
git worktree remove /tmp/tq-ghpages
```

Verify build: `gh api repos/nelsongallardo/tube-quiz/pages/builds/latest` — `"status":"built"` means done (usually under a minute). Hard-refresh the site (Cmd+Shift+R) to bypass cached CSS.

Do not touch `CNAME` on the `gh-pages` branch — it pins the custom domain.

## Tests

Run with `python3` (not `python`):

```bash
python3 -m unittest discover tests
```

`tests/test_footer_contact.py` validates both `index.html` copies in lockstep — if you change the footer in one file and not the other, the test will fail. That's intentional; it's the guardrail for the mirroring described above.

## PostHog

The PostHog snippet is embedded at the bottom of both HTML files with the project key inline. It's a public analytics key, not a secret — leave it in place when editing.
