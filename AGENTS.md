# Bit Workspace — AI Agent Instructions (Git-Integrated)

This file teaches AI agents how to work correctly inside a **Git-integrated Bit workspace**. Read it fully before touching any code.

<!-- bit-ci-sync:start (written by `bit ci sync --init`; a re-run leaves this block as it is) -->

## Bit ↔ Git sync: this repository mirrors `acme-modular.store`

`bit ci sync` keeps this repository and the bit.cloud scope `acme-modular.store` equal in both directions. **The rules in this section override the generic Bit guidance after it.**

### The model

1. **One repository mirrors one scope.** Components from other scopes arrive as package dependencies, never as source.
2. **`main` equals the scope's main.** The workflows own it. Never push to `main` by hand.
3. **Each lane is a branch with the same name, plus a pull request.** The sync keeps them equal in both directions. A lane name has no `/`, so the sync ignores a branch such as `feature/x`.
4. **Merging the pull request is the release.** `bit-release` merges the lane into the scope, exports new versions, archives the lane and commits the new `.bitmap` to `main`.
5. **The workflows do the work.** You change code, and then you either push a branch or export a lane.

### Rules that override generic Bit guidance

- **Review happens on the GitHub pull request.** Do **not** submit a bit.cloud change request, even if other instructions say "always submit a change request". The sync opens the PR. Merging the PR is the release. A second review surface splits the reviewers and races the release.
- **One change, one scope.** Keep a lane inside the scope it is exported to. If the change also needs another scope (for example, a caller must pass a new argument), stop. Make the change backward compatible in this scope, and tell the user which follow-up change the other scope's repository needs. Cross-scope lanes are a preview (see below).
- **Never push to `main`.** The workflows own it.

### Make a change: pick a path

| You are…                                                        | Path          | What you do                                                           | What appears                                                                                                                               |
| --------------------------------------------------------------- | ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| In this repository (Copilot, an IDE, a plain git user)          | **Git-first** | branch → edit → `bit validate` → commit → push → open a PR            | With the optional `bit-adopt-pr` workflow, the PR becomes a lane, and every push snaps onto it. Without it, the sync ignores the branch.   |
| In any other Bit workspace (Claude Code with the Bit Cloud MCP) | **Bit-first** | `bit lane create` → edit → `bit validate` → `bit snap` → `bit export` | A branch and a PR named after the lane appear in this repository: within a minute with the scope webhook, else at the next scheduled sync. |

Both paths end with the same PR and the same release.

#### Git-first (in this repository)

This path needs the `bit-adopt-pr` workflow in `.github/workflows/`. `bit ci sync --init` does not write it. Without it, a branch that has no lane stays out of the sync: use the Bit-first path.

```bash
git switch -c add-gift-wrap                 # the branch name becomes the lane name; no "/"
bit install                                  # once per clone
# edit the components; .bitmap says where each one lives
bit validate                                 # lint + types + tests; never use tsc directly
git add -A && git commit -m "<message>"
git push -u origin add-gift-wrap
gh pr create --fill
```

Commit `.bitmap` together with your source changes. Never edit `.bitmap` by hand. After the PR merges, run `git switch main && git pull` before you start the next change.

#### Bit-first (from another Bit workspace)

1. Find components with the Bit Cloud MCP: `read_scope` / `search_components` for the owner, `read_components` for APIs, and `read_file` for source. Don't guess IDs. Also check who calls the component, so you know whether your change stays inside one scope.
2. Run:

```bash
bit init --default-scope acme-modular.store           # or reuse an existing workspace
bit import acme-modular.store/<name> [...]            # every component you will change, plus the chain up to its consumers
bit lane create <lane-name>
# edit
bit validate
bit snap -m "<message>"
bit export
```

3. Watch it arrive: `gh pr list -R teambit/acme-modular-store --head <lane-name>`. Then tell the user the PR link. Don't submit a bit.cloud change request.

Headless or CI agents can call the Bit Cloud MCP with a bit.cloud token, without the OAuth step:

```json
{
  "mcpServers": {
    "bit-cloud": {
      "type": "http",
      "url": "https://mcp.bit.cloud/mcp",
      "headers": { "Authorization": "Bearer ${BIT_CLOUD_TOKEN}" }
    }
  }
}
```

### Read a sync PR

- The PR body lists the mirrored components and the foreign ones (other scopes, "not mirrored").
- The bot's **run summary** comment says what the last run did: `import-lane`, `export-branch`, `merge-diverged`, `noop (converged)`.
- Runs: `gh run list --workflow bit-sync` and `gh run view <id> --log`.
- `Lane sync: <scope>/<lane>` PRs are lanes. `Bit sync: update to latest main scope versions` (branch `bit-sync/main`) brings `main` up to the scope. Merging that one releases nothing.

### Fix a halt (`bit-sync-conflict` label)

The lane and the branch changed the same lines. The lane stays paused while the label is on the PR. The bot's comment on the PR names the components and gives these steps:

```bash
git fetch origin && git checkout '<branch>'
git merge --ff-only 'origin/<branch>'         # stops if your local copy has commits that are not on origin: keep them, or reset to origin
bit install
bit lane import '<host-scope>/<lane>'         # brings the lane's side in; conflicts appear as conflict markers
# resolve every conflicted file. When the intent is unclear, ask the user which side wins. Don't guess.
bit validate
git add -A && git commit -m "fix: resolve sync conflict"
git push origin '<branch>'
gh pr edit <pr> --remove-label bit-sync-conflict
gh workflow run bit-sync -f lane=<host-scope>/<lane>
```

The next run reports `merge-diverged` or `export-branch`, then `noop (converged)`. Never resolve by force-pushing over the bot's commits. Never delete the lane to "start fresh".

### Change several scopes at once (preview)

Prefer one lane per scope: one change, one repository, one PR.

A lane _can_ carry components from several scopes. Each scope's repository then mirrors only its own slice, consumes the other scopes' lane versions as packages, and releases its slice when its PR merges. Until automatic fan-out ships, only the repository of the lane's host scope hears about the lane. Start the others by hand:

```bash
gh workflow run bit-sync -R <org>/<repo> -f lane=<host-scope>/<lane-name>
```

### Connect another scope to its own repository

```bash
gh repo create <org>/<repo> --private --clone && cd <repo>
bit init --default-scope <owner>.<scope> --skip-interactive
bit import "<owner>.<scope>/**"
bit ci sync --init                            # writes the workflows, the sync config and this AGENTS.md section
```

Then follow the steps `bit ci sync --init` prints. Some of them need a repository or organization admin. Guide: https://bit.cloud/teambit/git/guides/connect-scope-to-repository

### Never

- Push to `main`, or merge `bit-sync/main` and lane PRs out of order to "fix" history.
- Run `bit build`, `tsc`, `npm install` or `pnpm install` here. Use `bit validate` and `bit install`.
- Export a lane from another workspace while a Git-first PR is open for the same change. Pick one path.
- Remove a `bit-sync-conflict` label without resolving the conflict.

<!-- bit-ci-sync:end -->

---

## What is Bit?

Bit is a composable development platform where every piece of functionality is an independent, versioned, composed **component**. Components live in **scopes** (remote registries of business domains) and are managed through the `bit` CLI.

In this workspace, **Git is the source of truth** for source code and collaboration. Bit's component versioning (`bit snap`, `bit tag`, `bit export`) runs in CI/CD — not locally.

### Component Types

Not all components are UI widgets. In Bit, a "component" can be any of these:

| Type                 | What it is                                                                                                                                                                                          | Example                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Entity**           | Plain domain object — defines the shape and behavior of a domain model. No React, no side effects.                                                                                                  | `entities/user`, `entities/order`    |
| **Hook**             | Encapsulates data fetching, mutations, or stateful logic for a domain. Consumed by UI components and pages.                                                                                         | `hooks/use-user`, `hooks/use-orders` |
| **UI component**     | Reusable visual element, typically stateless or lightly stateful.                                                                                                                                   | `ui/button`, `ui/card`               |
| **Feature / Aspect** | Self-contained domain slice — owns its entities, hooks, pages, and backend logic.                                                                                                                   | `customers`, `billing`               |
| **App**              | A standard deployable application — a React frontend, Node.js server, etc.                                                                                                                          | `my-react-app`, `my-node-server`     |

Understanding which type you're working with matters because it shapes the dependency chain. For an app, the blueprint looks like:

```
App  →  Page  →  Hook (optional)  →  Entity (optional)
             ↘  UI component
```

Entities and hooks sit at the bottom of the chain — they have no dependents of their own, so changes to them propagate upward. Everything above that consumes them must be local for your changes to take effect.

The workspace is defined by `workspace.jsonc`. The owner and default scope are set there — always read them first.

---

## Project Orientation

```bash
cat workspace.jsonc                  # find owner, scope, envs
bit list                             # see what's already local
bit status                           # check for pending changes
bit templates                        # see what generators are available
```

---

## Scopes & the Bit Cloud MCP

A **scope** is a remote registry for one business domain. A component ID is `<owner>.<scope>/<name>`, optionally with a namespace before the name: `<owner>.<scope>/<namespace>/<name>`. The namespace is optional — don't add one to an ID that doesn't have it.

Anything remote — scopes, components, apps — goes through the **Bit Cloud MCP** (`https://mcp.bit.cloud/mcp`), not the CLI. The server advertises its own tools; two rules about _ordering_ them:

- Start with `orientation` when you don't know the account's topology, then `read_scope` to go deep on one domain. Reach for `search_components` only when you don't know which scope owns something.
- Always pass the `owner` from `workspace.jsonc`.

**If the MCP isn't connected, don't stop** — the CLI can read remotes too, just less efficiently. `bit list <owner>.<scope>` lists a remote scope's components, `bit show <owner>.<scope>/<name> --remote` inspects one, and `bit search <query>` searches by keyword across both the local workspace and Bit Cloud. Say that the MCP is unavailable and carry on.

---

## Understanding Component APIs

When you need to understand how to **use** a component (its props, function signatures, return types), use structured API data instead of reading source files:

- **Remote components**: Use `read_components` (Bit Cloud MCP) — returns structured type signatures, dependencies, and metadata in a single call. API references are included by default. As a CLI fallback, run `bit show <owner>.<scope>/<name> --remote`.
- **Local workspace components**: Run `bit schema <component-id>` — displays exported types, function signatures, and class methods.

These structured APIs are significantly more compact than reading source files. For understanding implementation details (how something works internally), use `read-file` or read the source directly.

---

## Common Commands

```bash
bit status                           # workspace health + pending changes
bit start                            # dev server (default port 3000)
bit run [app_name]                   # run the app
bit list                             # all locally tracked components (do not pass args)
bit search <query>                   # search components locally and on remote scopes (CLI fallback — prefer MCP for remote)
bit show <owner>.<scope>/<name>      # inspect a specific component
bit schema <component-id>            # structured API of a local component
bit import "<owner>.<scope>/**"      # import all components from a remote scope
bit templates                        # list available generator templates
bit create <template> <name>         # scaffold a new component
bit install [pkg1] [pkg2] ...        # install package dependencies
bit compile                          # rebuild dist/ — automatic while bit watch/start runs, manual otherwise
bit validate                         # lint + type-check + tests (fast build) — preferred check
bit test                             # run tests only
bit lint                             # run linter only
bit check-types --strict             # TypeScript type checker only (without --strict it exits 0 even on errors)
bit ripple list --lane <scope>/<lane> # find the Ripple CI jobs for a lane (the lane name is the branch name)
bit ripple log <job-id>              # check a Ripple CI build's status
bit ripple errors <job-id>           # show build errors for a Ripple CI job
bit ripple retry <job-id>            # retry a failed Ripple CI job
```

> **Never run `bit build`** unless absolutely necessary. Always use `bit validate` instead — it's faster and sufficient.
>
> **Always use `bit install`** to install packages. Never use `npm install`, `yarn`, or `pnpm` directly — unless the workspace is configured with `externalPackageManager` mode in `workspace.jsonc`, in which case use your configured package manager.
>
> **Use Bit for type checking and testing.** Never use `tsc` or `npx tsc` directly. Use `bit validate` for a full check, or scope to specific components:
>
> ```bash
> bit check-types --strict "[component-id1, component-id2]"
> bit test "[component-id1, component-id2]"
> bit validate "[component-id1, component-id2]"
> ```

---

## Discovering Apps

```bash
bit app list
```

Use the Bit Cloud MCP to list remote apps in a given scope. Use `bit import` to fetch remote apps and run them locally.

---

## The Golden Rule: One Component at a Time

Never scaffold multiple components upfront. Bit development is an **iterative loop**:

```
render → identify gap → create ONE component → render again
```

### Step-by-step

1. **Look before you create.** Search the workspace and the Bit Cloud MCP first:

   ```bash
   bit list                             # what's already local
   bit show <owner>.<scope>/<name>      # inspect a candidate
   ```

   And via the MCP: `orientation` for the account's topology, `read_scope` for one domain's components, or `search_components` for keyword discovery. A component may already exist locally or remotely. Don't duplicate.

2. **Identify the entry point.** Depending on what you're building, the entry point could be a platform, app, or feature/aspect. Use the MCP (`read_scope` / `read_components`) to list what exists in the scope before creating anything new.

3. **Create one component.** Scaffold it, wire it in, verify it compiles and renders.

4. **Validate before moving on:**

   ```bash
   bit validate
   ```

5. **Identify the next gap.** Only then decide what the next component should be.

6. **Repeat.** Never pre-plan a list of components and create them all at once.

#### Example

Create a UI component:

```bash
bit create react pages/login --scope acme.people
```

Create a data entity:

```bash
bit create entity entities/user --scope acme.people
```

---

## Importing Components for Modification

Bit resolves **local workspace components** over their installed package versions. If you want to modify a component, it must be imported into the workspace — otherwise the app will use the published version and ignore your changes.

### The full dependency chain must be local

When modifying any component, import every component in the chain from the top down to your target:

```
Platform  →  App  →  Feature/Aspect  →  Page  →  UI component
```

You don't always need the full chain — only the layers in the dependency path of your change. But every layer between the entry point and your target must be local. If any layer in between is still installed as a package (not local), the app will ignore your changes to the layers below it.

**Examples:**

- Changing a UI component used by a feature page → import the feature, the page, and the UI component.
- Changing a feature's backend logic → import the platform, the app, and the feature/aspect.
- Changing the platform itself → import the platform only (everything downstream will pick it up once local).

### Finding the component ID

```bash
cat node_modules/@<org>/<package-name>/package.json | grep -A3 '"componentId"'
# "scope": "myorg.myfeature"
# "name":  "pages/my-page"
# → component ID: myorg.myfeature/pages/my-page
```

### Importing

```bash
bit import <scope>/<name>
# e.g.
bit import myorg.myfeature/pages/my-page myorg.myfeature/pages/lobby-page
```

#### Importing whole scopes

```bash
bit import "<owner>.<scope>/**"
```

---

## Component Structure

Each component directory follows this convention:

| File                     | Purpose                              |
| ------------------------ | ------------------------------------ |
| `<name>.tsx`             | Main implementation                  |
| `index.ts`               | Public barrel export                 |
| `<name>.spec.tsx`        | Tests                                |
| `<name>.composition.tsx` | Live previews (shown in `bit start`) |
| `<name>.docs.mdx`        | Documentation                        |
| `<name>.mock.ts`         | Mock data / fixtures                 |
| `*-type.ts`              | Standalone type definitions          |

> Add JSDocs to exported APIs, include two to three usage examples in the `.docs.mdx`, and two to three compositions for the live preview.

JSDoc on exported members isn't optional polish — it's what renders as the component's API reference on Bit Cloud, and it's the first thing another agent reads when deciding whether to reuse the component. For the same reason, avoid `any` in a public signature: it erases the API for every consumer, and `bit check-types` gates publishing.

---

## Import Path Convention

Components import each other using Bit's package notation:

```ts
import { Something } from '@<org>/<scope>.<namespace>.<name>';
```

Never use relative paths across component boundaries. Always use the package notation.

---

## Environment Setup

Generator environments (React, Vue, Node, Angular, etc.) are configured in `workspace.jsonc`. Some may be commented out. Enable the relevant environment before creating components for a specific framework.

---

## Key Files

| File              | Purpose                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `workspace.jsonc` | Workspace config — scopes, envs, component patterns                 |
| `.bitmap`         | Auto-generated — tracks component locations. **Must be committed.** |
| `package.json`    | Usually `"type": "module"` for ES Modules                           |

---

## Troubleshooting

### The app doesn't reflect your change

**Most likely the `dist/` is stale.** Consumers import a component through `node_modules/<package>/dist/`, not its source, and `bit validate` type-checks _source_ — so it passes green while the running app still serves the old build. `bit watch` / `bit start` normally recompiles on save, but if either isn't running, or the change landed while it was down, the old `dist/` sits there.

```bash
bit compile             # rebuild dist/
# then restart the app
```

Do this **before** re-reading and re-editing files. If the source is already correct, editing it again cannot help — a passing `bit validate` plus wrong runtime behavior is the signature of this bug, not of a code error.

If compiling and restarting doesn't help, run `bit install`, then restart again.

---

## Common Mistakes to Avoid

| Mistake                                                                         | Correct approach                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Creating multiple components upfront                                            | Create one, validate, then decide what's next                                                                             |
| Modifying an installed (node_modules) component                                 | Import it with `bit import` first                                                                                         |
| Importing only the target component but not its dependents                      | Import the full chain top-down: platform → app → feature → page → component                                               |
| Treating all components as UI widgets                                           | Understand the type first — platform, app, feature/aspect, hook, entity, or UI component — it determines the chain        |
| Running `bit build`                                                             | Use `bit validate` instead — faster and sufficient                                                                        |
| Pushing a branch that fails `bit validate`                                      | Fix it first — CI's build fails for the same reason                                                                       |
| Guessing a component ID                                                         | Check `package.json` under `componentId` or use `bit list`                                                                |
| Creating a component that already exists                                        | Always run `bit list` and check the Bit Cloud MCP (`orientation` / `search_components`) first                             |
| Using `npm install`, `yarn`, or `pnpm`                                          | Use `bit install` — unless the workspace uses `externalPackageManager` mode                                               |
| Using `tsc` or `npx tsc` to check types                                         | Use `bit validate`, `bit check-types`, or `bit test`                                                                      |
