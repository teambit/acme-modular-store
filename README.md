# acme-modular-store

A complete, working reference for **bi-directional sync between bit.cloud and
GitHub** with [`bit ci sync`](https://github.com/teambit/bit-git-sync). This
repository is the git mirror of the
[`acme-modular.store`](https://bit.cloud/acme-modular/store) scope: every lane
on the scope becomes a branch and a pull request here, every export shows up
minutes later as a commit, and merged pull requests release back to the scope.

"ACME" plays the customer. Everything below is what a real organization sets
up once; the deeper reference with the full behavior table is
[`teambit/bit-git-sync-example`](https://github.com/teambit/bit-git-sync-example).

## The moving parts

| Piece | This instance |
| --- | --- |
| Mirrored scope | [`acme-modular.store`](https://bit.cloud/acme-modular/store) (`catalog/product-listing`, `cart/order-summary`) |
| Cross-scope dependency | [`acme-modular.platform`](https://bit.cloud/acme-modular/platform) (`utils/format-price`, `utils/slugify`), consumed by package name |
| Sync workflows | [`.github/workflows/`](.github/workflows/): `bit-sync.yml` (reconcile), `bit-adopt-pr.yml` (adopt a git-born PR into a lane), `bit-release.yml` (merged PR → scope release) |
| Push trigger | A bit.cloud **Export succeeded** webhook on the scope → the webhook relay → `repository_dispatch` here |
| GitHub credential | The [`bit-git-sync`](https://github.com/apps/bit-git-sync) GitHub App: org-owned, Contents read/write on this repository only, tokens minted per delivery |
| Relay | [`teambit.git/apps/webhook-relay`](https://bit.cloud/teambit/git/apps/webhook-relay), hosted on bit.cloud |

## Setting this up for your own organization

1. **Scopes**: create your scopes on bit.cloud and export components. One git
   repository mirrors one scope (lanes may span scopes; the mirror carries
   this scope's slice).
2. **Repository**: copy the three workflows from `.github/workflows/` into an
   empty repository, together with a `workspace.jsonc` whose
   `teambit.git/ci.sync` block says which lanes to mirror (`"lanes": ["*"]`),
   how to sync main (`"mainSync": "pr"`), and what to do on conflict
   (`"halt"`).
3. **Secret**: add `BIT_CONFIG_ACCESS_TOKEN` — a bit.cloud token whose account
   can **export** to the mirrored scope. A scope token
   (scope settings → tokens) is read-only: syncs will work but the release
   step fails with `scope <id> not found` (that message means "export
   refused"). Use a dedicated service-account user that is a member of the
   scope, and its token.
4. **GitHub App**: install [`bit-git-sync`](https://github.com/apps/bit-git-sync)
   on the repository (Contents read/write only). It has no webhook and
   receives nothing; the relay uses it to send `repository_dispatch`.
5. **Webhook**: on the mirrored scope, add an **export-success** webhook to
   `https://webhook-relay-gggmal.r2.composed.app/dispatch/<github-owner>/<repo>?token=<relay secret>`
   with the payload template
   `{"owner":"{{owner}}","componentIds":"{{componentIds}}","username":"{{username}}","userId":"{{userId}}","laneId":"{{laneId}}"}`.
   (A scope-level webhook carries no custom header, so the secret travels as
   the `token` query parameter. The alternative is an organization-level
   webhook — org **Settings > Webhooks** — which does support an
   `Authorization: Bearer <secret>` header, fires for every scope in the
   org, and must be recreated rather than edited: editing drops its custom
   headers, a bit.cloud defect verified 2026-07-29.)

After that the loop is closed: `bit export` on any lane reaches this
repository within seconds, and merging the pull request releases the lane
back to the scope.

## Trying it

```sh
git clone https://github.com/teambit/acme-modular-store
cd acme-modular-store
bit install
bit test
```

Create a lane, change a component, export it — then watch the branch and the
pull request appear here:

```sh
bit lane create try-git-sync
# edit components/catalog/product-listing/product-listing.ts
bit snap --message "trying git sync"
bit export
```
