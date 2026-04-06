# Public Repository Checklist

Use this checklist before changing the GitHub repository from private to public.

## Completed In This Repository

- Added a checked-in [LICENSE](../LICENSE) file for the source code.
- Added [ASSETS.md](../ASSETS.md) to separate code licensing from bundled raster-asset reuse.
- Updated [README.md](../README.md) with public-facing license, asset, and security guidance.
- Removed tracked scratch planning/log files and kept ignore rules so they are not reintroduced accidentally.
- Confirmed the repository does not require `.env` files for normal development or verification.

## Still Requires Owner Confirmation

- Confirm that every bundled raster asset in `public/assets/` and `docs/assets/` is safe to redistribute publicly.
- Confirm no local scratch files such as `progress.md`, `status.txt`, or `docs/superpowers/*` were force-added on the branch you are about to publish.
- Review the full commit history for material you would not want visible in a public archive, even if the current tree is clean.
- Enable the GitHub settings you want for a public project: issues, discussions, security advisories, private vulnerability reporting, and branch protection.

## Recommended Release Flow

1. Run `npm run verify:ci`.
2. Review the diff against `main` specifically for docs, media, and workflow files.
3. Confirm repository description, topics, and homepage URL in GitHub settings.
4. Enable your preferred security/contact channel before the visibility change.
5. Switch the repository visibility to public.
