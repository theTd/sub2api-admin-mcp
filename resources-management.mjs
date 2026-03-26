export const managementResources = {
  proxies: {
    description: "Admin proxy management, proxy tests, and proxy imports or exports.",
    list: { method: "GET", path: "/api/v1/admin/proxies" },
    get: { method: "GET", path: "/api/v1/admin/proxies/:id" },
    create: { method: "POST", path: "/api/v1/admin/proxies" },
    update: { method: "PUT", path: "/api/v1/admin/proxies/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/proxies/:id" },
    actions: {
      get_all: { method: "GET", path: "/api/v1/admin/proxies/all", description: "List all proxies without pagination." },
      export_data: { method: "GET", path: "/api/v1/admin/proxies/data", description: "Export proxy data." },
      import_data: { method: "POST", path: "/api/v1/admin/proxies/data", description: "Import proxy data." },
      test: { method: "POST", path: "/api/v1/admin/proxies/:id/test", description: "Test a proxy." },
      quality_check: { method: "POST", path: "/api/v1/admin/proxies/:id/quality-check", description: "Run a quality check for a proxy." },
      stats: { method: "GET", path: "/api/v1/admin/proxies/:id/stats", description: "Get proxy statistics." },
      accounts: { method: "GET", path: "/api/v1/admin/proxies/:id/accounts", description: "List accounts assigned to a proxy." },
      batch_delete: { method: "POST", path: "/api/v1/admin/proxies/batch-delete", description: "Delete multiple proxies." },
      batch_create: { method: "POST", path: "/api/v1/admin/proxies/batch", description: "Create multiple proxies." }
    }
  },
  redeem_codes: {
    description: "Admin redeem code generation, deletion, export, and expiration controls.",
    list: { method: "GET", path: "/api/v1/admin/redeem-codes" },
    get: { method: "GET", path: "/api/v1/admin/redeem-codes/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/redeem-codes/:id" },
    actions: {
      stats: { method: "GET", path: "/api/v1/admin/redeem-codes/stats", description: "Get redeem code statistics." },
      export: { method: "GET", path: "/api/v1/admin/redeem-codes/export", description: "Export redeem codes." },
      create_and_redeem: { method: "POST", path: "/api/v1/admin/redeem-codes/create-and-redeem", description: "Create a code and immediately redeem it." },
      generate: { method: "POST", path: "/api/v1/admin/redeem-codes/generate", description: "Generate redeem codes." },
      batch_delete: { method: "POST", path: "/api/v1/admin/redeem-codes/batch-delete", description: "Delete multiple redeem codes." },
      expire: { method: "POST", path: "/api/v1/admin/redeem-codes/:id/expire", description: "Expire a redeem code immediately." }
    }
  },
  promo_codes: {
    description: "Admin promo code CRUD and usage inspection.",
    list: { method: "GET", path: "/api/v1/admin/promo-codes" },
    get: { method: "GET", path: "/api/v1/admin/promo-codes/:id" },
    create: { method: "POST", path: "/api/v1/admin/promo-codes" },
    update: { method: "PUT", path: "/api/v1/admin/promo-codes/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/promo-codes/:id" },
    actions: {
      usages: { method: "GET", path: "/api/v1/admin/promo-codes/:id/usages", description: "List usages for a promo code." }
    }
  },
  subscriptions: {
    description: "Admin subscription assignment, extension, quota reset, and read APIs.",
    list: { method: "GET", path: "/api/v1/admin/subscriptions" },
    get: { method: "GET", path: "/api/v1/admin/subscriptions/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/subscriptions/:id" },
    actions: {
      progress: { method: "GET", path: "/api/v1/admin/subscriptions/:id/progress", description: "Get subscription progress." },
      assign: { method: "POST", path: "/api/v1/admin/subscriptions/assign", description: "Assign a subscription." },
      bulk_assign: { method: "POST", path: "/api/v1/admin/subscriptions/bulk-assign", description: "Assign subscriptions in bulk." },
      extend: { method: "POST", path: "/api/v1/admin/subscriptions/:id/extend", description: "Extend a subscription." },
      reset_quota: { method: "POST", path: "/api/v1/admin/subscriptions/:id/reset-quota", description: "Reset subscription quota." },
      list_by_group: { method: "GET", path: "/api/v1/admin/groups/:id/subscriptions", description: "List subscriptions by group." },
      list_by_user: { method: "GET", path: "/api/v1/admin/users/:id/subscriptions", description: "List subscriptions by user." }
    }
  },
  usage: {
    description: "Admin usage list, search helpers, statistics, and cleanup tasks.",
    list: { method: "GET", path: "/api/v1/admin/usage" },
    actions: {
      stats: { method: "GET", path: "/api/v1/admin/usage/stats", description: "Get usage statistics." },
      search_users: { method: "GET", path: "/api/v1/admin/usage/search-users", description: "Search users for usage filters." },
      search_api_keys: { method: "GET", path: "/api/v1/admin/usage/search-api-keys", description: "Search API keys for usage filters." },
      list_cleanup_tasks: { method: "GET", path: "/api/v1/admin/usage/cleanup-tasks", description: "List usage cleanup tasks." },
      create_cleanup_task: { method: "POST", path: "/api/v1/admin/usage/cleanup-tasks", description: "Create a usage cleanup task." },
      cancel_cleanup_task: { method: "POST", path: "/api/v1/admin/usage/cleanup-tasks/:id/cancel", description: "Cancel a usage cleanup task." }
    }
  },
  user_attributes: {
    description: "Admin custom user attribute definition management and batched attribute reads.",
    list: { method: "GET", path: "/api/v1/admin/user-attributes" },
    create: { method: "POST", path: "/api/v1/admin/user-attributes" },
    update: { method: "PUT", path: "/api/v1/admin/user-attributes/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/user-attributes/:id" },
    actions: {
      batch_get_user_attributes: { method: "POST", path: "/api/v1/admin/user-attributes/batch", description: "Get user attributes in batch." },
      reorder: { method: "PUT", path: "/api/v1/admin/user-attributes/reorder", description: "Reorder user attribute definitions." }
    }
  },
  error_passthrough_rules: {
    description: "Admin error passthrough rule CRUD.",
    list: { method: "GET", path: "/api/v1/admin/error-passthrough-rules" },
    get: { method: "GET", path: "/api/v1/admin/error-passthrough-rules/:id" },
    create: { method: "POST", path: "/api/v1/admin/error-passthrough-rules" },
    update: { method: "PUT", path: "/api/v1/admin/error-passthrough-rules/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/error-passthrough-rules/:id" }
  },
  api_keys: {
    description: "Admin API key maintenance for routes exposed under the admin namespace.",
    update: { method: "PUT", path: "/api/v1/admin/api-keys/:id" }
  },
  scheduled_test_plans: {
    description: "Admin scheduled test plan creation, update, deletion, and results listing.",
    create: { method: "POST", path: "/api/v1/admin/scheduled-test-plans" },
    update: { method: "PUT", path: "/api/v1/admin/scheduled-test-plans/:id" },
    delete: { method: "DELETE", path: "/api/v1/admin/scheduled-test-plans/:id" },
    actions: {
      results: { method: "GET", path: "/api/v1/admin/scheduled-test-plans/:id/results", description: "List results for a scheduled test plan." },
      list_by_account: { method: "GET", path: "/api/v1/admin/accounts/:id/scheduled-test-plans", description: "List scheduled test plans for an account." }
    }
  }
}
