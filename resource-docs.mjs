function param(type, description, options = {}) {
  return {
    type,
    description,
    ...options
  }
}

function stringParam(description, options) {
  return param("string", description, options)
}

function integerParam(description, options) {
  return param("integer", description, options)
}

function numberParam(description, options) {
  return param("number", description, options)
}

function booleanParam(description, options) {
  return param("boolean", description, options)
}

function enumParam(values, description, options = {}) {
  return param("enum", description, { ...options, enum: values })
}

function arrayParam(itemType, description, options = {}) {
  return param("array", description, { ...options, items: itemType })
}

function objectParam(description, options = {}) {
  return param("object", description, options)
}

function mergeParams(...groups) {
  return Object.assign({}, ...groups)
}

const paginationQuery = {
  page: integerParam("1-based page number.", { example: 1 }),
  page_size: integerParam("Items per page.", { example: 20 })
}

const usageFilterQuery = {
  user_id: integerParam("Filter by user ID."),
  api_key_id: integerParam("Filter by API key ID."),
  account_id: integerParam("Filter by upstream account ID."),
  group_id: integerParam("Filter by group ID."),
  model: stringParam("Filter by model name."),
  request_type: enumParam(["unknown", "sync", "stream", "ws_v2"], "Filter by request type."),
  stream: booleanParam("Filter by stream mode."),
  billing_type: integerParam("Filter by billing type."),
  start_date: stringParam("Inclusive start date in YYYY-MM-DD.", {
    example: "2026-03-26",
    together_with: ["end_date"]
  }),
  end_date: stringParam("Inclusive end date in YYYY-MM-DD.", {
    example: "2026-03-26",
    together_with: ["start_date"]
  }),
  timezone: stringParam("IANA timezone for date-boundary calculations.", {
    example: "Asia/Shanghai"
  })
}

const sourceRefs = {
  accounts: "frontend/src/api/admin/accounts.ts",
  announcements: "frontend/src/api/admin/announcements.ts",
  backups: "frontend/src/api/admin/backup.ts",
  dashboard: "frontend/src/api/admin/dashboard.ts",
  data_management: "frontend/src/api/admin/dataManagement.ts",
  groups: "frontend/src/api/admin/groups.ts",
  ops: "frontend/src/api/admin/ops.ts",
  promo_codes: "frontend/src/api/admin/promo.ts",
  proxies: "frontend/src/api/admin/proxies.ts",
  redeem_codes: "frontend/src/api/admin/redeem.ts",
  settings: "frontend/src/api/admin/settings.ts",
  subscriptions: "frontend/src/api/admin/subscriptions.ts",
  system: "frontend/src/api/admin/system.ts",
  usage: "frontend/src/api/admin/usage.ts",
  user_attributes: "frontend/src/api/admin/userAttributes.ts",
  users: "frontend/src/api/admin/users.ts"
}

export const GLOBAL_DISCOVERY_TIPS = [
  "Prefer documented query/body keys from describe_resources or find_capability instead of guessing field names.",
  "Use find_capability when you only know an intent, keyword, or output you want.",
  "CRUD operations map to dedicated tools such as sub2api_admin_list or sub2api_admin_get; only non-CRUD endpoints use sub2api_admin_action.",
  "Mutation endpoints are marked as mutating; double-check ids, path_params, and body fields before calling them."
]

export const resourceDocs = {
  dashboard: {
    notes: [
      "Dashboard actions are read-only aggregation endpoints and are usually better than N+1 per-id loops when you need rankings or batch summaries.",
      "For batch user or API key cost snapshots, prefer dashboard.users_usage or dashboard.api_keys_usage over per-record stats loops.",
      "Trend endpoints such as api_keys_trend and users_trend are best for charting or comparisons; use the matching *_usage action when you need a per-entity cost snapshot."
    ],
    actions: {
      snapshot_v2: {
        source: `${sourceRefs.dashboard}#getSnapshotV2`,
        preferred_for: ["dashboard overview", "today summary", "broad aggregate snapshot"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "summary",
        query: {
          strict: true,
          params: mergeParams(usageFilterQuery, {
            granularity: enumParam(["day", "hour"], "Aggregation granularity."),
            include_stats: booleanParam("Include top-level stats block."),
            include_trend: booleanParam("Include trend data."),
            include_model_stats: booleanParam("Include model stats."),
            include_group_stats: booleanParam("Include group stats."),
            include_users_trend: booleanParam("Include users trend block."),
            users_trend_limit: integerParam("Max users in users trend.")
          })
        },
        examples: [
          {
            title: "Dashboard snapshot for today",
            args: {
              query: {
                start_date: "2026-03-26",
                end_date: "2026-03-26",
                include_stats: true,
                include_trend: true
              }
            }
          }
        ]
      },
      trend: {
        source: `${sourceRefs.dashboard}#getUsageTrend`,
        query: {
          strict: true,
          params: mergeParams(usageFilterQuery, {
            granularity: enumParam(["day", "hour"], "Aggregation granularity.")
          })
        }
      },
      models: {
        source: `${sourceRefs.dashboard}#getModelStats`,
        query: {
          strict: true,
          params: mergeParams(usageFilterQuery, {
            model_source: enumParam(["requested", "upstream", "mapping"], "Which model dimension to aggregate on.")
          })
        }
      },
      groups: {
        source: `${sourceRefs.dashboard}#getGroupStats`,
        query: {
          strict: true,
          params: usageFilterQuery
        }
      },
      api_keys_trend: {
        source: `${sourceRefs.dashboard}#getApiKeyUsageTrend`,
        query: {
          strict: true,
          params: mergeParams(usageFilterQuery, {
            granularity: enumParam(["day", "hour"], "Aggregation granularity."),
            limit: integerParam("Maximum number of keys to return.")
          })
        },
        notes: [
          "Use this for API key trend slices and ranking-oriented views.",
          "If you need a reliable per-key cost snapshot, prefer dashboard.api_keys_usage first and fall back to usage.stats(api_key_id, start_date, end_date) only for precise validation."
        ]
      },
      users_trend: {
        source: `${sourceRefs.dashboard}#getUserUsageTrend`,
        query: {
          strict: true,
          params: mergeParams(usageFilterQuery, {
            granularity: enumParam(["day", "hour"], "Aggregation granularity."),
            limit: integerParam("Maximum number of users to return.")
          })
        }
      },
      users_ranking: {
        source: `${sourceRefs.dashboard}#getUserSpendingRanking`,
        query: {
          strict: true,
          params: {
            start_date: stringParam("Inclusive start date in YYYY-MM-DD.", {
              together_with: ["end_date"]
            }),
            end_date: stringParam("Inclusive end date in YYYY-MM-DD.", {
              together_with: ["start_date"]
            }),
            limit: integerParam("Maximum number of users to return.")
          }
        }
      },
      user_breakdown: {
        source: `${sourceRefs.dashboard}#getUserBreakdown`,
        query: {
          strict: true,
          params: {
            start_date: stringParam("Inclusive start date in YYYY-MM-DD.", {
              together_with: ["end_date"]
            }),
            end_date: stringParam("Inclusive end date in YYYY-MM-DD.", {
              together_with: ["start_date"]
            }),
            group_id: integerParam("Filter by group ID."),
            model: stringParam("Filter by model name."),
            model_source: enumParam(["requested", "upstream", "mapping"], "Which model dimension to aggregate on."),
            endpoint: stringParam("Inbound, upstream, or normalized path."),
            endpoint_type: enumParam(["inbound", "upstream", "path"], "Endpoint dimension."),
            limit: integerParam("Maximum users to return.")
          }
        },
        notes: [
          "When debugging an empty result, start with only start_date and end_date, then add group, model, or endpoint filters one at a time.",
          "If the response is still empty, cross-check the same window with dashboard.users_ranking, dashboard.users_usage, or usage.stats before assuming the action is broken."
        ]
      },
      users_usage: {
        source: `${sourceRefs.dashboard}#getBatchUsersUsage`,
        preferred_for: ["batch user usage", "today cost by user", "avoid per-user loops"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "user_id",
        supports_bulk: true,
        avoids_n_plus_one: true,
        body: {
          strict: true,
          params: {
            user_ids: arrayParam("integer", "User IDs to aggregate.", {
              required: true,
              example: [1, 2, 3]
            })
          }
        },
        notes: ["Prefer this over looping users/:id/usage when you only need today/total cost snapshots."]
      },
      api_keys_usage: {
        source: `${sourceRefs.dashboard}#getBatchApiKeysUsage`,
        preferred_for: ["batch api key usage", "today cost by api key", "api key ranking input"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "api_key_id",
        supports_bulk: true,
        avoids_n_plus_one: true,
        body: {
          strict: true,
          params: {
            api_key_ids: arrayParam("integer", "API key IDs to aggregate.", {
              required: true,
              example: [17, 13, 8]
            })
          }
        },
        notes: ["Prefer this over usage.stats N+1 loops when you only need today/total cost by API key."]
      }
    }
  },
  usage: {
    notes: [
      "Both usage.list and usage.stats support date filters. Use start_date plus end_date together.",
      "search_users and search_api_keys are discovery helpers for ids used in usage.list and usage.stats."
    ],
    operations: {
      list: {
        source: `${sourceRefs.usage}#list`,
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: true,
          params: mergeParams(paginationQuery, usageFilterQuery, {
            exact_total: booleanParam("Request an exact total count when the backend supports it.")
          })
        },
        examples: [
          {
            title: "Today's logs for one API key",
            args: {
              query: {
                api_key_id: 17,
                start_date: "2026-03-26",
                end_date: "2026-03-26",
                page: 1,
                page_size: 50
              }
            }
          }
        ]
      }
    },
    actions: {
      stats: {
        source: `${sourceRefs.usage}#getStats`,
        preferred_for: ["single entity usage drilldown", "precise validation", "realtime usage stats"],
        freshness: "realtime",
        consistency_group: "usage_stats_live",
        query: {
          strict: true,
          params: mergeParams(usageFilterQuery, {
            period: stringParam("Backend-defined summary period such as day, week, or month.")
          })
        },
        response_fields: [
          "total_requests",
          "total_tokens",
          "total_cost",
          "total_actual_cost",
          "total_account_cost"
        ],
        examples: [
          {
            title: "Today's spend for one API key",
            args: {
              query: {
                api_key_id: 17,
                start_date: "2026-03-26",
                end_date: "2026-03-26"
              }
            }
          }
        ]
      },
      search_users: {
        source: `${sourceRefs.usage}#searchUsers`,
        query: {
          strict: true,
          params: {
            q: stringParam("Email keyword to search.", { example: "alice@" })
          }
        }
      },
      search_api_keys: {
        source: `${sourceRefs.usage}#searchApiKeys`,
        query: {
          strict: true,
          params: {
            user_id: integerParam("Optional owner user ID."),
            q: stringParam("Optional API key name keyword.")
          }
        }
      },
      list_cleanup_tasks: {
        source: `${sourceRefs.usage}#listCleanupTasks`,
        query: {
          strict: true,
          params: paginationQuery
        }
      },
      create_cleanup_task: {
        source: `${sourceRefs.usage}#createCleanupTask`,
        mutating: true,
        body: {
          strict: true,
          params: {
            start_date: stringParam("Inclusive start date in YYYY-MM-DD.", {
              required: true,
              together_with: ["end_date"]
            }),
            end_date: stringParam("Inclusive end date in YYYY-MM-DD.", {
              required: true,
              together_with: ["start_date"]
            }),
            user_id: integerParam("Optional user filter."),
            api_key_id: integerParam("Optional API key filter."),
            account_id: integerParam("Optional account filter."),
            group_id: integerParam("Optional group filter."),
            model: stringParam("Optional model filter."),
            request_type: enumParam(["unknown", "sync", "stream", "ws_v2"], "Optional request type filter."),
            stream: booleanParam("Optional stream filter."),
            billing_type: integerParam("Optional billing type filter."),
            timezone: stringParam("Timezone used for date boundaries.")
          }
        }
      }
    }
  },
  accounts: {
    notes: [
      "accounts.list uses page plus page_size and common filters like platform, type, status, and search.",
      "Several account actions mutate upstream credentials or runtime state; verify the target account id before calling them."
    ],
    operations: {
      list: {
        source: `${sourceRefs.accounts}#list`,
        preferred_for: ["account inventory", "account lookup", "account id discovery"],
        safe_for_listing: true,
        starter_args: {
          query: {
            page: 1,
            page_size: 100,
            lite: "true"
          }
        },
        response_notes: [
          "When you only need identifiers and status, pass lite=true to reduce payload size.",
          "MCP masks nested credentials in account list/get responses before returning them to the agent.",
          "Account state fields such as rate_limited_at, rate_limit_reset_at, and schedulable are forwarded from the admin API; prefer ops.account_availability when you need a realtime availability or rate-limit judgement."
        ],
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            platform: stringParam("Filter by platform."),
            type: stringParam("Filter by account type."),
            status: stringParam("Filter by account status."),
            group: stringParam("Filter by group identifier or name."),
            search: stringParam("Fuzzy search keyword."),
            privacy_mode: stringParam("Filter by privacy mode."),
            lite: stringParam("Backend-defined lite mode flag.")
          })
        }
      },
      create: {
        source: `${sourceRefs.accounts}#create`,
        mutating: true,
        body: {
          strict: false,
          params: {
            platform: stringParam("Account platform.", { required: true }),
            type: stringParam("Account type.", { required: true }),
            name: stringParam("Display name for the account.")
          }
        },
        notes: ["Account create and update bodies are intentionally left non-strict because their shape varies by provider."]
      },
      update: {
        source: `${sourceRefs.accounts}#update`,
        mutating: true,
        body: {
          strict: false,
          params: {
            status: stringParam("Optional status update."),
            name: stringParam("Optional display name.")
          }
        }
      }
    },
    actions: {
      check_mixed_channel: {
        source: `${sourceRefs.accounts}#checkMixedChannelRisk`,
        body: {
          strict: false,
          params: {
            group_id: integerParam("Target group id."),
            account_ids: arrayParam("integer", "Accounts to validate.")
          }
        }
      },
      sync_from_crs: {
        source: `${sourceRefs.accounts}#syncFromCrs`,
        mutating: true,
        body: {
          strict: true,
          params: {
            base_url: stringParam("CRS base URL.", { required: true }),
            username: stringParam("CRS username.", { required: true }),
            password: stringParam("CRS password.", { required: true }),
            sync_proxies: booleanParam("Whether to sync proxies as well."),
            selected_account_ids: arrayParam("string", "Optional subset of CRS account ids.")
          }
        }
      },
      preview_from_crs: {
        source: `${sourceRefs.accounts}#previewFromCrs`,
        body: {
          strict: true,
          params: {
            base_url: stringParam("CRS base URL.", { required: true }),
            username: stringParam("CRS username.", { required: true }),
            password: stringParam("CRS password.", { required: true })
          }
        }
      },
      stats: {
        source: `${sourceRefs.accounts}#getStats`,
        query: {
          strict: true,
          params: {
            days: integerParam("Number of days to summarize.", { example: 30 })
          }
        }
      },
      usage: {
        source: `${sourceRefs.accounts}#getUsage`,
        preferred_for: ["single account usage window", "account usage source drilldown"],
        query: {
          strict: true,
          params: {
            source: enumParam(["passive", "active"], "Usage data source mode.")
          }
        }
      },
      today_stats: {
        source: `${sourceRefs.accounts}#getTodayStats`,
        preferred_for: ["single account today usage"],
        freshness: "preaggregated_may_lag",
        consistency_group: "account_usage_today",
        returns_breakdown_by: "account_id",
        response_fields: ["requests", "tokens", "cost", "standard_cost", "user_cost"]
      },
      batch_today_stats: {
        source: `${sourceRefs.accounts}#getBatchTodayStats`,
        preferred_for: ["today account usage", "batch account usage", "per-account today report"],
        freshness: "preaggregated_may_lag",
        consistency_group: "account_usage_today",
        returns_breakdown_by: "account_id",
        supports_bulk: true,
        avoids_n_plus_one: true,
        body: {
          strict: true,
          params: {
            account_ids: arrayParam("integer", "Account ids to aggregate.", {
              required: true,
              example: [19, 18, 17]
            })
          }
        },
        response_fields: ["requests", "tokens", "cost", "standard_cost", "user_cost"],
        examples: [
          {
            title: "Today's usage for a batch of accounts",
            args: {
              body: {
                account_ids: [19, 18, 17]
              }
            }
          }
        ],
        notes: [
          "Prefer this over looping today_stats or usage.stats(account_id) when you need a fleet-wide today report.",
          "If you suspect pre-aggregation lag, validate only the few rows you care about with usage.stats(account_id, start_date, end_date)."
        ]
      },
      batch_create: {
        source: `${sourceRefs.accounts}#batchCreate`,
        mutating: true,
        body: {
          strict: true,
          params: {
            accounts: arrayParam("object", "Account create payloads.", { required: true })
          }
        }
      },
      batch_update_credentials: {
        source: `${sourceRefs.accounts}#batchUpdateCredentials`,
        mutating: true,
        body: {
          strict: true,
          params: {
            account_ids: arrayParam("integer", "Account ids to update.", { required: true }),
            field: stringParam("Credential field name.", { required: true }),
            value: objectParam("New value.")
          }
        }
      },
      bulk_update: {
        source: `${sourceRefs.accounts}#bulkUpdate`,
        mutating: true,
        body: {
          strict: false,
          params: {
            account_ids: arrayParam("integer", "Account ids to update.", { required: true })
          }
        }
      },
      batch_clear_error: {
        source: `${sourceRefs.accounts}#batchClearError`,
        mutating: true,
        body: {
          strict: true,
          params: {
            account_ids: arrayParam("integer", "Account ids to clear.", { required: true })
          }
        }
      },
      batch_refresh: {
        source: `${sourceRefs.accounts}#batchRefresh`,
        mutating: true,
        body: {
          strict: true,
          params: {
            account_ids: arrayParam("integer", "Account ids to refresh.", { required: true })
          }
        }
      },
      export_data: {
        source: `${sourceRefs.accounts}#exportData`,
        query: {
          strict: false,
          params: {
            ids: stringParam("Comma-separated account ids."),
            platform: stringParam("Filter by platform."),
            type: stringParam("Filter by account type."),
            status: stringParam("Filter by status."),
            search: stringParam("Fuzzy search keyword."),
            include_proxies: enumParam(["false"], "Set false to exclude proxies from export.")
          }
        }
      },
      import_data: {
        source: `${sourceRefs.accounts}#importData`,
        mutating: true,
        body: {
          strict: true,
          params: {
            data: objectParam("Admin data payload to import.", { required: true }),
            skip_default_group_bind: booleanParam("Skip default group binding during import.")
          }
        }
      }
    }
  },
  groups: {
    operations: {
      list: {
        source: `${sourceRefs.groups}#list`,
        starter_args: {
          query: {
            page: 1,
            page_size: 100
          }
        },
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            platform: stringParam("Filter by platform."),
            status: enumParam(["active", "inactive"], "Filter by group status."),
            is_exclusive: booleanParam("Filter by exclusivity."),
            search: stringParam("Fuzzy search keyword.")
          })
        }
      },
      create: {
        source: `${sourceRefs.groups}#create`,
        mutating: true,
        body: {
          strict: false,
          params: {
            name: stringParam("Group name.", { required: true }),
            platform: stringParam("Platform."),
            rate_multiplier: numberParam("Rate multiplier."),
            is_exclusive: booleanParam("Whether the group is exclusive.")
          }
        }
      },
      update: {
        source: `${sourceRefs.groups}#update`,
        mutating: true,
        body: {
          strict: false,
          params: {
            name: stringParam("Group name."),
            status: enumParam(["active", "inactive"], "Group status."),
            rate_multiplier: numberParam("Rate multiplier.")
          }
        }
      }
    },
    actions: {
      get_all: {
        source: `${sourceRefs.groups}#getAll`,
        query: {
          strict: true,
          params: {
            platform: stringParam("Optional platform filter.")
          }
        }
      },
      usage_summary: {
        source: `${sourceRefs.groups}#getUsageSummary`,
        preferred_for: ["group spend summary", "today cost by group"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "group_id",
        query: {
          strict: true,
          params: {
            timezone: stringParam("IANA timezone used to compute today_cost.")
          }
        }
      },
      capacity_summary: {
        source: `${sourceRefs.groups}#getCapacitySummary`,
        preferred_for: ["group capacity overview", "group concurrency health"],
        freshness: "realtime",
        returns_breakdown_by: "group_id",
        supports_bulk: true
      },
      update_sort_order: {
        source: `${sourceRefs.groups}#updateSortOrder`,
        mutating: true,
        body: {
          strict: true,
          params: {
            updates: arrayParam("object", "Array of { id, sort_order } entries.", {
              required: true
            })
          }
        }
      },
      api_keys: {
        source: `${sourceRefs.groups}#getGroupApiKeys`,
        query: {
          strict: true,
          params: paginationQuery
        }
      },
      batch_set_rate_multipliers: {
        source: `${sourceRefs.groups}#batchSetGroupRateMultipliers`,
        mutating: true,
        body: {
          strict: true,
          params: {
            entries: arrayParam("object", "Array of { user_id, rate_multiplier } entries.", {
              required: true
            })
          }
        }
      }
    }
  },
  users: {
    operations: {
      list: {
        source: `${sourceRefs.users}#list`,
        starter_args: {
          query: {
            page: 1,
            page_size: 100
          }
        },
        query: {
          strict: false,
          params: mergeParams(paginationQuery, {
            status: enumParam(["active", "disabled"], "Filter by status."),
            role: enumParam(["admin", "user"], "Filter by role."),
            search: stringParam("Fuzzy search keyword."),
            group_name: stringParam("Fuzzy filter by allowed group name."),
            include_subscriptions: booleanParam("Include subscriptions in each row."),
            "attr[<id>]": stringParam("Attribute filter using the literal attr[id] query key.")
          })
        },
        notes: [
          "Attribute filters use literal query keys such as attr[12]. They are passed through as-is.",
          "If display names are not distinctive in your deployment, correlate on stable ids via users.get, dashboard.users_usage or dashboard.users_ranking, or usage.search_api_keys instead of relying on the list name field alone."
        ]
      },
      create: {
        source: `${sourceRefs.users}#create`,
        mutating: true,
        body: {
          strict: true,
          params: {
            email: stringParam("User email.", { required: true }),
            password: stringParam("Initial password.", { required: true }),
            balance: numberParam("Initial balance."),
            concurrency: integerParam("Initial concurrency limit."),
            allowed_groups: arrayParam("integer", "Allowed group ids.")
          }
        }
      },
      update: {
        source: `${sourceRefs.users}#update`,
        mutating: true,
        body: {
          strict: false,
          params: {
            email: stringParam("Email."),
            password: stringParam("Password."),
            username: stringParam("Username."),
            notes: stringParam("Internal notes."),
            role: enumParam(["admin", "user"], "Role."),
            balance: numberParam("Balance."),
            concurrency: integerParam("Concurrency."),
            status: enumParam(["active", "disabled"], "Status."),
            allowed_groups: arrayParam("integer", "Allowed group ids."),
            group_rates: objectParam("Per-group rate multiplier map.")
          }
        }
      }
    },
    actions: {
      update_balance: {
        source: `${sourceRefs.users}#updateBalance`,
        mutating: true,
        body: {
          strict: true,
          params: {
            balance: numberParam("Target or delta balance value.", { required: true }),
            operation: enumParam(["set", "add", "subtract"], "Balance operation."),
            notes: stringParam("Optional audit note.")
          }
        }
      },
      usage: {
        source: `${sourceRefs.users}#getUserUsageStats`,
        query: {
          strict: true,
          params: {
            period: stringParam("Summary period such as month.", { example: "month" })
          }
        }
      },
      balance_history: {
        source: `${sourceRefs.users}#getUserBalanceHistory`,
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            type: stringParam("Filter by balance history type.")
          })
        }
      },
      replace_group: {
        source: `${sourceRefs.users}#replaceGroup`,
        mutating: true,
        body: {
          strict: true,
          params: {
            old_group_id: integerParam("Current group id to replace.", { required: true }),
            new_group_id: integerParam("Replacement group id.", { required: true })
          }
        }
      }
    }
  },
  proxies: {
    operations: {
      list: {
        source: `${sourceRefs.proxies}#list`,
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            protocol: stringParam("Filter by proxy protocol."),
            status: enumParam(["active", "inactive"], "Filter by status."),
            search: stringParam("Fuzzy search keyword.")
          })
        }
      },
      create: {
        source: `${sourceRefs.proxies}#create`,
        mutating: true,
        body: {
          strict: true,
          params: {
            name: stringParam("Proxy name.", { required: true }),
            protocol: enumParam(["http", "https", "socks5", "socks5h"], "Proxy protocol.", {
              required: true
            }),
            host: stringParam("Hostname or IP.", { required: true }),
            port: integerParam("Port.", { required: true }),
            username: stringParam("Username if authentication is required."),
            password: stringParam("Password if authentication is required.")
          }
        }
      },
      update: {
        source: `${sourceRefs.proxies}#update`,
        mutating: true,
        body: {
          strict: false,
          params: {
            name: stringParam("Proxy name."),
            protocol: enumParam(["http", "https", "socks5", "socks5h"], "Proxy protocol."),
            host: stringParam("Hostname or IP."),
            port: integerParam("Port."),
            username: stringParam("Username."),
            password: stringParam("Password."),
            status: enumParam(["active", "inactive"], "Status.")
          }
        }
      }
    },
    actions: {
      get_all: {
        source: `${sourceRefs.proxies}#getAllWithCount`,
        starter_args: {
          query: {
            with_count: "true"
          }
        },
        query: {
          strict: true,
          params: {
            with_count: enumParam(["true"], "Use true to include account counts.")
          }
        }
      },
      batch_delete: {
        source: `${sourceRefs.proxies}#batchDelete`,
        mutating: true,
        body: {
          strict: true,
          params: {
            ids: arrayParam("integer", "Proxy ids to delete.", { required: true })
          }
        }
      },
      batch_create: {
        source: `${sourceRefs.proxies}#batchCreate`,
        mutating: true,
        body: {
          strict: true,
          params: {
            proxies: arrayParam("object", "Proxy create payloads.", { required: true })
          }
        }
      },
      export_data: {
        source: `${sourceRefs.proxies}#exportData`,
        query: {
          strict: false,
          params: {
            ids: stringParam("Comma-separated proxy ids."),
            protocol: stringParam("Filter by protocol."),
            status: enumParam(["active", "inactive"], "Filter by status."),
            search: stringParam("Search keyword.")
          }
        }
      },
      import_data: {
        source: `${sourceRefs.proxies}#importData`,
        mutating: true,
        body: {
          strict: true,
          params: {
            data: objectParam("Admin data payload to import.", { required: true })
          }
        }
      }
    }
  },
  subscriptions: {
    operations: {
      list: {
        source: `${sourceRefs.subscriptions}#list`,
        starter_args: {
          query: {
            page: 1,
            page_size: 100,
            sort_order: "desc"
          }
        },
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            status: enumParam(["active", "expired", "revoked"], "Filter by status."),
            user_id: integerParam("Filter by user id."),
            group_id: integerParam("Filter by group id."),
            platform: stringParam("Filter by platform."),
            sort_by: stringParam("Sort field."),
            sort_order: enumParam(["asc", "desc"], "Sort direction.")
          })
        }
      }
    },
    actions: {
      assign: {
        source: `${sourceRefs.subscriptions}#assign`,
        mutating: true,
        body: {
          strict: true,
          params: {
            user_id: integerParam("Target user id.", { required: true }),
            group_id: integerParam("Target group id.", { required: true }),
            validity_days: integerParam("Optional validity days.")
          }
        }
      },
      bulk_assign: {
        source: `${sourceRefs.subscriptions}#bulkAssign`,
        mutating: true,
        body: {
          strict: true,
          params: {
            user_ids: arrayParam("integer", "User ids.", { required: true }),
            group_id: integerParam("Target group id.", { required: true }),
            validity_days: integerParam("Optional validity days.")
          }
        }
      },
      extend: {
        source: `${sourceRefs.subscriptions}#extend`,
        mutating: true,
        body: {
          strict: true,
          params: {
            days: integerParam("Days to extend.", { required: true })
          }
        }
      },
      reset_quota: {
        source: `${sourceRefs.subscriptions}#resetQuota`,
        mutating: true,
        body: {
          strict: true,
          params: {
            daily: booleanParam("Reset daily window.", { required: true }),
            weekly: booleanParam("Reset weekly window.", { required: true }),
            monthly: booleanParam("Reset monthly window.", { required: true })
          }
        }
      },
      list_by_group: {
        source: `${sourceRefs.subscriptions}#listByGroup`,
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: true,
          params: paginationQuery
        }
      },
      list_by_user: {
        source: `${sourceRefs.subscriptions}#listByUser`,
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: true,
          params: paginationQuery
        }
      }
    }
  },
  announcements: {
    operations: {
      list: {
        source: `${sourceRefs.announcements}#list`,
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            status: stringParam("Filter by status."),
            search: stringParam("Search keyword.")
          })
        }
      },
      create: {
        source: `${sourceRefs.announcements}#create`,
        mutating: true,
        body: {
          strict: false,
          params: {
            title: stringParam("Announcement title.", { required: true }),
            content: stringParam("Announcement body.", { required: true })
          }
        }
      },
      update: {
        source: `${sourceRefs.announcements}#update`,
        mutating: true,
        body: {
          strict: false,
          params: {
            title: stringParam("Announcement title."),
            content: stringParam("Announcement body."),
            status: stringParam("Announcement status.")
          }
        }
      }
    },
    actions: {
      read_status: {
        source: `${sourceRefs.announcements}#getReadStatus`,
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            search: stringParam("Search keyword for user or email.")
          })
        }
      }
    }
  },
  promo_codes: {
    operations: {
      list: {
        source: `${sourceRefs.promo_codes}#list`,
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            status: stringParam("Filter by status."),
            search: stringParam("Search keyword.")
          })
        }
      },
      create: {
        source: `${sourceRefs.promo_codes}#create`,
        mutating: true,
        body: {
          strict: false,
          params: {
            code: stringParam("Promo code."),
            discount_type: stringParam("Discount type."),
            discount_value: numberParam("Discount value.")
          }
        }
      },
      update: {
        source: `${sourceRefs.promo_codes}#update`,
        mutating: true,
        body: {
          strict: false,
          params: {
            status: stringParam("Promo code status.")
          }
        }
      }
    },
    actions: {
      usages: {
        source: `${sourceRefs.promo_codes}#getUsages`,
        query: {
          strict: true,
          params: paginationQuery
        }
      }
    }
  },
  redeem_codes: {
    operations: {
      list: {
        source: `${sourceRefs.redeem_codes}#list`,
        query: {
          strict: true,
          params: mergeParams(paginationQuery, {
            type: stringParam("Redeem code type."),
            status: stringParam("Filter by status."),
            search: stringParam("Search keyword.")
          })
        }
      }
    },
    actions: {
      generate: {
        source: `${sourceRefs.redeem_codes}#generate`,
        mutating: true,
        body: {
          strict: true,
          params: {
            count: integerParam("Number of codes to generate.", { required: true }),
            type: stringParam("Redeem code type.", { required: true }),
            value: numberParam("Redeem code value.", { required: true }),
            group_id: integerParam("Required for subscription codes."),
            validity_days: integerParam("Subscription validity days.")
          }
        }
      },
      batch_delete: {
        source: `${sourceRefs.redeem_codes}#batchDelete`,
        mutating: true,
        body: {
          strict: true,
          params: {
            ids: arrayParam("integer", "Redeem code ids to delete.", { required: true })
          }
        }
      },
      export: {
        source: `${sourceRefs.redeem_codes}#exportCodes`,
        query: {
          strict: true,
          params: {
            type: stringParam("Redeem code type."),
            status: stringParam("Filter by status.")
          }
        }
      }
    }
  },
  user_attributes: {
    operations: {
      list: {
        source: `${sourceRefs.user_attributes}#listDefinitions`,
        query: {
          strict: true,
          params: {
            enabled: booleanParam("When true, only enabled definitions are returned.")
          }
        }
      },
      create: {
        source: `${sourceRefs.user_attributes}#createDefinition`,
        mutating: true,
        body: {
          strict: false,
          params: {
            name: stringParam("Attribute name.", { required: true }),
            key: stringParam("Attribute key.")
          }
        }
      },
      update: {
        source: `${sourceRefs.user_attributes}#updateDefinition`,
        mutating: true,
        body: {
          strict: false,
          params: {
            name: stringParam("Attribute name."),
            enabled: booleanParam("Whether the attribute is enabled.")
          }
        }
      }
    },
    actions: {
      batch_get_user_attributes: {
        source: `${sourceRefs.user_attributes}#getBatchUserAttributes`,
        body: {
          strict: true,
          params: {
            user_ids: arrayParam("integer", "User ids to fetch.", { required: true })
          }
        }
      },
      reorder: {
        source: `${sourceRefs.user_attributes}#reorderDefinitions`,
        mutating: true,
        body: {
          strict: true,
          params: {
            ids: arrayParam("integer", "Ordered attribute ids.", { required: true })
          }
        }
      }
    }
  },
  ops: {
    notes: [
      "Ops dashboard and traffic actions are read-only monitoring endpoints; prefer them over ad-hoc request loops for health questions.",
      "For request failure investigation, start with ops.list_request_errors or ops.list_upstream_errors before drilling into a single error id.",
      "For account availability or rate-limit questions, prefer ops.account_availability over per-account probing."
    ],
    actions: {
      concurrency: {
        source: `${sourceRefs.ops}#getConcurrencyStats`,
        preferred_for: ["realtime concurrency", "current inflight requests", "system load now"],
        freshness: "realtime",
        returns_breakdown_by: "summary",
        response_fields: ["current_concurrency", "peak_concurrency"]
      },
      user_concurrency: {
        source: `${sourceRefs.ops}#getUserConcurrencyStats`,
        preferred_for: ["per-user concurrency", "which users are consuming concurrency"],
        freshness: "realtime",
        returns_breakdown_by: "user_id",
        supports_bulk: true
      },
      account_availability: {
        source: `${sourceRefs.ops}#getAccountAvailabilityStats`,
        preferred_for: ["account availability", "schedulable accounts", "rate limited accounts", "which accounts are healthy"],
        freshness: "realtime",
        returns_breakdown_by: "account_id",
        supports_bulk: true,
        avoids_n_plus_one: true,
        response_fields: ["account_id", "available", "rate_limited", "temp_unschedulable", "error"]
      },
      realtime_traffic: {
        source: `${sourceRefs.ops}#getRealtimeTraffic`,
        preferred_for: ["realtime traffic", "request throughput now", "live traffic summary"],
        freshness: "realtime",
        returns_breakdown_by: "summary",
        response_fields: ["requests_per_minute", "tokens_per_minute", "active_requests"]
      },
      list_alert_events: {
        source: `${sourceRefs.ops}#listAlertEvents`,
        preferred_for: ["alert incidents", "recent alerts", "active alerts"],
        freshness: "realtime",
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: false,
          params: paginationQuery
        }
      },
      list_request_errors: {
        source: `${sourceRefs.ops}#listRequestErrors`,
        preferred_for: ["request errors", "failed requests", "request error triage"],
        freshness: "realtime",
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: false,
          params: paginationQuery
        }
      },
      get_request_error: {
        source: `${sourceRefs.ops}#getRequestError`,
        preferred_for: ["single request error details"],
        freshness: "realtime"
      },
      list_request_error_upstream_errors: {
        source: `${sourceRefs.ops}#listRequestErrorUpstreamErrors`,
        preferred_for: ["linked upstream errors for one request failure"],
        freshness: "realtime"
      },
      list_upstream_errors: {
        source: `${sourceRefs.ops}#listUpstreamErrors`,
        preferred_for: ["upstream errors", "provider failures", "upstream error triage"],
        freshness: "realtime",
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: false,
          params: paginationQuery
        }
      },
      get_upstream_error: {
        source: `${sourceRefs.ops}#getUpstreamError`,
        preferred_for: ["single upstream error details"],
        freshness: "realtime"
      },
      list_requests: {
        source: `${sourceRefs.ops}#listRequests`,
        preferred_for: ["request drilldown", "recent requests"],
        freshness: "realtime",
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: false,
          params: paginationQuery
        }
      },
      list_system_logs: {
        source: `${sourceRefs.ops}#listSystemLogs`,
        preferred_for: ["system logs", "log inspection"],
        freshness: "near_realtime",
        starter_args: {
          query: {
            page: 1,
            page_size: 50
          }
        },
        query: {
          strict: false,
          params: paginationQuery
        }
      },
      system_log_health: {
        source: `${sourceRefs.ops}#getSystemLogHealth`,
        preferred_for: ["log pipeline health", "system log ingestion health"],
        freshness: "realtime",
        returns_breakdown_by: "summary"
      },
      dashboard_snapshot_v2: {
        source: `${sourceRefs.ops}#getDashboardSnapshotV2`,
        preferred_for: ["ops dashboard snapshot", "broad ops snapshot"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "summary"
      },
      dashboard_overview: {
        source: `${sourceRefs.ops}#getDashboardOverview`,
        preferred_for: ["ops overview", "system health overview", "operations summary"],
        freshness: "realtime",
        returns_breakdown_by: "summary"
      },
      dashboard_throughput_trend: {
        source: `${sourceRefs.ops}#getDashboardThroughputTrend`,
        preferred_for: ["throughput trend", "traffic trend"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "timeseries"
      },
      dashboard_latency_histogram: {
        source: `${sourceRefs.ops}#getDashboardLatencyHistogram`,
        preferred_for: ["latency histogram", "latency distribution"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "bucket"
      },
      dashboard_error_trend: {
        source: `${sourceRefs.ops}#getDashboardErrorTrend`,
        preferred_for: ["error trend", "error rate trend"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "timeseries"
      },
      dashboard_error_distribution: {
        source: `${sourceRefs.ops}#getDashboardErrorDistribution`,
        preferred_for: ["error distribution", "error type breakdown"],
        freshness: "preaggregated_may_lag",
        returns_breakdown_by: "error_type"
      }
    }
  },
  settings: {
    notes: [
      "Settings bodies are intentionally non-strict because these endpoints carry large structured payloads.",
      "When changing sensitive settings, prefer reading the current value first and then patching only the needed fields."
    ],
    operations: {
      update: {
        source: `${sourceRefs.settings}#updateSettings`,
        mutating: true,
        body: {
          strict: false,
          params: {
            site_name: stringParam("Site name."),
            frontend_url: stringParam("Frontend URL."),
            api_base_url: stringParam("API base URL."),
            registration_enabled: booleanParam("Whether registration is enabled.")
          }
        }
      }
    },
    actions: {
      test_smtp: {
        source: `${sourceRefs.settings}#testSmtpConnection`,
        body: {
          strict: true,
          params: {
            smtp_host: stringParam("SMTP host.", { required: true }),
            smtp_port: integerParam("SMTP port.", { required: true }),
            smtp_username: stringParam("SMTP username.", { required: true }),
            smtp_password: stringParam("SMTP password.", { required: true }),
            smtp_use_tls: booleanParam("Use TLS.", { required: true })
          }
        }
      },
      send_test_email: {
        source: `${sourceRefs.settings}#sendTestEmail`,
        body: {
          strict: true,
          params: {
            email: stringParam("Destination email.", { required: true }),
            smtp_host: stringParam("SMTP host.", { required: true }),
            smtp_port: integerParam("SMTP port.", { required: true }),
            smtp_username: stringParam("SMTP username.", { required: true }),
            smtp_password: stringParam("SMTP password.", { required: true }),
            smtp_from_email: stringParam("From email.", { required: true }),
            smtp_from_name: stringParam("From display name.", { required: true }),
            smtp_use_tls: booleanParam("Use TLS.", { required: true })
          }
        }
      },
      update_overload_cooldown: {
        source: `${sourceRefs.settings}#updateOverloadCooldownSettings`,
        mutating: true,
        body: {
          strict: true,
          params: {
            enabled: booleanParam("Enable overload cooldown.", { required: true }),
            cooldown_minutes: integerParam("Cooldown minutes.", { required: true })
          }
        }
      },
      update_stream_timeout: {
        source: `${sourceRefs.settings}#updateStreamTimeoutSettings`,
        mutating: true,
        body: {
          strict: true,
          params: {
            enabled: booleanParam("Enable stream timeout policy.", { required: true }),
            action: enumParam(["temp_unsched", "error", "none"], "Timeout action.", {
              required: true
            }),
            temp_unsched_minutes: integerParam("Temporary unschedulable minutes.", { required: true }),
            threshold_count: integerParam("Failure threshold count.", { required: true }),
            threshold_window_minutes: integerParam("Threshold window minutes.", { required: true })
          }
        }
      },
      update_rectifier: {
        source: `${sourceRefs.settings}#updateRectifierSettings`,
        mutating: true,
        body: {
          strict: true,
          params: {
            enabled: booleanParam("Enable rectifier.", { required: true }),
            thinking_signature_enabled: booleanParam("Enable thinking signature rules.", { required: true }),
            thinking_budget_enabled: booleanParam("Enable thinking budget rules.", { required: true }),
            apikey_signature_enabled: booleanParam("Enable API key signature rules.", { required: true }),
            apikey_signature_patterns: arrayParam("string", "Signature patterns.", { required: true })
          }
        }
      },
      update_beta_policy: {
        source: `${sourceRefs.settings}#updateBetaPolicySettings`,
        mutating: true,
        body: {
          strict: true,
          params: {
            rules: arrayParam("object", "Beta policy rules.", { required: true })
          }
        }
      }
    }
  },
  system: {
    actions: {
      check_updates: {
        source: `${sourceRefs.system}#checkUpdates`,
        query: {
          strict: true,
          params: {
            force: enumParam(["true"], "Force refresh from upstream release metadata.")
          }
        }
      },
      update: {
        source: `${sourceRefs.system}#performUpdate`,
        mutating: true
      },
      rollback: {
        source: `${sourceRefs.system}#rollback`,
        mutating: true
      },
      restart: {
        source: `${sourceRefs.system}#restartService`,
        mutating: true
      }
    }
  },
  backups: {
    actions: {
      update_s3_config: {
        source: `${sourceRefs.backups}#updateS3Config`,
        mutating: true,
        body: {
          strict: true,
          params: {
            endpoint: stringParam("S3 endpoint.", { required: true }),
            region: stringParam("Region.", { required: true }),
            bucket: stringParam("Bucket.", { required: true }),
            access_key_id: stringParam("Access key id.", { required: true }),
            secret_access_key: stringParam("Secret access key."),
            prefix: stringParam("Object prefix.", { required: true }),
            force_path_style: booleanParam("Use path-style addressing.", { required: true })
          }
        }
      },
      test_s3_config: {
        source: `${sourceRefs.backups}#testS3Connection`,
        body: {
          strict: true,
          params: {
            endpoint: stringParam("S3 endpoint.", { required: true }),
            region: stringParam("Region.", { required: true }),
            bucket: stringParam("Bucket.", { required: true }),
            access_key_id: stringParam("Access key id.", { required: true }),
            secret_access_key: stringParam("Secret access key."),
            prefix: stringParam("Object prefix.", { required: true }),
            force_path_style: booleanParam("Use path-style addressing.", { required: true })
          }
        }
      },
      update_schedule: {
        source: `${sourceRefs.backups}#updateSchedule`,
        mutating: true,
        body: {
          strict: true,
          params: {
            enabled: booleanParam("Enable backup schedule.", { required: true }),
            cron_expr: stringParam("Cron expression.", { required: true }),
            retain_days: integerParam("Retention days.", { required: true }),
            retain_count: integerParam("Retention count.", { required: true })
          }
        }
      },
      create_backup: {
        source: `${sourceRefs.backups}#createBackup`,
        mutating: true,
        body: {
          strict: true,
          params: {
            expire_days: integerParam("Optional expiration days.")
          }
        }
      },
      restore_backup: {
        source: `${sourceRefs.backups}#restoreBackup`,
        mutating: true,
        body: {
          strict: true,
          params: {
            password: stringParam("Backup restore password.", { required: true })
          }
        }
      }
    }
  },
  data_management: {
    notes: ["data_management actions use non-standard path parameters like source_type, profile_id, and job_id. Prefer call templates from describe_resources."],
    actions: {
      update_config: {
        source: `${sourceRefs.data_management}#updateConfig`,
        mutating: true,
        body: {
          strict: false,
          params: {
            source_mode: enumParam(["direct", "docker_exec"], "Source mode."),
            backup_root: stringParam("Backup root path."),
            retention_days: integerParam("Retention days."),
            keep_last: integerParam("How many backups to retain.")
          }
        }
      },
      list_source_profiles: {
        source: `${sourceRefs.data_management}#listSourceProfiles`
      },
      create_source_profile: {
        source: `${sourceRefs.data_management}#createSourceProfile`,
        mutating: true,
        body: {
          strict: true,
          params: {
            profile_id: stringParam("Profile id.", { required: true }),
            name: stringParam("Profile name.", { required: true }),
            config: objectParam("Source config payload.", { required: true }),
            set_active: booleanParam("Set the profile as active after creation.")
          }
        }
      },
      update_source_profile: {
        source: `${sourceRefs.data_management}#updateSourceProfile`,
        mutating: true,
        body: {
          strict: true,
          params: {
            name: stringParam("Profile name.", { required: true }),
            config: objectParam("Source config payload.", { required: true })
          }
        }
      },
      test_s3: {
        source: `${sourceRefs.data_management}#testS3`,
        body: {
          strict: true,
          params: {
            endpoint: stringParam("S3 endpoint.", { required: true }),
            region: stringParam("Region.", { required: true }),
            bucket: stringParam("Bucket.", { required: true }),
            access_key_id: stringParam("Access key id.", { required: true }),
            secret_access_key: stringParam("Secret access key.", { required: true }),
            prefix: stringParam("Object prefix."),
            force_path_style: booleanParam("Use path-style addressing."),
            use_ssl: booleanParam("Use SSL.")
          }
        }
      },
      create_s3_profile: {
        source: `${sourceRefs.data_management}#createS3Profile`,
        mutating: true,
        body: {
          strict: true,
          params: {
            profile_id: stringParam("Profile id.", { required: true }),
            name: stringParam("Profile name.", { required: true }),
            enabled: booleanParam("Enable profile.", { required: true }),
            endpoint: stringParam("S3 endpoint.", { required: true }),
            region: stringParam("Region.", { required: true }),
            bucket: stringParam("Bucket.", { required: true }),
            access_key_id: stringParam("Access key id.", { required: true }),
            secret_access_key: stringParam("Secret access key."),
            prefix: stringParam("Object prefix."),
            force_path_style: booleanParam("Use path-style addressing."),
            use_ssl: booleanParam("Use SSL."),
            set_active: booleanParam("Set active after creation.")
          }
        }
      },
      update_s3_profile: {
        source: `${sourceRefs.data_management}#updateS3Profile`,
        mutating: true,
        body: {
          strict: true,
          params: {
            name: stringParam("Profile name.", { required: true }),
            enabled: booleanParam("Enable profile.", { required: true }),
            endpoint: stringParam("S3 endpoint.", { required: true }),
            region: stringParam("Region.", { required: true }),
            bucket: stringParam("Bucket.", { required: true }),
            access_key_id: stringParam("Access key id.", { required: true }),
            secret_access_key: stringParam("Secret access key."),
            prefix: stringParam("Object prefix."),
            force_path_style: booleanParam("Use path-style addressing."),
            use_ssl: booleanParam("Use SSL.")
          }
        }
      },
      create_backup_job: {
        source: `${sourceRefs.data_management}#createBackupJob`,
        mutating: true,
        body: {
          strict: true,
          params: {
            backup_type: enumParam(["postgres", "redis", "full"], "Backup type.", {
              required: true
            }),
            upload_to_s3: booleanParam("Upload artifact to S3."),
            s3_profile_id: stringParam("S3 profile id."),
            postgres_profile_id: stringParam("Postgres profile id."),
            redis_profile_id: stringParam("Redis profile id."),
            idempotency_key: stringParam("Idempotency key for retriable submissions.")
          }
        }
      },
      list_backup_jobs: {
        source: `${sourceRefs.data_management}#listBackupJobs`,
        query: {
          strict: true,
          params: {
            page_size: integerParam("Page size."),
            page_token: stringParam("Opaque next page token."),
            status: stringParam("Backup job status."),
            backup_type: stringParam("Backup type.")
          }
        }
      }
    }
  }
}

export function getResourceDocs(name) {
  return resourceDocs[name] || null
}
