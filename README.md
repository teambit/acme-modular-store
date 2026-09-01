# Bit ↔ Git sync — the runnable reference

This repository is a **live, working example** of keeping a bit.cloud scope
and a git repository equal in both directions with
[`bit ci sync`](https://github.com/teambit/bit-git-sync). "ACME" plays the
customer: everything here is exactly what you set up once for your own scope.

```
bit.cloud scope ──export──▶ webhook ──▶ relay ──▶ repository_dispatch ──▶ bit-sync run
   ▲                                                                        │
   │                                                          branch + pull request
   └────── bit-release run ◀── merge the pull request ◀────────────────────┘
```

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
bit init --default-scope acme-modular.store
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

Five steps. Steps 1–3 are copy-paste; steps 4–5 are one click each.

### 0. Prerequisites

- A bit.cloud scope with at least one exported component, and a GitHub
  repository you own.
- Bit **2.2.16 or later** (`npx @teambit/bvm install`). This repository pins
  `2.2.18` in `workspace.jsonc` under `teambit.harmony/bit.engine`; the
  runner installs exactly that version. Pin a concrete version — the runner
  compares it as a string, and only nightlies carry `bit ci sync`.

### 1. Add the workflows and the sync config

Copy the three files under [`.github/workflows/`](.github/workflows/) into
your repository unchanged, and add this block to your `workspace.jsonc`:

```jsonc
"teambit.harmony/bit": { "engine": "2.2.18" },
"teambit.git/ci": {
  "sync": { "lanes": ["*"], "mainSync": "pr", "onConflict": "halt" }
}
```

(`bit ci sync --init` scaffolds `bit-sync.yml`, `bit-release.yml` and the
config block for you; `bit-adopt-pr.yml` is the optional third file.)

The workflows pin the action to a commit SHA on purpose: the job holds
`contents: write` and `pull-requests: write`, and a moved tag would hand that
permission to new code. Update the SHA deliberately.

### 2. Allow the workflows to open pull requests

**Settings → Actions → General → Workflow permissions** → turn on
**Allow GitHub Actions to create and approve pull requests**. Without it,
every run fails at the first pull request.

### 3. Add the bit.cloud token secret

1. Get a token from an account that can **export** to your scope:
   `bit login --machine-name ci`.
2. **Settings → Secrets and variables → Actions → New repository secret**,
   name it `BIT_CONFIG_ACCESS_TOKEN`.

Use a dedicated service-account user that is a member of the scope. A
*scope token* (scope settings → tokens) is **read-only**: syncs will pass and
the release step will fail with `scope <id> not found` — that message means
"export refused", not "missing scope".

Optional second secret `BIT_SYNC_GH_TOKEN` (a GitHub token with `repo`
scope): pushes made with the default `GITHUB_TOKEN` start no other
workflows, so sync pull requests get no CI checks. With this secret they do.

### 4. Install the GitHub App — it hands you the webhook URL

Install [**bit-git-sync**](https://github.com/apps/bit-git-sync) on your
repository — **Only select repositories**, Contents read/write is all it
asks. The App is how bit.cloud's webhook relay authenticates to GitHub:
org-owned, no personal token, nothing that expires.

After the install, GitHub sends you to the relay's **setup page**, which
shows the ready-made webhook URL for every repository you installed on —
per-repository token included. Lost it? Visit
[`/setup`](https://webhook-relay-gggmal.r2.composed.app/setup) anytime: a
quick GitHub sign-in shows your URLs again. Each token works for its one
repository only.

### 5. Point your scope's webhook at the relay

On your scope, create a webhook for the **export-success** event and paste
the URL from the setup page:

```
https://webhook-relay-gggmal.r2.composed.app/dispatch/<github-owner>/<repo>?token=<repository token>
```

The relay turns each export event into the `repository_dispatch` that starts
`bit-sync`, using the App installation on your repository. It accepts the
raw scope-webhook payload as-is — no payload template is needed — and it
forwards only the fields the action reads (owner, component ids, username,
lane id). The relay itself is an open Bit component,
[`teambit.git/apps/webhook-relay`](https://bit.cloud/teambit/git/apps/webhook-relay),
so you can also fork it and host your own with your own App and secret.

Then **export something and read the webhook delivery log** on bit.cloud:
`202` with `{"dispatched":"<owner>/<repo>"}` means the loop is closed. A
`401` means the token is wrong; a `502` names what GitHub refused (usually:
the App is not installed on that repository).

Finally, commit your repository's `.bitmap` state after a first
`bit tag -m "first version" && bit export`, so the mirror starts converged —
otherwise the first run opens a harmless but noisy catch-up pull request.

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

The hourly `schedule` trigger in `bit-sync.yml` is the safety net: it repairs
a lost webhook delivery and is the only way to notice a deleted lane
(bit.cloud has no lane-removed event). **Actions → bit-sync → Run workflow**
runs the same reconcile on demand.

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
| No run after an export. | The webhook delivery failed. | Read the delivery log on the scope. `401`: wrong relay token. `502`: the App is not installed on the repository. No delivery at all: wrong event name — it is `export-success`. |
| A run starts, but no pull request. | The repository forbids the write. | Turn on **Allow GitHub Actions to create and approve pull requests** (step 2). |
| The run halts and the PR gets the `bit-sync-conflict` label. | Git and the lane changed the same line. | Resolve on the branch, push, remove the label. The lane stays paused while the label is present. |
| The run halts with `scope <your-scope> not found` right after `Exporting N components`. | The export was refused: the token behind `BIT_CONFIG_ACCESS_TOKEN` cannot write to the scope (scope tokens are read-only). | Use a service-account user token with scope membership (step 3), remove the leftover label, re-run. |
| A lane export runs the *main* sync instead of the lane. | The dispatch carried no `laneId`. | Point the webhook at the relay (step 5) — it extracts the lane from the raw event. A hand-rolled dispatch must send `client_payload.laneId` as `"scope-id/lane-name"`. |
| The run halts with a shallow-clone message. | `actions/checkout` fetched one commit. | Keep `fetch-depth: 0` in the checkout step. |
| A run shows as **action required** / later "required approval… expired" on a bot PR. | The repository requires approval for workflow runs on bot pull requests; the job never ran and never needed to. | Approve it, ignore it, or turn the requirement off under **Settings → Actions → General**. |
| A Ripple job for the last lane snap fails right after a merge. | The release archived the lane while that build was still running. | Expected timing artifact. The release job builds main; that one matters. |

## Files

| Path | Purpose |
| --- | --- |
| `workspace.jsonc` | Engine pin and the sync configuration. |
| `components/` | The mirrored components of `acme-modular.store`. |
| `.github/workflows/bit-sync.yml` | Lane→branch, branch→lane, main→git. |
| `.github/workflows/bit-release.yml` | Merge→release. |
| `.github/workflows/bit-adopt-pr.yml` | Optional: adopt a git-born pull request into a lane. |

## License

Apache-2.0. See [LICENSE](./LICENSE).
