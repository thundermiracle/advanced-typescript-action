# advanced-typescript-action

A template for creating a GitHub Action using TypeScript with advanced features to make your Github Action life easier.

## What's the problem?

[Official template](https://github.com/actions/typescript-action) of creating Github Action is very convenient, but not enough.

We should test it before release. Keeping the dependencies of Github Action up to date. Release it with readable changelogs. And of course, to let users use it more easily, creating correct tags is required.

All these chores are repetitive and boring without automation. So I created this template and hope it can help you too.

## What's included?

### basic features

- [x] TypeScript
- [x] ESLint with prettier
- [x] Using [`tsup`](https://github.com/egoist/tsup) to build & [`ncc`](https://github.com/vercel/ncc) to bundle

### test

Using [Vitest](https://vitest.dev/) to test the Github Action. It will run automatically when you push to the repository by CI workflow `test.yml`.

### changesets

Using [`changesets`](https://github.com/changesets/changesets) to manage the version of Github Action. It will create a PR with a changelog. After pr merged, it will create a tag. All these steps have already been included in the CI workflow `release.yml`.

### renovate

Using [renovate](https://github.com/renovatebot/renovate) to keep the dependencies up to date. It will automatically create a PR when the dependencies updated once a month.

Furthermore, CI workflow `renovate-changesets.yml` will automatically push a commit for `changesets` when renovate creates a PR. Very convenient!

### tag management

`changesets` will create the tags based on semver. But we usually want to create a tag with only major like `v1` to let users keep using the latest version.

CI workflow `tag-update.yml` will automatically re-tag the latest commit with major version when `changesets` creates a tag. For example, if `changesets` creates a tag `v1.2.3`, `tag-update.yml` will remove the latest `v1` and re-tag the latest commit with `v1` where tag `v1.2.3` points to.

## How to use

Create a Personal access token with `repo` & `workflow` scope and add it to the repository secrets with name `PAT_GITHUB`.

That's all! Now you can start to develop your Github Action.

## License

The scripts and documentation in this project are released under the [MIT License](./LICENSE)
