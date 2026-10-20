# Agent rules — SK Baghel Tour & Travels (monorepo)

This repository is a monorepo with three independently deployable applications:
`react/` (customer site), `admin/` (operations desk) and `backend/` (API).
Deployment topology, provider settings and the command contract live in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Read before writing code, every session

1. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — hosts, build commands, env vars, release order. **Read this before touching any deployment config.**
2. [`react/docs/01_AI_OPERATING_INSTRUCTIONS.md`](react/docs/01_AI_OPERATING_INSTRUCTIONS.md) — how to operate on this codebase
3. [`react/docs/02_PROJECT_CONTEXT.md`](react/docs/02_PROJECT_CONTEXT.md) — architecture and conventions
4. [`react/docs/04_PROGRESS_TRACKER.md`](react/docs/04_PROGRESS_TRACKER.md) — frontend tracker; read the **Current State** block first
5. [`react/docs/03_PHASE_PLAN.md`](react/docs/03_PHASE_PLAN.md) — **current phase only**
6. [`react/docs/DESIGN.md`](react/docs/DESIGN.md) and [`docs/project/DESIGN_LOCKS.md`](docs/project/DESIGN_LOCKS.md) — any UI step; verify a component is not LOCKED before editing it
7. [`docs/project/ANIMATION_RULES.md`](docs/project/ANIMATION_RULES.md) — before adding or modifying any animation
8. [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) + [`.agents/rules/PAYMENT_AGENT_RULES.md`](.agents/rules/PAYMENT_AGENT_RULES.md) — before any Razorpay, webhook, refund or "mark paid" work
9. [`BACKEND_RULES.md`](BACKEND_RULES.md) — before any backend, API, database, controller or integration work
10. [`FRONTEND_RULES.md`](FRONTEND_RULES.md) — master frontend architectural standard, typography scale, design tokens, SSG, and component rules

Implement **exactly one step** from the tracker (`react/docs/04_PROGRESS_TRACKER.md`
for frontend/React, [`docs/project/PROGRESS.md`](docs/project/PROGRESS.md) for backend). Update the tracker
when that step is done. Never skip ahead.

`react/docs/` holds the frontend-specific pack (`00_START_HERE.md` is its overview:
design, animation, launch checklist, fix plan). Platform-wide project history and
planning documents live in `docs/project/`; the root retains operational rules,
`README.md`, and the latest `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md`.
The agent handoff and repeatable runbook are in `docs/agent/`.

## Build hygiene (enforced by CI)

- Builds write **only** inside `react/dist`, `admin/dist` and `backend/dist`. The one
  tracked file a build rewrites is `react/public/sitemap.xml`.
- Never point `react/scripts/generate-sitemap.ts`, the pre-renderer, or any other
  build script at the repository root or a root `dist/`.
- Never commit `dist/`, `node_modules/`, `.env*` (except the examples) or generated
  copies of app output.
- Frontend bundles are public: no database, payment, webhook or service-role secret
  may ever reach `react/` or `admin/` build output. CI fails the build if secret
  names appear in either bundle.
- `react/dist` and `admin/dist` must remain deployable artifacts: the customer app
  keeps real 404 semantics (`404.html`, `not_found_handling: "404-page"`), the admin
  app keeps its SPA fallback (`admin/public/_redirects` +
  `not_found_handling: "single-page-application"`).

## Verify before you finish

```bash
npm run verify    # typecheck x3 + backend tests + build x3 (same as CI)
```

<!-- beacon:workflow:start -->
## Beacon — feature workflow

This project uses Beacon (a local planning/visualization panel; run `beacon` to open it). When you start work on a FEATURE — whether referenced via an `@beacon:feature://…` mention, an `@beacon:note://…` note the user wrote in the Notes panel (treat its checkbox `- [ ]` todos as subtasks and order features by their dependencies), or just described in chat — follow these steps in order:

### 1. Load context FIRST — do NOT Glob/Grep the codebase blind

Call `beacon_context_for_feature({ id | title | query })` BEFORE reading files. It returns, in one round-trip:
- the files the feature is attached to,
- what those files import + what imports them (live code-graph blast radius),
- endpoints in the feature's domain + the tables each touches + those tables' FK relations,
- sibling architecture components and the project's conventions.

That bundle replaces the discovery phase. Read only the files it returns plus whatever those imports lead you to. If the feature has no files attached yet, the bundle still gives you the domain map — Glob is a last resort.

Mid-feature, when deciding whether a change is safe, call `beacon_blast_radius({ path })` for the file you're about to edit — same code-graph data, file-centric.

For a symbol-level question — who calls X, what X reaches, how A gets to B — reach for the live symbol graph instead of grepping: `beacon query "<question>"` for a scoped subgraph, `beacon explain <symbol>` for callers and callees with file:line, `beacon affected <symbol>` for what a change to it reaches, or `beacon path <A> <B>` for how one symbol reaches another — from the terminal, or the `beacon_graph` MCP tool. Model-free, one call, answers straight from the graph.

### 2. Design the data BEFORE writing code

Determine the database tables the feature needs. If any don't exist yet, design the schema and call `beacon_propose_plan` (tables + relations + endpoints). This renders an **editable draft on the /plan page** for the user to review. The tool BLOCKS until the user clicks Approve / Discard / submits feedback. Implement migrations + code ONLY after it returns approval.

When listing endpoints, give each `uses: [{ table, access }]` so the endpoint→table links draw on /db.

EVERY feature MUST carry `category` (e.g. AUTH | SEARCH | DATA | INTEL | BILLING | …; `cluster` is accepted as an alias) and `priority` (0 = P0 critical, 1 = P1 high, 2 = P2 medium, 3 = P3 low). Beacon REJECTS a plan whose features omit either — `beacon_propose_plan` returns the list of what's missing, and an ExitPlanMode ```beacon block is denied — so set both on every feature instead of relying on defaults.

When the workspace HAS A FRONTEND (Beacon knows — the agent set `hasFrontend` at init, or frontend files were detected), every feature must ALSO carry `layer`: `"frontend" | "backend" | "fullstack"` — which side of the stack the work lands on. Plans omitting it are REJECTED the same way category/priority are. It works on every surface that creates roadmap cards (`beacon_propose_plan`, the ```beacon block, `beacon_feature` — sub-tasks default to the parent's layer) and on architecture components (`beacon_feature` action:done / `beacon_init_persist`). In a pure-backend repo, never set it — the boards don't show it there.

### Adding a card directly — `beacon_feature` (no review gate)

To put a card on the board WITHOUT the plan-review flow, call `beacon_feature` — ONE tool for a feature's whole lifecycle:
- `{ action: "add" }` creates a card in a SINGLE call. It defaults to `status: "backlog"` (a PENDING item you're NOT working on yet); pass `status: "active"` to start it IN_PROGRESS now. A title that matches an existing card in the SAME category + layer returns `exists` (reuse it) — the same title in a DIFFERENT category or layer (FE/BE/FS) creates a distinct card; `add` never activates or demotes a card already on the board.
- `{ action: "start" }` marks an existing card IN_PROGRESS (create-or-flag).
- `{ action: "subtasks" }` adds child tasks under a card.
- `{ action: "done" }` completes feature(s) and registers the files/architecture touched.

A NEW card REQUIRES `category` + `priority` (and `layer` where the workspace has a frontend). Use `beacon_propose_plan` / `beacon_present_plan` only when you want the user to REVIEW before the card lands.

REUSE before you create. Call `beacon_map` FIRST — it lists every card with its `category`, `priority`, `layer` and `status`, so you reuse an existing category (don't invent a near-synonym) and spot duplicates WITHOUT calling `beacon_entities`. Beacon blocks only an EXACT duplicate — same title AND category AND layer — plus a card created without a category; a same-named card in a DIFFERENT category, or on a different layer (frontend/backend/fullstack), is allowed as its own card. `category` is the ONLY domain field. `front` (in `beacon_feature`) nests a card UNDER an existing parent feature — it is NOT a domain tag; a `front` that matches no real feature is rejected.

When listing features, give each `dependsOn: ["Other feature title", …]` for any feature that must ship after another in the same plan. Beacon draws these as "depends on" links so the roadmap shows the dependency chain instead of loose, disconnected cards.

A roadmap item that is a BUG to fix (not a feature to build) should carry `kind: "BUG"` — it renders as a typed bug card. This works everywhere roadmap cards are created: `beacon_propose_plan` features, the ```beacon block, `beacon_feature` (add/start when the user is working on a bug; or `subtasks` items for a bug discovered mid-work), and `beacon_init_persist` roadmap items. Default is FEATURE.

### 2b. Presenting a plan in plan mode (ExitPlanMode)

In Codex (which has no ExitPlanMode), always present plans via `beacon_present_plan` / `beacon_propose_plan` instead — this section applies to Claude Code's plan mode only.

When you present a plan via ExitPlanMode (not `beacon_propose_plan`) and it proposes DB tables/relations/endpoints or roadmap features, embed ONE fenced ```beacon code block of JSON in the plan — the same shapes `beacon_propose_plan` accepts:

```beacon
{ "tables": [...], "relations": [...], "endpoints": [...], "features": [...] }
```

Beacon extracts it deterministically and **strips the block from the prose** (it's never shown in the annotation panel), then renders the tables + features as an **editable board** on /plan so the user can edit them and have those edits flow back as feedback. Omit the block for pure code-change plans.

**The board is built ONLY from the block — prose is NOT parsed.** If your plan describes ANY database models/tables/columns in the prose (e.g. "Model `legal_precedent.py` — natural key (court, …)"), you MUST also put them in the block's `tables` array (with `columns`), or the /db tab will be empty for that plan. Same for endpoints (`endpoints` with `uses:[{table,access}]`) and features (`features`). A plan that lists five tables in prose but ships a block with only `features` renders an empty database board — exactly the "I described models but the DB tab is empty" failure. Mirror every DB entity you mention into the block.

### 2c. Mark the files you mention — write repo-relative paths in backticks

When a plan, feature, or architecture-component description mentions a source file, write its **repo-relative path inside backticks** — `app/api/plan/route.ts`, not "the plan route". On the /plan canvas Beacon turns every backticked token that matches a REAL repo file into a clickable mention that opens it in the user's editor; a bare filename matching several files (e.g. `route.ts`) opens a pick-one dropdown of the same-named candidates. The match is deterministic against the live code graph, so a path that isn't a real file just stays plain text — there's no special syntax to learn and no downside to over-marking: always name files by their real path so the reader can jump straight to the code.

### 3. At the end, register the work — in ONE call

Call `beacon_feature({ action: "done" })` **ONCE** with a `features` array — one entry per feature the plan created — each with the files you touched and a short markdown description. This flips each one to **Done** — including its sub-tasks (the cascade completes every PENDING/IN_PROGRESS child; a sub-task you did NOT finish must be set BLOCKED or CANCELLED before registering, so it survives visibly) — and keeps `beacon_context_for_feature` accurate for the next session.

Key each entry by its node `id`: the ids are handed back to you when the plan is approved (in the approval message / additionalContext), so you don't fuzzy-match titles or pay a disambiguation round-trip. If you don't have an id, `title` still works.

Register them all in that single batched call. If a plan added five features, that's ONE `beacon_feature({ action: "done" })` call with five entries — NOT five calls, and NOT just an umbrella ("Harden auth"), which leaves the individual features stuck on **Pending**.

If the feature added or materially changed a REAL architectural component (a subsystem — NOT a file), also pass `architecture: [{ title, domain, role, … }]` so the Architecture map stays accurate. It upserts curated components by title; never list files as components. If you found a bug or something worth investigating in a component's code, add `bugs: [{ note }]` to its architecture entry — it renders as a bug flag on the node (attributed to the agent); identical open flags are not duplicated. Only flag what you actually saw in the code.

Pull raw planning data anytime with `beacon_entities` (features / architecture / tables / endpoints).
<!-- beacon:workflow:end -->

<!-- BEGIN AWS Agent Toolkit rules -->
# AWS Guidance for the new AWS experience

This user has signed up for the new AWS experience. This experience lets you sign into AWS using a social provider and requires the following additional context.

Where this guidance conflicts with the project's own instructions, the project's instructions take precedence.

## Context

### Terminology:

- Say "project" instead of "account" — a project contains an AWS account and settings for sharing with other collaborators
- Say "team member" instead of "IAM user" — users are invited by email, not created or federated in IAM
- Say "AWS Settings" when referring to management tasks at [settings.aws.com](https://settings.aws.com/) (project management, billing, team members, spend limits). Users view their actual AWS resources in the AWS Management Console.
- Say "selected Region" when referring to the user's Region — not "home Region"
- The user has a managed IAM experience. This includes a managed service control policies (SCP) and resource control policies (RCP) that govern the use of AWS. They will still need to use IAM to create policies to let services work with each other. If there are questions about the SCPs or RCPs, go to the documentation at https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html

### Constraints:

- All projects share a single AWS Region determined by the user's contact address. Resources cannot be created in other Regions
- When developing:
  - MUST create all Regional resources in the project's assigned Region
  - You CAN create AWS WAF and Cloudwatch Logs resources in us-east-1 when there are global resources (like a global WAF instance) that require a connection to dependencies in us-east-1. You should not use these for any other reason, because resources in the selected Region will provide lower cost (due to no cross-Region traffic), increased availability (due to no cross-Region traffic), and easier manageability (due to not needing to look in another Region). When you need to do an inventory of resources, you need to look in both the selected Region and us-east-1 for Cloudwatch Logs or WAF resources.
  - MUST NOT attempt to create Lambda, API Gateway, or other Regional resources in any other Region
  - MUST direct users to confirm their Region in AWS Settings > View all projects > Overview > Additional Info > Region. If the user cannot confirm their Region, check in ~/.aws/config
  - MUST NOT use Lambda@Edge — excluded from both Lambda and CloudFront
  - MUST NOT use CloudFormation StackSets — no multi-account or multi-Region deployments
  - MUST NOT attempt cross-Region actions — no cross-Region replication for DynamoDB/S3/RDS, no multi-Region KMS keys
  - MUST NOT use Route 53 cross-Region routing — geolocation, latency-based, and failover routing policies are not available
  - CloudFront is a global service and its actions ARE allowed in `us-east-1`. A user can create a CloudFront distribution pointing to their project-region Lambda function URL or API Gateway. However, Lambda and API Gateway themselves MUST NOT be created in `us-east-1` — they must be in the project Region.
  - Reduced availability in `eu-north-1` specifically: Amazon Rekognition, Amazon Textract, Amazon Personalize, AWS App Runner are not available in that Region.
- IAM permissions for human access are managed by AWS. Don't assign roles to team members unless absolutely necessary
- The user may have a spend limit if they are on the paid plan. The limit that pauses their project if it's exceeded. If resources suddenly become inaccessible, ask if they have a spend limit configured. Only project owners can modify a spend limit.
- When developing:
  - MUST ask about spend limit status if the user reports sudden "Access Denied" errors on operations that previously worked
  - MUST direct users to check spend status in AWS Settings > Billing
  - MUST check if a user has upgraded their account to the paid plan
  - MUST ask the user if they want to clean up the successfully created resources or keep them to reduce cost
- The user sets up billing, creates spend limits, and retrieves and pays invoices in AWS Settings. The user creates budgets and optimizes their costs in the AWS Billing and Cost Management console
- Not all AWS services are available. If a service isn't working, do the following:
  1. Run the command `aws freetier get-account-plan-state`
  2. If accountPlanType": "FREE", check the [Free Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier) next,
  3. If accountPlanType": "PAID", check the [Paid Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-paid-plan).
  4. If neither list shows the service, check the [Not supported for this experience list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#unsupported-services). The user will need to activate advanced features to access this service.
- Users can activate advanced AWS services and capabilities for their account.
- Before starting a task, check whether a relevant AWS skill is available. Load the skill with retrieve_skill and prefer its guidance over general knowledge.

### Help level

- help_level (required): LOW, MEDIUM, or HIGH. While a user is building, you MUST ask the user: "How much guidance would you like from me? Low (I only flag security risks), medium (I ask a couple of clarifying questions if something seems off), or high (I explain what I'm doing, suggest alternatives, and flag best practices)."

You CAN update this rule file to save a user's help_level.

Constraints for each level:

**LOW:**

- MUST follow all constraints in this context file
- MUST execute the user’s request without modification
- MUST NOT ask clarifying questions unless the action would create a security vulnerability
- MUST NOT suggest alternatives or improvements

**MEDIUM:**

- MUST execute the user's request
- MAY ask up to two clarifying questions per task if the request has an ambiguity or a potential issue
- MUST NOT repeat a question or suggestion the user has already dismissed
- MUST NOT explain trade-offs or alternatives unless the user asks

**HIGH:**

- MUST explain what each step does and why before executing it
- MUST suggest alternatives when a better approach exists
- MUST flag best practices and explain trade-offs
- MUST still execute the user's choice if they disagree with a suggestion
<!-- END AWS Agent Toolkit rules -->

## Model Configuration — Amazon Bedrock (Qwen 3 Coder Next)

For AI coding agents and local tooling utilizing Amazon Bedrock:
- **Model ID**: `qwen.qwen3-coder-next`
- **Provider Protocol**: Bedrock Mantle (OpenAI-compatible)
- **Base URL**: `https://bedrock-mantle.eu-north-1.api.aws/v1`
- **Region**: `eu-north-1`
- **Authentication**: `Authorization: Bearer <AWS_BEARER_TOKEN_BEDROCK>`
- **Environment Variable**: `AWS_BEARER_TOKEN_BEDROCK` (stored in Windows User Environment via `setx`)
- **Default Profile**: `default` (ARN: `arn:aws:iam::943088190525:root`)
- **Test Script**: [test.py](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/test.py)



<!-- BEGIN TESTSPRITE AGENT SECTION (testsprite agent install codex) -->
<!-- testsprite-skill: testsprite-verify+testsprite-onboard+testsprite-ci v0.15.0 sha256:e45c7d3bdbf7 -->
# TestSprite Verification Loop

Run relevant tests and inspect failures before reporting. Skip docs/build-config
edits; missing credentials mean unverified. Honor the user's CLI/MCP choice.

## 1. Preflight and project

```bash
testsprite --version
testsprite auth status
```

If missing, advise CLI install or `testsprite setup`. Find the project via
`$TESTSPRITE_PROJECT_ID`, `.testsprite/config.json`, then `testsprite project list
--output json`; ask if several match.

For a local app without a project:

```bash
testsprite project create --type frontend --name "<repo name>" --local <port> --local-host <host>
testsprite test create --plan-from plan.json --project <projectId>
testsprite test run <id> <id> --local <port> --local-host <host> --output json
```

Local projects need V3 (V2-only: exit 7, `local-origin-requires-v3`). Exploration
and `test plan generate` exit 6 before charge. Create plans with `test create
--plan-from` without `--run`; then run several ids with `--local`. Portal runs
are blocked free until `project update <id> --url https://…` sets a public URL.
For deployed projects use `project create --url`; empty suites can use `test plan
generate --project <id>` then `test plan accept`.

## 2. Run against the change

The CLI does not host apps. Create a deployed environment once; select it with
`--env <name>` or omit for Default. Unknown names list valid names. Use `--local
<port>` for local FE runs.

```bash
# Deployed frontend: create + run, or run an existing test
testsprite project env create <id> --name staging --url https://staging.example.com
testsprite test create --plan-from plan.json --run --wait \
  --env staging --timeout 600 --output json
testsprite test run <test-id> --env staging \
  --wait --timeout 600 --output json
# Backend Python assertion
testsprite test create --type backend --name "Login rejects empty password" \
  --project <id> --code-file /tmp/test.py --run --wait --timeout 600
# Deployed replay (V3 FE: 0.5 credit)
testsprite test rerun <test-id> --env staging --wait --output json
# Dependency batch; optional --filter <substring>
testsprite test run --all --project <id> --env staging --wait --output json
```

- Supported backends grant existing keys `run:tunnel`; a narrowed key without it
  exits 3. Free-plan local runs work; V3 FE costs 0.5 credit. BE cannot use `--local`.
- `--local` implies `--wait` (1200 s per run; ordinary: 600). `--local-host`:
  `localhost`, `127.0.0.1` (default), `::1`. A dead port exits 5 before charge;
  `--skip-preflight` skips the probe. Environment `--url` rejects private hosts.
  `--local` selects/creates `local-<port>`; a named `--env` must be local.
  `--target-url` cannot combine with `--local`.
- Run local ids together (`test run <id> <id> … --local <port>`); `--all --project
<id> --local <port>` skips BE tests. One tunnel, 5 concurrent runs by default
  (`--max-concurrency` 1–10). Five live bindings per user; `tunnel_binding_limit`
  exits 11 without retry. Use `tunnel list` then `tunnel stop <id>` or `--all --confirm`.
- Keep early **stderr** `Run <runId>` receipts and any `Dashboard: <url>`.
  Stdout is the JSON channel.
- An **owned** local timeout, Ctrl-C, or poll failure requests cancellation and
  closes the tunnel. Before a terminal V3 FE verdict, the backend attempts a refund;
  check `refund.status`: cancellation does not guarantee a refund.
  `--no-cancel-on-interrupt` detaches, but the owned tunnel still closes.
- After an owned timeout, start a **new** `test run <test-id> --local <port>
--timeout 1800` (retain `--local-host`). `test wait` cannot reopen the tunnel;
  ordinary/adopted waits can resume with `test wait <run-id>` if reachable.
- Keep `tunnel start` alive; borrow with `--local <port> --tunnel-client <uuid>`.
  Adopted runs normally detach without cancellation or closing the owner's tunnel.
  If the owner has disappeared during a run, cancellation is requested by default;
  `--no-cancel-on-interrupt` skips it. A second connection with the same credential
  takes over; the first exits **10**.
- Loopback environments need `--local <port>`. Bare CLI runs selecting one by
  name or Default exit 6 (`tunnel-required`) before dispatch or charge. The Portal
  shows no Run; backend requests are refused free. Schedules and test lists get
  free BLOCKED results. A public `--env` or Default works regardless of earlier
  tunnel runs. V3 local runs use the agent path, never saved-code replay, and
  preserve saved code.
- `--wait` handles polling/backoff; do not wrap it in a retry loop.
- Backend Python runs top-to-bottom, not via pytest: call `test_*` functions.
  The sandbox has stdlib, `requests`, `pytest`, `numpy`, `scipy`; use HTTP,
  not project imports or uninstalled packages.
- Backend `--produces`/`--needs` are repeatable; `--category teardown` marks cleanup.
  Set dependencies with `test create` or edit with `test update`; do not delete
  and recreate. Use `test run --all` for producer → consumer → teardown ordering
  and variable passing. A BE `test rerun` includes that closure and its side effects;
  `--skip-dependencies` selects only the named test. Triage failed producers before
  blaming consumers starved of their token/fixture.

## 3. Inspect and report

```bash
testsprite test artifact get <run-id> --out ./.testsprite/runs/<run-id>/
testsprite test steps <test-id> --run-id <run-id> --output json
```

Read failing steps, screenshots and root cause. Bare `test steps <test-id>`
shows the latest run; pin the receipt's id. For empty latest steps, choose an
earlier run from `test result <test-id> --history`. Report verdict and dashboard.

Exits: 0 passed; 1 failed/blocked/cancelled; 3 auth/scope; 4 not found;
5 validation; 6 conflict/precondition; 7 timeout/unsupported; 10 unavailable;
11 rate limited; 12 insufficient credits.

## Dry-run and setup

`--dry-run` works without credentials:

```bash
testsprite test run <test-id> --dry-run --output json
testsprite test create --plan-from plan.json --dry-run --output json
```

Setup: `npm install -g @testsprite/testsprite-cli`; `testsprite setup`.

**First-time setup:** if this repo has no TestSprite tests yet, seed a *broad* first suite across its main user flows — not just one test — each with a concrete, observable assertion, before reporting setup as done. Try `testsprite test plan generate --project <id>` then `test plan accept` first; author plans by hand only if generation is unavailable.

**CI gate:** to run TestSprite on every pull request, use `testsprite ci init github --project <id> --env <name>`, finish the `REPLACE ME` step for how PRs deploy (platform-deployed previews → `on: deployment_status`; the workflow deploys → keep `pull_request`), set the `TESTSPRITE_API_KEY` secret, then prove it on one real, non-draft pull request. If the GitHub App already gates the project, ask before adding a second gate.
<!-- END TESTSPRITE AGENT SECTION -->
