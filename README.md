# Bit ↔ Git sync — the runnable reference

This repository is a **live, working example** of keeping a bit.cloud scope
and a git repository equal in both directions with
[`bit ci sync`](https://github.com/teambit/bit-git-sync). "ACME" plays the
customer: everything here is exactly what you set up once for your own scope.

It mirrors [`acme-modular.store`](https://bit.cloud/acme-modular/store)
(`catalog/product-listing`, `cart/order-summary`). The store components
consume [`acme-modular.platform`](https://bit.cloud/acme-modular/platform)
utilities **by package name** — that is the cross-scope story: one repository
mirrors one scope, and everything else arrives as a dependency.

Proof, in this repository's own history:
[PR&nbsp;#1](https://github.com/teambit/acme-modular-store/pull/1) is a main
export arriving as a sync pull request, and
[PR&nbsp;#2](https://github.com/teambit/acme-modular-store/pull/2) is a lane
(`add-bulk-discount`) arriving as a branch and pull request, whose merge
released `cart/order-summary@0.0.4` back to the scope and closed the lane.

## How it works in one minute

Two directions, triggered in two different ways:

```
Git → Bit   push to a lane branch ──▶ bit-sync run ──▶ snap + export to the lane
            merge the pull request ──▶ bit-release run ──▶ release to the scope
            (GitHub starts these runs itself; nothing outside your repository is involved)

Bit → Git   export on bit.cloud ──▶ scope webhook ──▶ relay ──▶ repository_dispatch ──▶ bit-sync run
            (something on bit.cloud has to wake your repository up; that is the relay's only job)
```

**The workflows do all the work. The relay and the GitHub App only ring the
doorbell.** Three workflow files in your repository run `bit ci sync`,
which creates branches, opens pull requests, snaps, exports and releases.
They authenticate to GitHub with the repository's own automatic
`GITHUB_TOKEN` and to bit.cloud with one secret you add. They never touch the
GitHub App.

The doorbell exists because GitHub only accepts a wake-up call
(`repository_dispatch`) with a GitHub credential, and a bit.cloud scope
webhook cannot carry one. So the webhook calls a small relay that teambit
hosts on bit.cloud, and the relay calls GitHub. To be allowed to call *your*
repository, the relay uses the **bit-git-sync GitHub App**: installing the
App on your repository is the permission grant. You deploy nothing and hold
no keys.

| Piece | Owned by | Runs where | Job |
| --- | --- | --- | --- |
| Three workflow files + the `ci.sync` config | You, in your repository | GitHub Actions runners | Run `bit ci sync`: branches, pull requests, snaps, exports, releases. |
| `BIT_CONFIG_ACCESS_TOKEN` secret | You | Read by the workflows | Lets the runner export to your scope. |
| Scope webhook (`export-success`) | You, on your scope | bit.cloud | Fires after every export. Can only POST to a URL, no auth header. |
| Relay | teambit | bit.cloud hosting | Receives the webhook, sends `repository_dispatch` to your repository. |
| GitHub App `bit-git-sync` | teambit | Nowhere; it is a permission grant | Installing it on your repository lets the relay mint a one-hour token for that repository. |

Without the doorbell, sync still happens: `bit-sync.yml` runs on an hourly
schedule and on a manual **Run workflow** click. The webhook makes Bit → Git
immediate instead of hourly. That is why the setup below is two phases:
phase A builds the machine and is already a working sync; phase B adds the
instant trigger.

## The five flows

| Flow | You do this | The workflows do this |
| --- | --- | --- |
| Lane → branch | Export a lane on bit.cloud. | `bit-sync` creates a branch and opens a pull request. |
| Branch → lane | Push a commit to the lane branch. | `bit-sync` snaps the branch content and exports it to the lane. |
| Merge → release | Merge the pull request. | `bit-release` merges the lane into the main scope and exports new versions. |
| Main → git | Export to the main scope. | `bit-sync` opens a pull request from `bit-sync/main`. |
| Adopt (optional) | Open an ordinary git pull request. | `bit-adopt-pr` turns it into a lane, so the branch→lane flow takes over. |

## Try it on this repository

```sh
mkdir try-sync && cd try-sync
bit init --default-scope acme-modular.store --skip-interactive
bit import acme-modular.store/cart/order-summary
bit lane create my-experiment
# edit cart/order-summary/order-summary.ts
bit snap -m "trying git sync"
bit export
```

Within a minute a branch `my-experiment` and a pull request appear here.
Push a commit to the branch and the lane moves. Merge it and the scope
releases a new version.

---

# Set it up for your own scope

Six steps in two phases. Phase A (steps 1–4) is copy-paste and gives you a
working sync on its own. Phase B (steps 5–6) is one click and one paste, and
makes the Bit → Git direction instant. Each phase ends with a check that
tells you it worked.

### 0. Prerequisites

- A bit.cloud scope with at least one exported component, and admin access
  to its organization (step 4 generates an access token there).
- Webhooks on bit.cloud are available on Team plans and above (check under
  the organization's **Settings → Billing**). Phase A works on any plan;
  only step 6 needs the plan.
- A GitHub repository you administer. Empty is fine. Its default branch is
  what the workflows call `main`; if yours is named differently, change the
  `branches: [main]` line in `bit-release.yml`. Step 5 installs a GitHub App
  on it; in some organizations that click becomes an install request that an
  organization owner approves.
- Bit **2.2.16 or later** on your machine (`npx @teambit/bvm install`), and
  `bit login` done. Note what `bit --version` prints; step 2 pins it.

## Phase A — the workers (a working sync, hourly)

### 1. Make the repository a Bit workspace of your scope

The workflows run `bit ci sync` inside the repository, so the repository
must be a Bit workspace whose default scope is the scope you mirror. In a
clone of your repository:

```sh
bit init --default-scope <owner>.<scope> --skip-interactive
bit import "<owner>.<scope>/**"          # every component on the scope's main
printf 'node_modules/\n' >> .gitignore   # bit init writes no .gitignore
git add -A && git commit -m "bit workspace mirroring <owner>.<scope>" && git push
```

`bit import` writes each component's source under the folder that
`defaultDirectory` in `workspace.jsonc` names (default `{scope}/{name}`) and
pins the current versions in `.bitmap`. The commit holds `.bitmap`,
`workspace.jsonc`, the component folders, `package.json`, a large
`pnpm-lock.yaml`, `tsconfig.json`, and a few editor helpers that `bit init`
also writes (`.mcp.json`, `.oxlintrc.json`, `.prettierrc.cjs`). Commit all of
it. The import is what makes the mirror start converged; if you skip it, the
first run still works and opens one catch-up pull request that adds every
component.

### 2. Add the workflows and the sync config

Copy `bit-sync.yml` and `bit-release.yml` from
[`.github/workflows/`](.github/workflows/) into your repository unchanged.
The third file there, `bit-adopt-pr.yml`, is optional: add it only if your
developers open ordinary pull requests that should become lanes. If you add
it, expect a `bit-adopt-pr` run on every sync pull request too; its guard
skips the bot's own pull requests, and GitHub shows such a run as *action
required* or as a failed run with no jobs. Both are harmless; the `bit-sync`
and `bit-release` runs are the ones to read.

Then add the last two keys below to your `workspace.jsonc`. Order does not
matter; mind the comma between keys.

```jsonc
{
  "$schema": "https://static.bit.dev/teambit/schemas/schema.json",
  "teambit.workspace/workspace": {
    /* written by bit init, leave as is */
  },
  /* ...the other keys bit init wrote (generator, dependency-resolver,
     workspace-config-files) stay as they are... */
  "teambit.harmony/bit": {
    "engine": "2.2.18"
  },
  "teambit.git/ci": {
    "sync": {
      "lanes": ["*"],
      "mainSync": "pr",
      "onConflict": "halt"
    }
  }
}
```

`engine` is the Bit version the runner installs. Set it to what
`bit --version` prints on your machine (2.2.16 or later) so the runner and
your workspace agree. Pin a concrete version — the runner compares it as a
string. This repository pins `2.2.18`.

(You do not need to run it, but for reference: `bit ci sync --init` scaffolds `bit-sync.yml`, `bit-release.yml` and the config block; `bit-adopt-pr.yml` is the optional third file. The checklist it prints describes a direct webhook with a personal GitHub token, which also works but is not what this guide uses.)

The workflows reference the action as `teambit/bit-git-sync@v1`. The action
is a thin router: it reads the GitHub event and runs one `bit ci` command.
The code that does the work is bit itself, at the version your `engine` line
pins, so `v1` is the only moving part and it moves rarely.

Commit and push. Nothing runs yet: `bit-sync` ignores pushes to `main` on
purpose (those are its own output). The first run comes from the check at the
end of this phase. Bit rewrites `workspace.jsonc` in its own format the first
time it touches it, so expect one small formatting change in a later bot
commit.

### 3. Allow the workflows to open pull requests

**Settings → Actions → General → Workflow permissions**: select **Read and
write permissions**, and tick **Allow GitHub Actions to create and approve
pull requests**. The workflows push branches and open pull requests with
the repository's built-in `GITHUB_TOKEN`. The first setting lets that token
push; the second lets it open pull requests. Without them, every run fails
at its first write.

### 4. Add the bit.cloud token secret

1. On bit.cloud, open your **organization → Settings → Access tokens →
   create new**. Name it after the repository, set **Permission** to
   **Write**, set **Expiration** to Never (or a date you will remember: once
   it lapses, releases fail with `scope <id> not found`), and under
   **Scopes** select the scope this repository mirrors. Click **Generate**
   and copy the token; it is shown once.
2. In GitHub, **Settings → Secrets and variables → Actions → New repository
   secret**, name it `BIT_CONFIG_ACCESS_TOKEN`, paste the token.

**Permission must be Write.** The form defaults to Read, and a Read token
fails exactly one step: syncs pass, and the release step fails with
`scope <id> not found` right after `Exporting N components`. That message
means "export refused", not "missing scope". A personal token
(`bit config get user.token`, last line) also works, but it is tied to a
person.

Optional second secret `BIT_SYNC_GH_TOKEN` (a GitHub token with `repo`
scope): pushes made with the default `GITHUB_TOKEN` start no other
workflows, so sync pull requests get no CI checks. With this secret they do.

### Check phase A

Export a lane from a **separate** workspace, not from the repository clone
(the clone mirrors `main` and the workflows own it). In any directory
outside the clone:

```sh
mkdir try-git-sync && cd try-git-sync
bit init --default-scope <owner>.<scope> --skip-interactive
bit import <owner>.<scope>/<component>      # the id as `bit list` prints it, e.g. acme-modular.store/cart/order-summary
bit lane create try-git-sync
# edit a file of that component
bit snap -m "phase A check"
bit export
```

Then **Actions → bit-sync → Run workflow** (leave the lane input empty). The
run is listed under branch `main`; that is normal, the reconcile runs from
`main` and writes to the other branches. Its log shows a warning that an
uncommitted change to `workspace.jsonc` will be discarded; that is the init
step normalizing the file, and it is expected. The step log also opens with
the command's full help text before the real output, and the run summary
carries a Node.js 20 deprecation notice (see Troubleshooting); both are
normal too.
About a minute later a branch `try-git-sync` and a pull request titled
`Lane sync: <owner>.<scope>/try-git-sync`, by `github-actions[bot]`, exist.

Merge the pull request with the **Create a merge commit** button (squash and
rebase are untested here). About a minute later, under **Actions →
bit-release**, the run has done three things: it exported a new version of
the changed component to your scope, it archived the lane, and it pushed one
commit straight to `main` (`chore: update .bitmap and lockfiles as needed
[skip ci]`, author `Bit CI`) that records the released version and carries
the `workspace.jsonc` reformat mentioned in step 2. The merged branch is
left in place; delete it if you like. Verify from the repository clone:

```sh
git pull
bit import                               # fetch the version the bot pinned in .bitmap
bit log <owner>.<scope>/<component>      # the new version, by bit-sync[bot]
bit lane list --remote <owner>.<scope>   # try-git-sync is gone
```

Phase A is complete. From here on the hourly schedule does what you just did
by hand.

## Phase B — the doorbell (Bit → Git in seconds)

### 5. Install the GitHub App

Install [**bit-git-sync**](https://github.com/apps/bit-git-sync) on your
repository: **Only select repositories**, pick the repository from step 1.
Contents read/write is all it asks; that is the minimum GitHub requires for
`repository_dispatch`. You are granting the relay permission to wake this
one repository up. The App is owned by teambit, there is no personal token,
and nothing expires.

When the install finishes, GitHub sends you to the relay's **setup page**,
which shows the ready-made webhook URL for every repository you installed
on, per-repository token included. Copy the URL for your repository. Lost it?
Visit [`/setup`](https://webhook-relay-gggmal.r2.composed.app/setup)
anytime: a quick GitHub sign-in shows your URLs again. The page stores
nothing; each token works for its one repository only. The token lets its
holder do exactly one thing, start a reconcile run for that repository, and
a reconcile is idempotent. Keep it out of public places anyway.

### 6. Point your scope's webhook at the relay

On bit.cloud, open your **scope → Settings → Webhooks** (the URL is
`bit.cloud/<org>/<scope>/~settings/webhooks`) and click **Create webhook**.
Webhooks are available on Team plans and above; below that, the page shows
an Upgrade button instead.

Your URL from the setup page looks like this:

```
https://webhook-relay-gggmal.r2.composed.app/dispatch/<github-owner>/<repo>?token=<repository token>
```

Fill the form like this:

| Field | Value |
| --- | --- |
| URL | That URL. The form only accepts `https`, which it is. |
| Description | Anything, or empty. |
| Expiration | **Never** (the default). |
| Event | **Export succeeded**. It is the default on a scope's page; on the organization's page the default is Job completed, so change it. |
| Advanced event filters | Leave closed. |
| Templates | **Custom template** (the default). Not Discord or Slack. |
| Headers | Leave empty. |
| Payload | Leave the prefilled JSON exactly as it is. It lists `owner`, `componentIds`, `username`, `userId` and `laneId`, which is precisely what the action reads. |

Click **Create**.

A scope webhook fires only for exports to that scope, which is exactly
what one repository mirrors. The organization also has a Webhooks page; a
webhook there fires for every scope in the organization. That works too, since
the action skips events whose components are not on your scope, but it makes
the Actions tab noisier. If you mirror several scopes, create one scope
webhook per repository, each with that repository's URL.

The relay turns each export event into the `repository_dispatch` that starts
`bit-sync`, using the App installation on your repository. It accepts the
form's default payload as-is, and also the raw event a webhook created through
the API sends; either way it forwards only the fields the action reads (owner,
component ids, username, lane id). If the relay is ever unreachable, bit.cloud logs the failed delivery
and the hourly run picks the export up; nothing is lost. The relay itself is
an open Bit component,
[`teambit.git/apps/webhook-relay`](https://bit.cloud/teambit/git/apps/webhook-relay);
you do not need to host it, but you can fork it and run your own with your
own App and secret.

### Check phase B

Export something without touching GitHub. The phase A lane was archived by
the release, so make a new one in the `try-git-sync` workspace (it is still
checked out on the old lane locally; `bit lane create` notes that the new
lane is based on it, which is fine):

```sh
bit lane create phase-b-check
# edit the component file again
bit snap -m "phase B check"
bit export
```

Within a minute a branch `phase-b-check` and its pull request appear, with
nobody clicking Run workflow. Then read the webhook's **delivery log** on
bit.cloud (open the webhook on the Webhooks page):

| Delivery status | Meaning |
| --- | --- |
| `202` with `{"dispatched":"<owner>/<repo>"}` | The loop is closed. A `bit-sync` run starts within seconds. |
| `401` | The token in the URL is wrong. Copy it again from the setup page. |
| `502` naming what GitHub refused | Usually: the App is not installed on that repository (step 5). |
| No delivery at all | Wrong event (it must be Export succeeded / `export-success`), the webhook expired, or the organization's plan has no webhooks. |

The `bit-sync` run this triggers is the same reconcile as the hourly one, so
nothing else changes. You are done.

---

## Configuration reference

The `teambit.git/ci.sync` block in `workspace.jsonc`:

| Key | What it decides | Here |
| --- | --- | --- |
| `lanes` | Which lanes get a branch. | `["*"]` — every lane |
| `mainSync` | How main drift reaches git. | `"pr"` — never a direct push |
| `onConflict` | One contested line. | `"halt"` — stop and label the PR |
| `branches` | Branch name for one named lane. | unset |
| `branchPrefix` | Text before each branch name. | unset |
| `mainSyncBranch` | Name of the main-sync branch. | unset (`bit-sync/main`) |
| `autoMergeMainSyncPr` | Auto-merge main-sync PRs. | unset |

The hourly `schedule` trigger in `bit-sync.yml` is the baseline: it is the
whole Bit → Git direction if you stop after phase A, it repairs a lost
webhook delivery once you have the webhook, and it is the only way to notice
a deleted lane (bit.cloud has no lane-removed event). **Actions → bit-sync →
Run workflow** runs the same reconcile on demand.

## Cross-scope lanes

A lane can carry components from many scopes; a repository mirrors **one**
scope and reconciles only that slice. Foreign components are listed in the
pull request as "not mirrored" and consumed as package dependencies at their
lane versions. Each scope's repository releases its own slice; the lane
stays open until the last scope releases, and that release archives it
(bit ≥ 2.2.16). A lane with no own-scope components is skipped — that is
correct behavior, not an error.

## Troubleshooting

| Symptom | Cause | Repair |
| --- | --- | --- |
| No run after an export. | The webhook delivery failed (or you have no webhook yet, in which case the hourly run picks it up). | Read the delivery log on the scope. `401`: wrong relay token. `502`: the App is not installed on the repository. No delivery at all: wrong event name — it is `export-success`. |
| A run starts, but no pull request. | The repository forbids the write. | Turn on **Allow GitHub Actions to create and approve pull requests** (step 3). |
| The run halts and the PR gets the `bit-sync-conflict` label. | Git and the lane changed the same line. | Resolve on the branch, push, remove the label. The lane stays paused while the label is present. |
| The run halts with `scope <your-scope> not found` right after `Exporting N components`. | The export was refused: the token behind `BIT_CONFIG_ACCESS_TOKEN` has Read permission, or does not cover this scope. | Generate a Write token that includes the scope (step 4), replace the secret, remove the leftover label, re-run. |
| A lane export runs the *main* sync instead of the lane. | The dispatch carried no `laneId`. | Point the webhook at the relay (step 6) — it extracts the lane from the raw event. A hand-rolled dispatch must send `client_payload.laneId` as `"scope-id/lane-name"`. |
| The run fails with `OutsideWorkspaceError` or "no workspace found". | The repository is not a Bit workspace. | Do step 1: `bit init --default-scope <owner>.<scope>` and commit `workspace.jsonc` and `.bitmap`. |
| The release run fails when pushing to `main`. | Branch protection blocks the bot's `.bitmap` commit. | Add the GitHub Actions bot to the rule's bypass list, or allow it to push. |
| Every run is annotated with a Node.js 20 deprecation notice. | Actions used by the workflow (`actions/setup-node@v4` inside `bit-tasks/init`, and `teambit/bit-git-sync@v1`) still declare Node 20. | Harmless. It disappears when those actions update. |
| The run halts with a shallow-clone message. | `actions/checkout` fetched one commit. | Keep `fetch-depth: 0` in the checkout step. |
| A `bit-adopt-pr` run on a bot pull request shows as **action required**, "required approval… expired", or **failed with no jobs and no log**. | GitHub does not run workflows for pull requests the bot opened with its own token; it records the run as needing approval or as failed before any job starts. The job never ran and never needed to. | Ignore it, approve it (the guard then skips the job), or leave `bit-adopt-pr.yml` out (step 2). |
| A Ripple job for the last lane snap fails right after a merge. | The release archived the lane while that build was still running. | Expected timing artifact. The release job builds main; that one matters. |

## Files

| Path | Purpose |
| --- | --- |
| `workspace.jsonc` | Engine pin and the sync configuration. |
| `components/` | The mirrored components of `acme-modular.store`. Your repository uses whatever `defaultDirectory` names, `{scope}/{name}` by default. |
| `.github/workflows/bit-sync.yml` | Lane→branch, branch→lane, main→git. |
| `.github/workflows/bit-release.yml` | Merge→release. |
| `.github/workflows/bit-adopt-pr.yml` | Optional: adopt a git-born pull request into a lane. |

## License

Apache-2.0. See [LICENSE](./LICENSE).
