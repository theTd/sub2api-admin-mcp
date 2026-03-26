function step(title, tool, args, purpose, options = {}) {
  return {
    title,
    tool,
    arguments: args,
    purpose,
    ...options
  }
}

function endpoint(resource, kind, name) {
  return { resource, kind, name }
}

export const taskRecipes = [
  {
    id: "account_usage_today",
    title: "Today's Account Usage",
    summary: "Summarize today's upstream account activity with per-account requests, tokens, and cost.",
    intent_aliases: [
      "today account usage",
      "daily account usage",
      "account usage report",
      "which accounts are active today",
      "today upstream account usage",
      "账号使用情况",
      "今日账号使用"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["account_id", "name", "requests", "tokens", "cost"],
    preferred_endpoints: [
      endpoint("accounts", "operation", "list"),
      endpoint("accounts", "action", "batch_today_stats")
    ],
    fallback_endpoints: [
      endpoint("usage", "action", "stats")
    ],
    avoid_patterns: [
      "Do not start with dashboard.snapshot_v2 when the user explicitly wants per-account breakdown.",
      "Do not loop accounts.today_stats for every account unless batch_today_stats is unavailable or stale."
    ],
    workflow: [
      step(
        "List accounts",
        "sub2api_admin_list",
        { resource: "accounts", query: { page: 1, page_size: 100, lite: "true" } },
        "Get account ids and names with a lighter payload."
      ),
      step(
        "Batch today stats",
        "sub2api_admin_action",
        { resource: "accounts", action: "batch_today_stats", body: { account_ids: ["<account ids from previous step>"] } },
        "Fetch per-account today stats in one request."
      ),
      step(
        "Fallback precise drilldown",
        "sub2api_admin_action",
        { resource: "usage", action: "stats", query: { account_id: "<account id>", start_date: "<YYYY-MM-DD>", end_date: "<YYYY-MM-DD>", timezone: "<IANA timezone>" } },
        "Use only when you need to validate or replace a stale per-account aggregate.",
        { optional: true }
      )
    ]
  },
  {
    id: "api_key_cost_ranking_today",
    title: "Today's API Key Cost Ranking",
    summary: "Rank API keys by today's requests or spend with names attached.",
    intent_aliases: [
      "today api key usage ranking",
      "api key cost ranking today",
      "highest cost keys today",
      "今日 key 用量排行",
      "今天所有 api key 用量"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["api_key_id", "name", "user_id", "total_requests", "total_cost"],
    preferred_endpoints: [
      endpoint("usage", "action", "search_api_keys"),
      endpoint("dashboard", "action", "api_keys_usage")
    ],
    fallback_endpoints: [
      endpoint("usage", "action", "stats")
    ],
    avoid_patterns: [
      "Do not loop usage.stats(api_key_id) when dashboard.api_keys_usage is sufficient for the requested output."
    ],
    workflow: [
      step(
        "List API keys",
        "sub2api_admin_action",
        { resource: "usage", action: "search_api_keys" },
        "Get API key ids and display names."
      ),
      step(
        "Batch usage by key",
        "sub2api_admin_action",
        { resource: "dashboard", action: "api_keys_usage", body: { api_key_ids: ["<api key ids from previous step>"] } },
        "Fetch today and total spend for all keys in one request."
      )
    ]
  },
  {
    id: "group_usage_overview",
    title: "Group Usage Overview",
    summary: "Summarize group-level cost or today usage without drilling into each group one by one.",
    intent_aliases: [
      "group usage overview",
      "group spend overview",
      "group usage report",
      "分组使用情况",
      "分组用量",
      "分组消费"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["group_id", "today_cost", "request_count"],
    preferred_endpoints: [
      endpoint("groups", "action", "usage_summary")
    ],
    workflow: [
      step(
        "Group usage summary",
        "sub2api_admin_action",
        { resource: "groups", action: "usage_summary", query: { timezone: "<IANA timezone>" } },
        "Fetch group-level usage in one request."
      )
    ]
  },
  {
    id: "user_spending_overview",
    title: "User Spending Overview",
    summary: "Find top-spending users or summarize user usage over a date range.",
    intent_aliases: [
      "user spending ranking",
      "users usage report",
      "top spending users",
      "用户消费排行",
      "用户用量报表"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["user_id", "email", "cost"],
    preferred_endpoints: [
      endpoint("dashboard", "action", "users_ranking"),
      endpoint("dashboard", "action", "users_usage")
    ],
    fallback_endpoints: [
      endpoint("users", "action", "usage"),
      endpoint("usage", "action", "stats")
    ],
    workflow: [
      step(
        "Rank users",
        "sub2api_admin_action",
        { resource: "dashboard", action: "users_ranking", query: { start_date: "<YYYY-MM-DD>", end_date: "<YYYY-MM-DD>" } },
        "Use when the user wants a top-spenders style report."
      ),
      step(
        "Batch specific users",
        "sub2api_admin_action",
        { resource: "dashboard", action: "users_usage", body: { user_ids: ["<user ids>"] } },
        "Use when the user gives a concrete user subset."
      )
    ]
  },
  {
    id: "account_inventory_overview",
    title: "Account Inventory Overview",
    summary: "List upstream accounts with status and lightweight metadata before any deeper drilldown.",
    intent_aliases: [
      "account inventory",
      "account status overview",
      "which accounts do we have",
      "账号情况",
      "账号状态",
      "账号列表"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["account_id", "name", "platform", "type", "status"],
    preferred_endpoints: [
      endpoint("accounts", "operation", "list"),
      endpoint("ops", "action", "account_availability")
    ],
    avoid_patterns: [
      "Do not start with dashboard or usage aggregates when the user asks for account inventory or status rather than spend."
    ],
    workflow: [
      step(
        "List accounts",
        "sub2api_admin_list",
        { resource: "accounts", query: { page: 1, page_size: 100, lite: "true" } },
        "Get account ids, names, platform, and status with a lighter payload."
      ),
      step(
        "Availability overlay",
        "sub2api_admin_action",
        { resource: "ops", action: "account_availability" },
        "Add schedulability or availability context when the user asks which accounts are healthy or usable.",
        { optional: true }
      )
    ]
  },
  {
    id: "group_capacity_overview",
    title: "Group Capacity Overview",
    summary: "Check which groups are near concurrency, session, or RPM limits.",
    intent_aliases: [
      "group capacity",
      "which groups are full",
      "group concurrency usage",
      "分组容量",
      "分组并发情况"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["group_id", "concurrency_used", "concurrency_max", "sessions_used", "rpm_used"],
    preferred_endpoints: [
      endpoint("groups", "action", "capacity_summary")
    ],
    workflow: [
      step(
        "Capacity summary",
        "sub2api_admin_action",
        { resource: "groups", action: "capacity_summary" },
        "Fetch all group capacity metrics in one request."
      )
    ]
  },
  {
    id: "ops_health_overview",
    title: "Ops Health Overview",
    summary: "Check current request concurrency, traffic, account availability, and system-level health.",
    intent_aliases: [
      "system health overview",
      "ops dashboard overview",
      "realtime health check",
      "运行状态概览",
      "系统健康检查"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["traffic", "concurrency", "availability"],
    preferred_endpoints: [
      endpoint("ops", "action", "realtime_traffic"),
      endpoint("ops", "action", "concurrency"),
      endpoint("ops", "action", "account_availability"),
      endpoint("ops", "action", "dashboard_overview")
    ],
    workflow: [
      step(
        "Dashboard overview",
        "sub2api_admin_action",
        { resource: "ops", action: "dashboard_overview" },
        "Get a broad ops summary if available."
      ),
      step(
        "Realtime traffic",
        "sub2api_admin_action",
        { resource: "ops", action: "realtime_traffic" },
        "Use for current traffic rates."
      ),
      step(
        "Account availability",
        "sub2api_admin_action",
        { resource: "ops", action: "account_availability" },
        "Use when the user specifically asks which accounts are schedulable or unavailable."
      )
    ]
  },
  {
    id: "request_error_triage",
    title: "Request Error Triage",
    summary: "Inspect recent request failures, upstream errors, and related alert signals without mutating anything.",
    intent_aliases: [
      "request error triage",
      "recent request failures",
      "upstream errors overview",
      "报错情况",
      "请求错误",
      "失败请求",
      "上游错误"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["request_error_id", "status", "upstream_error_count"],
    preferred_endpoints: [
      endpoint("ops", "action", "list_request_errors"),
      endpoint("ops", "action", "list_upstream_errors"),
      endpoint("ops", "action", "list_alert_events")
    ],
    fallback_endpoints: [
      endpoint("ops", "action", "get_request_error"),
      endpoint("ops", "action", "list_request_error_upstream_errors")
    ],
    avoid_patterns: [
      "Do not start with retry or resolve actions during read-only triage.",
      "Do not jump to system logs first when the user explicitly asks about request or upstream errors."
    ],
    workflow: [
      step(
        "List request errors",
        "sub2api_admin_action",
        { resource: "ops", action: "list_request_errors" },
        "Start from the request-error queue for user-visible failures."
      ),
      step(
        "List upstream errors",
        "sub2api_admin_action",
        { resource: "ops", action: "list_upstream_errors" },
        "Correlate upstream-side failures that may explain request errors."
      ),
      step(
        "Inspect one request error",
        "sub2api_admin_action",
        { resource: "ops", action: "get_request_error", id: "<request error id>" },
        "Drill into one failing request only after locating the relevant id.",
        { optional: true }
      )
    ]
  },
  {
    id: "proxy_health_overview",
    title: "Proxy Health Overview",
    summary: "Review proxy inventory and counts first, then test only the suspicious proxies.",
    intent_aliases: [
      "proxy health overview",
      "proxy status report",
      "which proxies are bad",
      "代理情况",
      "代理状态",
      "代理健康"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["proxy_id", "name", "status", "account_count"],
    preferred_endpoints: [
      endpoint("proxies", "action", "get_all"),
      endpoint("proxies", "action", "stats")
    ],
    avoid_patterns: [
      "Do not export or import proxies when the user only wants health or inventory."
    ],
    workflow: [
      step(
        "List proxies with counts",
        "sub2api_admin_action",
        { resource: "proxies", action: "get_all", query: { with_count: "true" } },
        "Get the proxy fleet and attached account counts in one read call."
      ),
      step(
        "Inspect one proxy stats",
        "sub2api_admin_action",
        { resource: "proxies", action: "stats", id: "<proxy id>" },
        "Drill into one suspicious proxy after identifying it from the overview.",
        { optional: true }
      )
    ]
  },
  {
    id: "backup_health_check",
    title: "Backup Health Check",
    summary: "Review backup agent health, recent jobs, and storage configuration state.",
    intent_aliases: [
      "backup health",
      "are backups working",
      "recent backup jobs",
      "备份健康检查",
      "最近备份情况"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["job_id", "status", "started_at", "finished_at"],
    preferred_endpoints: [
      endpoint("data_management", "action", "agent_health"),
      endpoint("data_management", "action", "list_backup_jobs"),
      endpoint("backups", "action", "list_backups")
    ],
    workflow: [
      step(
        "Backup agent health",
        "sub2api_admin_action",
        { resource: "data_management", action: "agent_health" },
        "Check whether the backup agent is healthy."
      ),
      step(
        "List recent backup jobs",
        "sub2api_admin_action",
        { resource: "data_management", action: "list_backup_jobs", query: { page_size: 20 } },
        "Review the latest backup jobs."
      )
    ]
  },
  {
    id: "account_error_triage",
    title: "Account Error And Rate Limit Triage",
    summary: "Locate accounts with errors, rate limits, or temporary unschedulable state.",
    intent_aliases: [
      "which accounts have errors",
      "rate limited accounts",
      "unschedulable accounts",
      "which accounts are rate limited",
      "账号限流情况",
      "账号报错情况",
      "限流账号"
    ],
    read_only: true,
    avoids_n_plus_one: false,
    output_shape: ["account_id", "status", "error", "rate_limit"],
    preferred_endpoints: [
      endpoint("accounts", "operation", "list"),
      endpoint("ops", "action", "account_availability")
    ],
    fallback_endpoints: [
      endpoint("accounts", "action", "get_temp_unschedulable")
    ],
    workflow: [
      step(
        "List accounts",
        "sub2api_admin_list",
        { resource: "accounts", query: { page: 1, page_size: 100, lite: "true" } },
        "Inspect statuses, rate limit flags, and account-level state."
      ),
      step(
        "Availability summary",
        "sub2api_admin_action",
        { resource: "ops", action: "account_availability" },
        "Correlate schedulability and availability at the fleet level."
      )
    ]
  },
  {
    id: "subscription_status_overview",
    title: "Subscription Status Overview",
    summary: "Inspect subscription inventory and status before touching assignment or quota actions.",
    intent_aliases: [
      "subscription status overview",
      "subscription inventory",
      "which subscriptions are active",
      "订阅情况",
      "订阅状态",
      "订阅列表"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["subscription_id", "user_id", "group_id", "status"],
    preferred_endpoints: [
      endpoint("subscriptions", "operation", "list"),
      endpoint("subscriptions", "action", "list_by_user"),
      endpoint("subscriptions", "action", "list_by_group")
    ],
    avoid_patterns: [
      "Do not use assign, extend, or reset_quota when the task is only inspection."
    ],
    workflow: [
      step(
        "List subscriptions",
        "sub2api_admin_list",
        { resource: "subscriptions", query: { page: 1, page_size: 100, sort_order: "desc" } },
        "Get the subscription inventory with status filters when needed."
      ),
      step(
        "List one user's subscriptions",
        "sub2api_admin_action",
        { resource: "subscriptions", action: "list_by_user", id: "<user id>", query: { page: 1, page_size: 50 } },
        "Use when the user asks about a specific user.",
        { optional: true }
      ),
      step(
        "List one group's subscriptions",
        "sub2api_admin_action",
        { resource: "subscriptions", action: "list_by_group", id: "<group id>", query: { page: 1, page_size: 50 } },
        "Use when the user asks about a specific group.",
        { optional: true }
      )
    ]
  },
  {
    id: "filtered_account_export",
    title: "Filtered Account Export",
    summary: "Export accounts by ids or filters without guessing export query fields.",
    intent_aliases: [
      "export accounts",
      "download account data",
      "导出账号",
      "账号导出"
    ],
    read_only: true,
    avoids_n_plus_one: true,
    output_shape: ["accounts", "proxies"],
    preferred_endpoints: [
      endpoint("accounts", "action", "export_data")
    ],
    workflow: [
      step(
        "Export account data",
        "sub2api_admin_action",
        { resource: "accounts", action: "export_data", query: { ids: "<comma-separated ids or filters>" } },
        "Use ids or filters to export the needed account payload."
      )
    ]
  },
  {
    id: "refresh_oauth_accounts",
    title: "Refresh OAuth Accounts",
    summary: "Refresh one or many upstream OAuth-backed accounts with the least number of calls.",
    intent_aliases: [
      "refresh oauth accounts",
      "refresh account tokens",
      "批量刷新账号",
      "刷新 oauth 账号"
    ],
    read_only: false,
    avoids_n_plus_one: true,
    output_shape: ["account_id", "success", "error"],
    preferred_endpoints: [
      endpoint("accounts", "action", "batch_refresh"),
      endpoint("accounts", "action", "refresh")
    ],
    workflow: [
      step(
        "Batch refresh accounts",
        "sub2api_admin_action",
        { resource: "accounts", action: "batch_refresh", body: { account_ids: ["<account ids>"] } },
        "Refresh many accounts in one mutation."
      ),
      step(
        "Single account refresh",
        "sub2api_admin_action",
        { resource: "accounts", action: "refresh", id: "<account id>" },
        "Use only for one-off account refreshes.",
        { optional: true }
      )
    ]
  }
]

export function listTaskRecipes() {
  return taskRecipes.slice()
}

export function getTaskRecipesForResource(resourceName) {
  return taskRecipes.filter((recipe) =>
    [...(recipe.preferred_endpoints || []), ...(recipe.fallback_endpoints || [])]
      .some((entry) => entry.resource === resourceName)
  )
}
