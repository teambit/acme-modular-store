---
name: bit-git-sync
description: Work in a Git repository that mirrors a Bit scope through `bit ci sync` (one repository per scope). Use when changing components in such a repository, shipping a change through a lane or a pull request, reading or fixing a sync pull request (including a `bit-sync-conflict` halt), making a change across several scopes, or connecting a new scope to a new repository.
---

# Bit ↔ Git sync

## Recognize the setup

A repository is a sync mirror when all three are present:
- `workspace.jsonc` has a `"teambit.git/ci": { "sync": … }` block, and its `defaultScope` names the scope it mirrors;
- `.github/workflows/bit-sync.yml` and `bit-release.yml` exist;
- `.bitmap` is committed.

## The model, in five lines

1. **One repository mirrors one scope.** Components from other scopes arrive as package dependencies, never as source.
2. **`main` equals the scope's main.** The workflows own it. Never push to `main` by hand.
3. **Each lane is a branch with the same name, plus a pull request.** The sync keeps them equal in both directions.
4. **Merging the pull request is the release.** `bit-release` merges the lane into the scope, exports new versions, archives the lane and commits the new `.bitmap` to `main`.
5. **The workflows do the work.** You change code, and then you either push a branch or export a lane.

## Make a change: pick a path

| You are… | Path | What you do | What appears |
| --- | --- | --- | --- |
| In the mirror repository (Copilot, an IDE, a plain git user) | **Git-first** | branch → edit → `bit validate` → commit → push → open a PR | `bit-adopt-pr` turns the PR into a lane. From then on every push snaps onto the lane. |
| In any Bit workspace (Claude Code with the Bit Cloud MCP) | **Bit-first** | `bit lane create` → edit → `bit validate` → `bit snap` → `bit export` | A branch and a PR named after the lane appear in each affected repository within a minute. |

Both paths end with the same PR and the same release.

### Git-first (inside the mirror repository)
```bash
git switch -c add-gift-wrap                 # the branch name becomes the lane name
bit install                                  # once per clone
# edit components under <scope>/<name>/ — follow the repo's AGENTS.md conventions
bit validate                                 # lint + types + tests; never use tsc directly
git add -A && git commit -m "feat(cart): gift wrap option"
git push -u origin add-gift-wrap
gh pr create --fill
```
Commit `.bitmap` together with your source changes. Never edit `.bitmap` by hand.

### Bit-first (any workspace; works for a change across several scopes)
1. Find components with the Bit Cloud MCP: `read_scopes` / `search_components` for the owner, then `read_components` for APIs. Don't guess IDs.
2. Run:
```bash
bit init --default-scope <owner>.<scope>     # or reuse an existing workspace
bit import <owner>.<scope>/<name> [...]      # import every component you will change, plus the chain up to its consumers
bit lane create <lane-name>
# edit
bit validate
bit snap -m "<message>"
bit export
```
3. Watch it arrive: `gh pr list -R <org>/<repo> --head <lane-name>`.

## Read a sync PR
- The PR body lists the mirrored components and the foreign ones (other scopes, "not mirrored").
- The bot's **run summary** comment says what the last run did: `import-lane`, `export-branch`, `merge-diverged`, `noop (converged)`.
- Runs: `gh run list -R <repo> --workflow bit-sync` and `gh run view <id> --log`.
- `Lane sync: <scope>/<lane>` PRs are lanes. `Bit sync: update to latest main scope versions` (branch `bit-sync/main`) brings `main` up to the scope. Merging that one releases nothing.

## Fix a halt (`bit-sync-conflict` label)
The lane and the branch changed the same line. The lane stays paused while the label is on the PR.
```bash
gh pr checkout <pr>
git pull origin main                          # the bot's comment names the contested files
# resolve the files, then:
bit install && bit validate
git commit -am "fix: resolve sync conflict" && git push
gh pr edit <pr> --remove-label bit-sync-conflict
gh workflow run bit-sync -R <repo> -f lane=<lane-name>
```
Never resolve by force-pushing over the bot's commits. Never delete the lane to "start fresh".

## Change several scopes at once
One lane can carry components from many scopes. Each scope's repository gets a PR with **its own slice**. Merge each PR. The lane is archived after the last scope releases. In the meantime each repository consumes the other scopes' lane versions as packages.

## Connect a new scope to a new repository (one-time)
```bash
gh repo create <org>/<repo> --private --clone && cd <repo>
bit init --default-scope <owner>.<scope> --skip-interactive
bit import "<owner>.<scope>/**"
bit ci sync --init                            # writes bit-sync.yml, bit-release.yml and the ci.sync block
# pin "teambit.harmony/bit": { "engine": "<bit --version>" } in workspace.jsonc
printf 'node_modules/\n.bit/\ndist/\n' >> .gitignore
git add -A && git commit -m "bit workspace mirroring <owner>.<scope>" && git push -u origin main
gh secret set BIT_CONFIG_ACCESS_TOKEN -R <org>/<repo>      # a bit.cloud org token with WRITE permission on the scope
gh api -X PUT repos/<org>/<repo>/actions/permissions/workflow \
  -F default_workflow_permissions=write -F can_approve_pull_request_reviews=true
```
Then the human steps, which need an admin:
1. Install the `bit-git-sync` GitHub App on the repository.
2. Add the scope webhook (**Export succeeded** → the relay URL from the App's setup page).

Without them, the hourly schedule still syncs.

**GitHub Enterprise Server:** the same workflows run. You need:
- runners that can reach bit.cloud;
- the actions available, through GitHub Connect or synced copies;
- a bit release that reads `GITHUB_API_URL` and `GITHUB_SERVER_URL` (teambit/bit#10817);
- your own relay with your own App for instant sync. Otherwise the scheduled sync does it.

## Never
- Push to `main`, or merge `bit-sync/main` and lane PRs out of order to "fix" history.
- Run `bit build`, `tsc`, `npm install` or `pnpm install` in a mirror. Use `bit validate` and `bit install`.
- Export from the mirror clone while a lane PR is open for the same change. Pick one path.
- Remove a `bit-sync-conflict` label without resolving the conflict.
