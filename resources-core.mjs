export const coreResources = {
  dashboard: {
    description: "Admin dashboard snapshots, rankings, trends, and aggregate metrics.",
    actions: {
      snapshot_v2: { method: "GET", path: "/api/v1/admin/dashboard/snapshot-v2", description: "Get the dashboard snapshot v2 payload." },
      stats: { method: "GET", path: "/api/v1/admin/dashboard/stats", description: "Get top-level dashboard statistics." },
      realtime: { method: "GET", path: "/api/v1/admin/dashboard/realtime", description: "Get realtime dashboard metrics." },
      trend: { method: "GET", path: "/api/v1/admin/dashboard/trend", description: "Get dashboard usage trend data." },
      models: { method: "GET", path: "/api/v1/admin/dashboard/models", description: "Get dashboard model statistics." },
      groups: { method: "GET", path: "/api/v1/admin/dashboard/groups", description: "Get dashboard group statistics." },
      api_keys_trend: { method: "GET", path: "/api/v1/admin/dashboard/api-keys-trend", description: "Get API key usage trend data." },
      users_trend: { method: "GET", path: "/api/v1/admin/dashboard/users-trend", description: "Get user usage trend data." },
      users_ranking: { method: "GET", path: "/api/v1/admin/dashboard/users-ranking", description: "Get user spending ranking data." },
      user_breakdown: { method: "GET", path: "/api/v1/admin/dashboard/user-breakdown", description: "Get dashboard user breakdown data." },
      users_usage: { method: "POST", path: "/api/v1/admin/dashboard/users-usage", description: "Get batched usage for multiple users." },
      api_keys_usage: { method: "POST", path: "/api/v1/admin/dashboard/api-keys-usage", description: "Get batched usage for multiple API keys." },
      aggregation_backfill: { method: "POST", path: "/api/v1/admin/dashboard/aggregation/backfill", description: "Trigger dashboard aggregation backfill." }
    }
  },
  users: {
    description: "Admin user management, including balances, API keys, usage, and attribute values.",
    list: { method: "GET", path: "/api/v1/admin/users" },
    get: { method: "GET", path: "/api/v1/admin/users/:id" },
    create: { method: "POST", path: "/api/v1/admin/users" },
    update: { method: "PUT", path: "/api/v1/admin/users/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/users/:id" },
    actions: {
      update_balance: { method: "POST", path: "/api/v1/admin/users/:id/balance", description: "Adjust a user's balance." },
      api_keys: { method: "GET", path: "/api/v1/admin/users/:id/api-keys", description: "List API keys that belong to a user." },
      usage: { method: "GET", path: "/api/v1/admin/users/:id/usage", description: "Get usage data for a user." },
      balance_history: { method: "GET", path: "/api/v1/admin/users/:id/balance-history", description: "Get the balance and concurrency history for a user." },
      replace_group: { method: "POST", path: "/api/v1/admin/users/:id/replace-group", description: "Replace a user's exclusive group assignment." },
      subscriptions: { method: "GET", path: "/api/v1/admin/users/:id/subscriptions", description: "List subscriptions for a user." },
      get_attributes: { method: "GET", path: "/api/v1/admin/users/:id/attributes", description: "Get custom attribute values for a user." },
      update_attributes: { method: "PUT", path: "/api/v1/admin/users/:id/attributes", description: "Update custom attribute values for a user." }
    }
  },
  groups: {
    description: "Admin API key groups and group-level scheduling or pricing settings.",
    list: { method: "GET", path: "/api/v1/admin/groups" },
    get: { method: "GET", path: "/api/v1/admin/groups/:id" },
    create: { method: "POST", path: "/api/v1/admin/groups" },
    update: { method: "PUT", path: "/api/v1/admin/groups/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/groups/:id" },
    actions: {
      get_all: { method: "GET", path: "/api/v1/admin/groups/all", description: "List all active groups without pagination." },
      usage_summary: { method: "GET", path: "/api/v1/admin/groups/usage-summary", description: "Get usage summary for all groups." },
      capacity_summary: { method: "GET", path: "/api/v1/admin/groups/capacity-summary", description: "Get capacity summary for all groups." },
      update_sort_order: { method: "PUT", path: "/api/v1/admin/groups/sort-order", description: "Update group sort orders in bulk." },
      stats: { method: "GET", path: "/api/v1/admin/groups/:id/stats", description: "Get statistics for a group." },
      rate_multipliers: { method: "GET", path: "/api/v1/admin/groups/:id/rate-multipliers", description: "Get per-user rate multipliers for a group." },
      batch_set_rate_multipliers: { method: "PUT", path: "/api/v1/admin/groups/:id/rate-multipliers", description: "Set per-user rate multipliers for a group." },
      clear_rate_multipliers: { method: "DELETE", path: "/api/v1/admin/groups/:id/rate-multipliers", description: "Clear all per-user rate multipliers for a group." },
      api_keys: { method: "GET", path: "/api/v1/admin/groups/:id/api-keys", description: "List API keys in a group." },
      subscriptions: { method: "GET", path: "/api/v1/admin/groups/:id/subscriptions", description: "List subscriptions for a group." }
    }
  },
  accounts: {
    description: "Admin upstream account management for OpenAI, Claude, Gemini, Sora, and related providers.",
    list: { method: "GET", path: "/api/v1/admin/accounts" },
    get: { method: "GET", path: "/api/v1/admin/accounts/:id" },
    create: { method: "POST", path: "/api/v1/admin/accounts" },
    update: { method: "PUT", path: "/api/v1/admin/accounts/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/accounts/:id" },
    actions: {
      check_mixed_channel: { method: "POST", path: "/api/v1/admin/accounts/check-mixed-channel", description: "Validate mixed-channel account settings." },
      sync_from_crs: { method: "POST", path: "/api/v1/admin/accounts/sync/crs", description: "Import accounts from CRS." },
      preview_from_crs: { method: "POST", path: "/api/v1/admin/accounts/sync/crs/preview", description: "Preview CRS account sync results." },
      test: { method: "POST", path: "/api/v1/admin/accounts/:id/test", description: "Test an account connection." },
      recover_state: { method: "POST", path: "/api/v1/admin/accounts/:id/recover-state", description: "Recover account state flags." },
      refresh: { method: "POST", path: "/api/v1/admin/accounts/:id/refresh", description: "Refresh an account." },
      set_privacy: { method: "POST", path: "/api/v1/admin/accounts/:id/set-privacy", description: "Update account privacy state." },
      refresh_tier: { method: "POST", path: "/api/v1/admin/accounts/:id/refresh-tier", description: "Refresh account tier metadata." },
      stats: { method: "GET", path: "/api/v1/admin/accounts/:id/stats", description: "Get account statistics." },
      clear_error: { method: "POST", path: "/api/v1/admin/accounts/:id/clear-error", description: "Clear the current account error state." },
      usage: { method: "GET", path: "/api/v1/admin/accounts/:id/usage", description: "Get usage for an account." },
      today_stats: { method: "GET", path: "/api/v1/admin/accounts/:id/today-stats", description: "Get today's usage stats for an account." },
      batch_today_stats: { method: "POST", path: "/api/v1/admin/accounts/today-stats/batch", description: "Get today's stats for multiple accounts." },
      clear_rate_limit: { method: "POST", path: "/api/v1/admin/accounts/:id/clear-rate-limit", description: "Clear rate limiting for an account." },
      reset_quota: { method: "POST", path: "/api/v1/admin/accounts/:id/reset-quota", description: "Reset account quota state." },
      get_temp_unschedulable: { method: "GET", path: "/api/v1/admin/accounts/:id/temp-unschedulable", description: "Get temporary unschedulable state for an account." },
      clear_temp_unschedulable: { method: "DELETE", path: "/api/v1/admin/accounts/:id/temp-unschedulable", description: "Clear temporary unschedulable state for an account." },
      set_schedulable: { method: "POST", path: "/api/v1/admin/accounts/:id/schedulable", description: "Set an account schedulable state." },
      models: { method: "GET", path: "/api/v1/admin/accounts/:id/models", description: "List models available for an account." },
      batch_create: { method: "POST", path: "/api/v1/admin/accounts/batch", description: "Create multiple accounts at once." },
      export_data: { method: "GET", path: "/api/v1/admin/accounts/data", description: "Export account data." },
      import_data: { method: "POST", path: "/api/v1/admin/accounts/data", description: "Import account data." },
      batch_update_credentials: { method: "POST", path: "/api/v1/admin/accounts/batch-update-credentials", description: "Update credentials for multiple accounts." },
      batch_refresh_tier: { method: "POST", path: "/api/v1/admin/accounts/batch-refresh-tier", description: "Refresh tiers for multiple accounts." },
      bulk_update: { method: "POST", path: "/api/v1/admin/accounts/bulk-update", description: "Apply bulk account updates." },
      batch_clear_error: { method: "POST", path: "/api/v1/admin/accounts/batch-clear-error", description: "Clear errors for multiple accounts." },
      batch_refresh: { method: "POST", path: "/api/v1/admin/accounts/batch-refresh", description: "Refresh multiple accounts." },
      antigravity_default_model_mapping: { method: "GET", path: "/api/v1/admin/accounts/antigravity/default-model-mapping", description: "Get Antigravity default model mapping." },
      list_scheduled_test_plans: { method: "GET", path: "/api/v1/admin/accounts/:id/scheduled-test-plans", description: "List scheduled test plans for an account." },
      generate_auth_url: { method: "POST", path: "/api/v1/admin/accounts/generate-auth-url", description: "Generate an OAuth URL for account onboarding." },
      generate_setup_token_url: { method: "POST", path: "/api/v1/admin/accounts/generate-setup-token-url", description: "Generate a setup token OAuth URL." },
      exchange_code: { method: "POST", path: "/api/v1/admin/accounts/exchange-code", description: "Exchange an OAuth code for account credentials." },
      exchange_setup_token_code: { method: "POST", path: "/api/v1/admin/accounts/exchange-setup-token-code", description: "Exchange a setup token code for credentials." },
      cookie_auth: { method: "POST", path: "/api/v1/admin/accounts/cookie-auth", description: "Authenticate an account via cookies." },
      setup_token_cookie_auth: { method: "POST", path: "/api/v1/admin/accounts/setup-token-cookie-auth", description: "Authenticate a setup token flow via cookies." }
    }
  },
  announcements: {
    description: "Admin announcement management and announcement read status inspection.",
    list: { method: "GET", path: "/api/v1/admin/announcements" },
    get: { method: "GET", path: "/api/v1/admin/announcements/:id" },
    create: { method: "POST", path: "/api/v1/admin/announcements" },
    update: { method: "PUT", path: "/api/v1/admin/announcements/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/announcements/:id" },
    actions: {
      read_status: { method: "GET", path: "/api/v1/admin/announcements/:id/read-status", description: "List read status for an announcement." }
    }
  }
}
