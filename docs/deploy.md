# Deploy

Live site:

https://baditaflorin.github.io/local-notion-ai/

Repository:

https://github.com/baditaflorin/local-notion-ai

## Publishing

GitHub Pages is configured to serve `main` branch `/docs`.

To republish manually:

```sh
make build
git add docs
git commit -m "build: publish pages"
git push
```

## Rollback

Revert the publishing commit and push:

```sh
git revert <commit>
git push
```

## Custom Domain

No custom domain is configured for v1. If one is added later, commit `docs/CNAME` and point DNS to GitHub Pages according to:

https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Pages Gotchas

- The app uses the base path `/local-notion-ai/`.
- GitHub Pages does not support custom `_headers` or `_redirects`.
- SPA fallback is handled by `docs/404.html`.
- Service worker scope must stay under `/local-notion-ai/`.

