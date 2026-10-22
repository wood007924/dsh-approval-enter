# dsh-approval-enter

**Press `Enter` to approve a pending permission request in DeepSeek Harness (DSH). Press `Esc` to reject.** No mouse needed.

[中文说明](README.zh.md)

## The problem

DSH's approval card already answers to `Enter` and `Escape` — but only while keyboard focus is inside the card. The card replaces the composer when a request arrives, so focus falls back to `body`, and `Enter` does nothing. The only way through is to click the card first (or click a button), which defeats the point of a keyboard-driven workflow.

## What this plugin does

- When an approval card appears, it moves focus onto the card's own focusable region, so the shipped `Enter` = *Allow once* / `Esc` = *Reject* handler takes effect immediately.
- If focus later wanders (you clicked the transcript, `Tab` moved away), a capture-phase listener forwards `Enter` / `Esc` through the card's own handler.
- It never answers on its own: no auto-approve, no silent timeouts. The answer still goes through DSH's pending-request lock, its IME guard and its repeat-key guard.
- It does not steal focus from a text field, and it does not touch any other key.

## Install

From npm (once published), through the DSH plugin manager:

```sh
dsh plugin --profile <profile> add dsh-approval-enter
```

From a local checkout (development):

```sh
dsh plugin --profile <profile> add link:/absolute/path/to/dsh-approval-enter
```

Or drop the package into `<DSH_HOME>/profiles/<profile>/plugins/`, link it into that
profile's `node_modules`, and add `dsh-approval-enter` to `dsh.profile.bundles` in the
profile's `package.json`.

**Restart DeepSeek Harness afterwards.** The Host composes the profile at startup; reloading
the page is not enough.

## Verify

1. Settings → Plugins shows **Enter to approve** and it is enabled.
2. Trigger an operation that asks for approval.
3. Do not touch the mouse — press `Enter`. The request should be allowed immediately.
4. Trigger another one and press `Esc`. It should be rejected.

Approval prompts only exist in permission modes that ask. In **full access** mode DSH never
asks, so there is no card to confirm — that is expected, not a failure.

## Compatibility

Built and tested against DSH `0.2.1-rc.2` (desktop, Web UI). The plugin hooks two structural
attributes published by `@deepseek-ai/dsh-client-ui-approval`:

- `[data-approval-key]` — the card root;
- `[data-approval-scroll]` — the card's `tabindex=0` region.

If a future release renames those attributes, `client.js` needs the matching selectors updated.
Nothing else in the product is patched: no `app.asar` changes, no product source edits.

## How it works

`client.js` registers a lazy Client module (`dsh.client`, `immediately: true`). On mount it:

1. installs a `MutationObserver` that scans at most once per animation frame for an approval card;
2. focuses `[data-approval-scroll]` when a new card appears (skipped while a text control has focus);
3. listens for `keydown` in the capture phase: if a card exists, focus is *outside* it, and the
   event does not target a text control, it focuses the card and replays the key there.

The replay matters: the shipped handler checks `currentTarget.contains(document.activeElement)`,
so replaying after focusing is what makes it answer — and it keeps the answer inside the
product's own logic instead of duplicating it.

`index.js` is an empty Host half; the package exists so the bundle has a row to mount.

## Uninstall

Remove the plugin row through the plugin manager, or delete the package and its
`dsh.profile.bundles` entry, then restart. Approval cards go back to pointer-only.

## License

MIT
