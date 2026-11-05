# How to release

1. Update the version in `package.json` and run `npm run version`. Then merge the PR.
2. Publish a new GitHub release pointing to a commit already merged into `main`.
3. The workflow checks that the release commit is on `main`, then runs lint and unit tests before publishing the npm package. `npm test` builds the package; publish lifecycle scripts are disabled so the build does not run with `NPM_TOKEN`.
