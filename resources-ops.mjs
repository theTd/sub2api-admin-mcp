export const opsResources = {
  ops: {
    description: "Admin non-streaming operations monitoring, alerting, error handling, request drilldown, and runtime config.",
    actions: {
      concurrency: { method: "GET", path: "/api/v1/admin/ops/concurrency", description: "Get realtime concurrency stats." },
      user_concurrency: { method: "GET", path: "/api/v1/admin/ops/user-concurrency", description: "Get per-user concurrency stats." },
      account_availability: { method: "GET", path: "/api/v1/admin/ops/account-availability", description: "Get account availability stats." },
      realtime_traffic: { method: "GET", path: "/api/v1/admin/ops/realtime-traffic", description: "Get realtime traffic summary." },
      list_alert_rules: { method: "GET", path: "/api/v1/admin/ops/alert-rules", description: "List alert rules." },
      create_alert_rule: { method: "POST", path: "/api/v1/admin/ops/alert-rules", description: "Create an alert rule." },
      update_alert_rule: { method: "PUT", path: "/api/v1/admin/ops/alert-rules/:id", description: "Update an alert rule." },
      delete_alert_rule: { method: "DELETE", path: "/api/v1/admin/ops/alert-rules/:id", description: "Delete an alert rule." },
      list_alert_events: { method: "GET", path: "/api/v1/admin/ops/alert-events", description: "List alert events." },
      get_alert_event: { method: "GET", path: "/api/v1/admin/ops/alert-events/:id", description: "Get a single alert event." },
      update_alert_event_status: { method: "PUT", path: "/api/v1/admin/ops/alert-events/:id/status", description: "Update alert event status." },
      create_alert_silence: { method: "POST", path: "/api/v1/admin/ops/alert-silences", description: "Create an alert silence." },
      get_email_notification_config: { method: "GET", path: "/api/v1/admin/ops/email-notification/config", description: "Get email notification config." },
      update_email_notification_config: { method: "PUT", path: "/api/v1/admin/ops/email-notification/config", description: "Update email notification config." },
      get_runtime_alert: { method: "GET", path: "/api/v1/admin/ops/runtime/alert", description: "Get runtime alert settings." },
      update_runtime_alert: { method: "PUT", path: "/api/v1/admin/ops/runtime/alert", description: "Update runtime alert settings." },
      get_runtime_logging: { method: "GET", path: "/api/v1/admin/ops/runtime/logging", description: "Get runtime logging config." },
      update_runtime_logging: { method: "PUT", path: "/api/v1/admin/ops/runtime/logging", description: "Update runtime logging config." },
      reset_runtime_logging: { method: "POST", path: "/api/v1/admin/ops/runtime/logging/reset", description: "Reset runtime logging config." },
      get_advanced_settings: { method: "GET", path: "/api/v1/admin/ops/advanced-settings", description: "Get advanced ops settings." },
      update_advanced_settings: { method: "PUT", path: "/api/v1/admin/ops/advanced-settings", description: "Update advanced ops settings." },
      get_metric_thresholds: { method: "GET", path: "/api/v1/admin/ops/settings/metric-thresholds", description: "Get metric thresholds." },
      update_metric_thresholds: { method: "PUT", path: "/api/v1/admin/ops/settings/metric-thresholds", description: "Update metric thresholds." },
      list_errors: { method: "GET", path: "/api/v1/admin/ops/errors", description: "List legacy error logs." },
      get_error: { method: "GET", path: "/api/v1/admin/ops/errors/:id", description: "Get a legacy error log." },
      list_error_retries: { method: "GET", path: "/api/v1/admin/ops/errors/:id/retries", description: "List retry attempts for a legacy error log." },
      retry_error: { method: "POST", path: "/api/v1/admin/ops/errors/:id/retry", description: "Retry a legacy error log request." },
      resolve_error: { method: "PUT", path: "/api/v1/admin/ops/errors/:id/resolve", description: "Resolve a legacy error log." },
      list_request_errors: { method: "GET", path: "/api/v1/admin/ops/request-errors", description: "List request errors." },
      get_request_error: { method: "GET", path: "/api/v1/admin/ops/request-errors/:id", description: "Get a request error." },
      list_request_error_upstream_errors: { method: "GET", path: "/api/v1/admin/ops/request-errors/:id/upstream-errors", description: "List upstream errors linked to a request error." },
      retry_request_error_client: { method: "POST", path: "/api/v1/admin/ops/request-errors/:id/retry-client", description: "Retry a request error from the client side." },
      retry_request_error_upstream_event: { method: "POST", path: "/api/v1/admin/ops/request-errors/:id/upstream-errors/:idx/retry", description: "Retry a single upstream event for a request error." },
      resolve_request_error: { method: "PUT", path: "/api/v1/admin/ops/request-errors/:id/resolve", description: "Resolve a request error." },
      list_upstream_errors: { method: "GET", path: "/api/v1/admin/ops/upstream-errors", description: "List upstream errors." },
      get_upstream_error: { method: "GET", path: "/api/v1/admin/ops/upstream-errors/:id", description: "Get an upstream error." },
      retry_upstream_error: { method: "POST", path: "/api/v1/admin/ops/upstream-errors/:id/retry", description: "Retry an upstream error." },
      resolve_upstream_error: { method: "PUT", path: "/api/v1/admin/ops/upstream-errors/:id/resolve", description: "Resolve an upstream error." },
      list_requests: { method: "GET", path: "/api/v1/admin/ops/requests", description: "List request drilldown records." },
      list_system_logs: { method: "GET", path: "/api/v1/admin/ops/system-logs", description: "List indexed system logs." },
      cleanup_system_logs: { method: "POST", path: "/api/v1/admin/ops/system-logs/cleanup", description: "Start system log cleanup." },
      system_log_health: { method: "GET", path: "/api/v1/admin/ops/system-logs/health", description: "Get system log ingestion health." },
      dashboard_snapshot_v2: { method: "GET", path: "/api/v1/admin/ops/dashboard/snapshot-v2", description: "Get ops dashboard snapshot v2." },
      dashboard_overview: { method: "GET", path: "/api/v1/admin/ops/dashboard/overview", description: "Get ops dashboard overview." },
      dashboard_throughput_trend: { method: "GET", path: "/api/v1/admin/ops/dashboard/throughput-trend", description: "Get ops dashboard throughput trend." },
      dashboard_latency_histogram: { method: "GET", path: "/api/v1/admin/ops/dashboard/latency-histogram", description: "Get ops dashboard latency histogram." },
      dashboard_error_trend: { method: "GET", path: "/api/v1/admin/ops/dashboard/error-trend", description: "Get ops dashboard error trend." },
      dashboard_error_distribution: { method: "GET", path: "/api/v1/admin/ops/dashboard/error-distribution", description: "Get ops dashboard error distribution." },
      dashboard_openai_token_stats: { method: "GET", path: "/api/v1/admin/ops/dashboard/openai-token-stats", description: "Get ops dashboard OpenAI token stats." }
    }
  },
  openai_oauth: {
    description: "Admin OpenAI OAuth helper endpoints.",
    actions: {
      generate_auth_url: { method: "POST", path: "/api/v1/admin/openai/generate-auth-url", description: "Generate an OpenAI OAuth URL." },
      exchange_code: { method: "POST", path: "/api/v1/admin/openai/exchange-code", description: "Exchange an OpenAI OAuth code." },
      refresh_token: { method: "POST", path: "/api/v1/admin/openai/refresh-token", description: "Refresh an OpenAI OAuth token." },
      refresh_account_token: { method: "POST", path: "/api/v1/admin/openai/accounts/:id/refresh", description: "Refresh OAuth tokens for an account." },
      create_from_oauth: { method: "POST", path: "/api/v1/admin/openai/create-from-oauth", description: "Create an account from OpenAI OAuth data." }
    }
  },
  sora_oauth: {
    description: "Admin Sora OAuth helper endpoints.",
    actions: {
      generate_auth_url: { method: "POST", path: "/api/v1/admin/sora/generate-auth-url", description: "Generate a Sora OAuth URL." },
      exchange_code: { method: "POST", path: "/api/v1/admin/sora/exchange-code", description: "Exchange a Sora OAuth code." },
      refresh_token: { method: "POST", path: "/api/v1/admin/sora/refresh-token", description: "Refresh a Sora OAuth token." },
      st2at: { method: "POST", path: "/api/v1/admin/sora/st2at", description: "Exchange a Sora session token." },
      rt2at: { method: "POST", path: "/api/v1/admin/sora/rt2at", description: "Refresh a Sora access token." },
      refresh_account_token: { method: "POST", path: "/api/v1/admin/sora/accounts/:id/refresh", description: "Refresh Sora tokens for an account." },
      create_from_oauth: { method: "POST", path: "/api/v1/admin/sora/create-from-oauth", description: "Create an account from Sora OAuth data." }
    }
  },
  gemini_oauth: {
    description: "Admin Gemini OAuth helper endpoints.",
    actions: {
      auth_url: { method: "POST", path: "/api/v1/admin/gemini/oauth/auth-url", description: "Generate a Gemini OAuth URL." },
      exchange_code: { method: "POST", path: "/api/v1/admin/gemini/oauth/exchange-code", description: "Exchange a Gemini OAuth code." },
      capabilities: { method: "GET", path: "/api/v1/admin/gemini/oauth/capabilities", description: "Get Gemini OAuth capabilities." }
    }
  },
  antigravity_oauth: {
    description: "Admin Antigravity OAuth helper endpoints.",
    actions: {
      auth_url: { method: "POST", path: "/api/v1/admin/antigravity/oauth/auth-url", description: "Generate an Antigravity OAuth URL." },
      exchange_code: { method: "POST", path: "/api/v1/admin/antigravity/oauth/exchange-code", description: "Exchange an Antigravity OAuth code." },
      refresh_token: { method: "POST", path: "/api/v1/admin/antigravity/oauth/refresh-token", description: "Refresh an Antigravity OAuth token." }
    }
  }
}
