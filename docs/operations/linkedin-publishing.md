# LinkedIn publishing operations

LinkedIn publishing is manual operator tooling under `scripts/linkedin`. It is
not part of a product runtime or deployment. Use the scripts as the primary
interface so the machine-local post history stays synchronized with LinkedIn.

## Tool ownership

| File                          | Responsibility                                      |
| ----------------------------- | --------------------------------------------------- |
| `scripts/linkedin/auth.mjs`   | Authorize the member and save a local access token  |
| `scripts/linkedin/post.mjs`   | Publish a post and append it to local history       |
| `scripts/linkedin/manage.mjs` | List, delete, or replace previously tracked posts   |
| `scripts/linkedin/.token.json` | Ignored access token and member identity metadata  |
| `scripts/linkedin/.posts.json` | Ignored local history used by management commands  |

The token and history files are machine-local. Never commit them or copy their
contents into documentation, chat, logs, or command examples.

## Authenticate or renew access

The LinkedIn developer application must allow the callback
`http://localhost:3333/callback` and the `openid`, `profile`, and
`w_member_social` scopes.

Run the authorization flow from the repository root:

```bash
node scripts/linkedin/auth.mjs
chmod 600 scripts/linkedin/.token.json
```

The script opens LinkedIn authorization in the browser, receives the callback
on local port `3333`, resolves the member identity, and writes the token file.
Re-run it when the token is missing, expired, or rejected. Do not display or
pass the access token or client secret through command-line arguments.

## Publish a post

Review the complete text and destination before running the command. The post
script prints a preview and then publishes immediately; it does not have a
dry-run or interactive confirmation step.

```bash
node scripts/linkedin/post.mjs "Post text"
node scripts/linkedin/post.mjs "Post text" --url https://jayantgoyal.com/writing/example
node scripts/linkedin/post.mjs --writing example
```

`--url` attaches the URL as article media. `--writing` uses the canonical
Portfolio writing URL and generates the script's default announcement when no
custom text is supplied. Pass multiline content as one argument and inspect the
printed preview to confirm that paragraph spacing is intentional.

On success, the script records the LinkedIn post URN, text, optional URL,
writing slug, and creation time in `.posts.json`.

## List, replace, or delete posts

List tracked posts before using an index:

```bash
node scripts/linkedin/manage.mjs list
```

Replace a tracked post:

```bash
node scripts/linkedin/manage.mjs edit <index> "Replacement text"
node scripts/linkedin/manage.mjs edit <index> "Replacement text" --url https://jayantgoyal.com/writing/example
```

LinkedIn's API path used by this tooling does not edit a post in place. The
`edit` command waits three seconds, deletes the old post, creates a new post,
marks the old history entry deleted, and appends the replacement. The old post
URL and all of its reactions and comments are lost.

Delete a tracked post:

```bash
node scripts/linkedin/manage.mjs delete <index>
```

The command deletes the LinkedIn post and marks the history entry deleted. A
LinkedIn `404` is treated as an already-completed deletion so local history can
be reconciled after an operator removed the post elsewhere.

Prefer `manage.mjs` over LinkedIn UI automation for tracked posts. Use the UI
only when the script or API cannot perform the operation, then reconcile the
corresponding history entry with the delete command.

## Failure handling

- `No token found` or `Token expired`: run the authorization flow again.
- `Invalid index`: run `manage.mjs list` and use the current index.
- Publish failure: confirm the token, member scope, response status, and full
  LinkedIn error without printing credentials.
- Replacement failure after deletion: the script marks the old entry deleted.
  Review history before publishing a replacement separately.
- Manual deletion outside the script: run `manage.mjs delete <index>` to mark
  the existing entry deleted; the remote `404` is safe and expected.

After any write, run `manage.mjs list` and open the LinkedIn feed to verify the
intended text, spacing, link, visibility, and author.
