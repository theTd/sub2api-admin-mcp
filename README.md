# Sub2API Admin MCP

This MCP server exposes the Sub2API admin HTTP API as a small set of resource-oriented tools.
It is limited to admin CRUD and non-streaming admin query or action endpoints.
Gateway streaming routes are intentionally excluded.

## Tools

- `sub2api_admin_describe_resources`
  Returns the supported resources, CRUD coverage, named actions, documented params, call templates, and examples.
- `sub2api_admin_list`
  Calls the list or collection route for a resource.
- `sub2api_admin_get`
  Calls the get route for a resource.
- `sub2api_admin_create`
  Calls the create route for a resource.
- `sub2api_admin_update`
  Calls the update route for a resource.
- `sub2api_admin_delete`
  Calls the delete route for a resource.
- `sub2api_admin_action`
  Calls a named non-CRUD action such as stats, resets, exports, or OAuth helpers.
- `sub2api_admin_find_capability`
  Searches task recipes, resources, and actions by keyword, intent, path, or parameter name and returns a recommended route, reasoning hints, workflows, and call templates.

## Supported resources

Run:

```powershell
node tools/sub2api-admin-mcp/server.mjs --print-resources
```

That prints the exact resource catalog, every named action, and any documented parameter metadata or examples.
Current top-level resources include:

- `dashboard`
- `users`
- `groups`
- `accounts`
- `announcements`
- `proxies`
- `redeem_codes`
- `promo_codes`
- `subscriptions`
- `usage`
- `user_attributes`
- `error_passthrough_rules`
- `api_keys`
- `scheduled_test_plans`
- `settings`
- `data_management`
- `backups`
- `system`
- `ops`
- `openai_oauth`
- `sora_oauth`
- `gemini_oauth`
- `antigravity_oauth`

## Authentication

Auth precedence is:

1. `SUB2API_ADMIN_API_KEY`
2. `SUB2API_ADMIN_JWT`
3. `SUB2API_ADMIN_EMAIL` + `SUB2API_ADMIN_PASSWORD`

Recommended: use `SUB2API_ADMIN_API_KEY`.
The admin middleware accepts it directly through `x-api-key`.

Optional credential-login variables:

- `SUB2API_ADMIN_TURNSTILE_TOKEN`
- `SUB2API_ADMIN_TOTP_CODE`

Required base URL:

- `SUB2API_BASE_URL`

Optional timeout:

- `SUB2API_TIMEOUT_MS`

## Example MCP config

```json
{
  "mcpServers": {
    "sub2api-admin": {
      "command": "node",
      "args": [
        "C:/path/to/sub2api/tools/sub2api-admin-mcp/server.mjs"
      ],
      "env": {
        "SUB2API_BASE_URL": "http://127.0.0.1:8080",
        "SUB2API_ADMIN_API_KEY": "replace-with-your-admin-api-key"
      }
    }
  }
}
```

Replace the example script path above with your own local absolute path.

## Usage notes

- Run `sub2api_admin_find_capability` first when you know the intent but not the exact resource or action name. It now prefers task recipes and bulk-safe workflows over raw keyword matches.
- `sub2api_admin_find_capability` now returns a `recommended` match plus per-result `why` hints so the agent can pick a route directly instead of re-probing nearby endpoints.
- Run `sub2api_admin_describe_resources` when you know the resource and need the precise call shape, documented params, path placeholders, examples, or warnings.
- `sub2api_admin_describe_resources` returns a compact catalog by default. Pass `view: "full"` when you need the full resource catalog in one response. Aliases such as `summary`, `detail`, `detailed`, or `actions` are accepted and normalized.
- When `resource` is provided, `sub2api_admin_describe_resources` defaults to the full detail view for that one resource.
- Use `id` for routes that use `:id`.
- Use `path_params` for routes that need placeholders such as `profile_id`, `source_type`, `job_id`, or `idx`.
- Use `query` for query string filters.
- Use `body` for JSON payloads on create, update, and action calls.
- The MCP now performs local validation for documented query and body fields before sending requests. Unknown keys produce either a hard error or a warning depending on how complete the endpoint metadata is.
- Documented `call_template` payloads can now include starter query/body args for common safe defaults such as `page_size`, `lite=true`, or `with_count=true`, so agents need fewer exploratory calls.
- For filters like `attr[12]`, use the literal key in `query`.
- High-signal resources such as `usage`, `dashboard`, `accounts`, `users`, `groups`, `proxies`, `subscriptions`, `settings`, `backups`, and `data_management` include richer metadata derived from the admin frontend API layer.
- Task-oriented discovery now understands common goals such as account usage reports, API key ranking, group usage, account inventory, error triage, proxy health checks, subscription inspection, backup health checks, and batch account refreshes.
- `accounts.list` and `accounts.get` responses are sanitized by the MCP to avoid flooding the agent with nested credentials during exploratory reads.

## Local checks

```powershell
node --check tools/sub2api-admin-mcp/server.mjs
node tools/sub2api-admin-mcp/server.mjs --print-tools
node tools/sub2api-admin-mcp/server.mjs --print-resources
node tools/sub2api-admin-mcp/server.mjs --find-capability "看下今天我们sub2api的账号使用情况" --limit 5
```
