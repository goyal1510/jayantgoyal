# Studio capability catalog

This is the human-readable map of Studio's implemented capabilities. Runtime
availability and display details are defined by Studio registries and route
files.

## Product inventory

| Product card        | Access   | Status    | Owned implementation                                           |
| ------------------- | -------- | --------- | -------------------------------------------------------------- |
| Tech Tools          | public   | available | 87 browser utility pages plus optional account usage history   |
| Weather             | public   | available | City/geolocation search, current conditions, five-day forecast |
| GitHub Stats        | public   | available | Public profile, repository, language, and activity summaries   |
| Calculator Builder  | public   | beta      | Drag/drop inputs, operations, outputs, local persisted state   |
| Game Hub            | account  | available | Nine local/computer games; eight online-room variants          |
| Activity Tracker    | account  | available | Activity definitions, daily entries, dashboard statistics      |
| Currency Calculator | account  | available | Cash denominations, saved calculations, history/PDF detail     |
| File Manager        | account  | available | Private folders/files, upload, move, copy, rename, soft delete |
| Sync Scratchpad     | account  | beta      | Private text/code entries with Realtime synchronization        |
| E-commerce          | external | beta link | Separate deployment; not implemented in this repository tree   |

Portfolio/Writing links in Studio navigation are external destinations owned by
Portfolio, not Studio capabilities.

## Tool categories

All tool pages live below `/tools`, are public/indexable, and keep their
implementation in Studio. Signed-in users can favorite tools and record recent
usage through `/api/tools/usage`.

### Calculators (4)

- `/tools/calculators/chronometer`
- `/tools/calculators/eta-calculator`
- `/tools/calculators/math-evaluator`
- `/tools/calculators/percentage-calculator`

### Code and developer tools (9)

- `/tools/code-dev-tools/chmod-calculator`
- `/tools/code-dev-tools/crontab-generator`
- `/tools/code-dev-tools/docker-converter`
- `/tools/code-dev-tools/git-cheatsheet`
- `/tools/code-dev-tools/http-status-codes`
- `/tools/code-dev-tools/json-diff`
- `/tools/code-dev-tools/keycode-info`
- `/tools/code-dev-tools/regex-cheatsheet`
- `/tools/code-dev-tools/regex-tester`

### Converters (15)

- `/tools/converters/base64-encoder-decoder`
- `/tools/converters/base64-file-converter`
- `/tools/converters/color-converter`
- `/tools/converters/date-time-converter`
- `/tools/converters/integer-base-converter`
- `/tools/converters/json-to-toml`
- `/tools/converters/json-to-xml`
- `/tools/converters/json-to-yaml`
- `/tools/converters/roman-numeral-converter`
- `/tools/converters/temperature-converter`
- `/tools/converters/toml-to-json`
- `/tools/converters/toml-to-yaml`
- `/tools/converters/xml-to-json`
- `/tools/converters/yaml-to-json`
- `/tools/converters/yaml-to-toml`

### Formatters (5)

- `/tools/formatters/json-minify`
- `/tools/formatters/json-prettify`
- `/tools/formatters/sql-prettify`
- `/tools/formatters/xml-formatter`
- `/tools/formatters/yaml-prettify`

### Generators (9)

- `/tools/generators/bip39-generator`
- `/tools/generators/ipv6-ula-generator`
- `/tools/generators/mac-generator`
- `/tools/generators/otp-generator`
- `/tools/generators/random-port-generator`
- `/tools/generators/rsa-key-generator`
- `/tools/generators/token-generator`
- `/tools/generators/ulid-generator`
- `/tools/generators/uuid-generator`

### Hash and encryption (5)

- `/tools/hash-encryption/bcrypt`
- `/tools/hash-encryption/encrypt-decrypt`
- `/tools/hash-encryption/hash-text`
- `/tools/hash-encryption/hmac-generator`
- `/tools/hash-encryption/password-strength`

Cryptographic utilities are browser tools, not a promise that generated or
entered secrets are suitable for production key management.

### Media and QR (4)

- `/tools/media-qr/camera-recorder`
- `/tools/media-qr/qr-code-generator`
- `/tools/media-qr/svg-placeholder-generator`
- `/tools/media-qr/wifi-qr-code-generator`

### Network tools (4)

- `/tools/network-tools/ipv4-address-converter`
- `/tools/network-tools/ipv4-range-expander`
- `/tools/network-tools/ipv4-subnet-calculator`
- `/tools/network-tools/mac-address-lookup`

### Other utilities (13)

- `/tools/other/basic-auth-generator`
- `/tools/other/benchmark-builder`
- `/tools/other/device-information`
- `/tools/other/emoji-picker`
- `/tools/other/html-entities`
- `/tools/other/html-wysiwyg-editor`
- `/tools/other/json-to-csv`
- `/tools/other/markdown-to-html`
- `/tools/other/mime-types`
- `/tools/other/open-graph-generator`
- `/tools/other/outlook-safelink-decoder`
- `/tools/other/personal-information-form`
- `/tools/other/url-encoder-decoder`

### Parsers and validators (7)

- `/tools/parsers-validators/email-normalizer`
- `/tools/parsers-validators/iban-validator`
- `/tools/parsers-validators/jwt-parser`
- `/tools/parsers-validators/pdf-signature-checker`
- `/tools/parsers-validators/phone-parser`
- `/tools/parsers-validators/url-parser`
- `/tools/parsers-validators/user-agent-parser`

### Text tools (12)

- `/tools/text-tools/ascii-art-generator`
- `/tools/text-tools/case-converter`
- `/tools/text-tools/list-converter`
- `/tools/text-tools/lorem-ipsum-generator`
- `/tools/text-tools/numeronym-generator`
- `/tools/text-tools/slugify-string`
- `/tools/text-tools/string-obfuscator`
- `/tools/text-tools/text-diff`
- `/tools/text-tools/text-statistics`
- `/tools/text-tools/text-to-ascii-binary`
- `/tools/text-tools/text-to-nato`
- `/tools/text-tools/text-to-unicode`

## Game catalog

| Game                | Local/computer modes | Online room | Server action          |
| ------------------- | -------------------- | ----------- | ---------------------- |
| Rock Paper Scissors | computer             | yes         | Move submission        |
| Tic Tac Toe         | local and computer   | yes         | Move submission        |
| Dare X              | local multiplayer    | yes         | Turn/action submission |
| Connect Four        | local and computer   | yes         | Generic session move   |
| Memory Match        | local and computer   | yes         | Card flip action       |
| Wordle              | solo                 | yes         | Seeded guess action    |
| Typing Speed        | solo                 | no          | Result history         |
| Chess               | local                | yes         | Legal move submission  |
| Ludo                | online-first         | yes         | Dice/token action      |

The common online data model stores a session, participants, ordered moves,
results, state, turn owner, status, and completion. Game-specific route handlers
validate payload and rules, then use the shared server module/database RPC to
record the transition atomically.

## Account workspace flows

### Activity Tracker

Activities define what the user tracks. Entries record date, completion, and
notes. Dashboard statistics combine both tables. Management creates/edits
activities; Tracker records daily entries; Dashboard summarizes progress.

### Currency Calculator

The form computes denomination totals client-side, then saves a calculation and
its denomination rows. History filters saved calculations and can render detail
or PDF output. Rows are always user-owned through RLS.

### File Manager

Metadata and directory hierarchy live in `jg_app.file_manager_files`; bytes
live in `private-files`. APIs create folders, request signed upload URLs,
complete uploads, list directories, rename, soft-delete, copy, and move. File
conflicts are explicit UI flows. Storage cleanup accompanies failed/overwritten
metadata operations where possible.

### Sync Scratchpad

The API creates, updates, and deletes private text/code entries. The page also
subscribes to user-scoped Realtime changes so another active client reflects
the canonical rows.

### Tool usage

`tool_favorites` stores one user/tool pair. `tool_history` stores bounded recent
use and update timestamps. Anonymous users can use tools without database
history.

## Browser-local and provider-backed capabilities

Calculator Builder uses a persisted Zustand store with manual hydration. Most
tools process input in the browser. Weather calls OpenWeather using the
browser-visible key and must show a clear provider/configuration error. GitHub
Stats calls Studio server routes so the GitHub token never enters the browser.
