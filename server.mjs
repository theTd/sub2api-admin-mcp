import process from "node:process"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { adminResources, getDiscoveryTips, getResource, getResourceDocumentation, listResources } from "./resources.mjs"
import { listTaskRecipes } from "./task-recipes.mjs"

const SERVER_INFO = {
  name: "sub2api-admin-mcp",
  version: "0.1.0"
}

const DEFAULT_TIMEOUT_MS = parseInteger(process.env.SUB2API_TIMEOUT_MS, 30000)
const REFRESH_SKEW_MS = 30000
const RETRYABLE_AUTH_MODES = new Set(["credentials"])
const RESOURCE_NAMES = Object.keys(adminResources)
const RESOURCE_ENUM = z.enum(RESOURCE_NAMES)
const DESCRIBE_VIEW_ALIASES = ["compact", "full", "summary", "catalog", "detail", "detailed", "actions"]
const DESCRIBE_VIEW_ENUM = z.enum(DESCRIBE_VIEW_ALIASES)
const FLEXIBLE_OBJECT_SCHEMA = z.record(z.string(), z.any())
const IDENTIFIER_SCHEMA = z.union([z.string(), z.number().int()])

const authState = {
  mode: null,
  accessToken: "",
  refreshToken: "",
  expiresAt: 0
}

const describeResourcesArgsSchema = z.object({
  resource: RESOURCE_ENUM.optional(),
  view: DESCRIBE_VIEW_ENUM.optional()
}).strict()

const listArgsSchema = z.object({
  resource: RESOURCE_ENUM,
  path_params: FLEXIBLE_OBJECT_SCHEMA.optional(),
  query: FLEXIBLE_OBJECT_SCHEMA.optional()
}).strict()

const getArgsSchema = z.object({
  resource: RESOURCE_ENUM,
  id: IDENTIFIER_SCHEMA.optional(),
  path_params: FLEXIBLE_OBJECT_SCHEMA.optional(),
  query: FLEXIBLE_OBJECT_SCHEMA.optional()
}).strict()

const createArgsSchema = z.object({
  resource: RESOURCE_ENUM,
  path_params: FLEXIBLE_OBJECT_SCHEMA.optional(),
  body: FLEXIBLE_OBJECT_SCHEMA
}).strict()

const updateArgsSchema = z.object({
  resource: RESOURCE_ENUM,
  id: IDENTIFIER_SCHEMA.optional(),
  path_params: FLEXIBLE_OBJECT_SCHEMA.optional(),
  query: FLEXIBLE_OBJECT_SCHEMA.optional(),
  body: FLEXIBLE_OBJECT_SCHEMA
}).strict()

const deleteArgsSchema = z.object({
  resource: RESOURCE_ENUM,
  id: IDENTIFIER_SCHEMA.optional(),
  path_params: FLEXIBLE_OBJECT_SCHEMA.optional(),
  query: FLEXIBLE_OBJECT_SCHEMA.optional()
}).strict()

const actionArgsSchema = z.object({
  resource: RESOURCE_ENUM,
  action: z.string().min(1),
  id: IDENTIFIER_SCHEMA.optional(),
  path_params: FLEXIBLE_OBJECT_SCHEMA.optional(),
  query: FLEXIBLE_OBJECT_SCHEMA.optional(),
  body: FLEXIBLE_OBJECT_SCHEMA.optional()
}).strict()

const capabilitySearchArgsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  include_examples: z.boolean().optional()
}).strict()

const TOOL_DEFINITIONS = [
  {
    name: "sub2api_admin_describe_resources",
    description: "Describe the supported admin resources, CRUD coverage, and named actions for this MCP server.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Optional resource name. Omit to get the resource catalog."
        },
        view: {
          type: "string",
          enum: DESCRIBE_VIEW_ALIASES,
          description: "Catalog verbosity. Aliases such as summary/detail/actions are accepted and normalized."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_list",
    description: "Run a list or collection query for an admin resource.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Resource name to query."
        },
        path_params: {
          type: "object",
          description: "Optional path parameters required by nested routes.",
          additionalProperties: true
        },
        query: {
          type: "object",
          description: "Optional query string parameters.",
          additionalProperties: true
        }
      },
      required: ["resource"],
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_get",
    description: "Get a single admin resource record or singleton config resource.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Resource name to query."
        },
        id: {
          description: "Optional record identifier for item routes using :id.",
          anyOf: [{ type: "string" }, { type: "integer" }]
        },
        path_params: {
          type: "object",
          description: "Optional path parameters for non-standard placeholders such as :profile_id or :source_type.",
          additionalProperties: true
        },
        query: {
          type: "object",
          description: "Optional query string parameters.",
          additionalProperties: true
        }
      },
      required: ["resource"],
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_create",
    description: "Create a new admin resource record.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Resource name to create."
        },
        path_params: {
          type: "object",
          description: "Optional path parameters required by nested collection routes.",
          additionalProperties: true
        },
        body: {
          type: "object",
          description: "JSON request body.",
          additionalProperties: true
        }
      },
      required: ["resource", "body"],
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_update",
    description: "Update an admin resource record or singleton config resource.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Resource name to update."
        },
        id: {
          description: "Optional record identifier for item routes using :id.",
          anyOf: [{ type: "string" }, { type: "integer" }]
        },
        path_params: {
          type: "object",
          description: "Optional path parameters for non-standard placeholders.",
          additionalProperties: true
        },
        query: {
          type: "object",
          description: "Optional query string parameters.",
          additionalProperties: true
        },
        body: {
          type: "object",
          description: "JSON request body.",
          additionalProperties: true
        }
      },
      required: ["resource", "body"],
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_delete",
    description: "Delete an admin resource record.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Resource name to delete."
        },
        id: {
          description: "Optional record identifier for item routes using :id.",
          anyOf: [{ type: "string" }, { type: "integer" }]
        },
        path_params: {
          type: "object",
          description: "Optional path parameters for non-standard placeholders.",
          additionalProperties: true
        },
        query: {
          type: "object",
          description: "Optional query string parameters.",
          additionalProperties: true
        }
      },
      required: ["resource"],
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_action",
    description: "Run a named non-CRUD admin action such as stats, batch jobs, resets, or OAuth helpers.",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: RESOURCE_NAMES,
          description: "Resource name that owns the action."
        },
        action: {
          type: "string",
          description: "Action name. Use sub2api_admin_describe_resources first if unsure."
        },
        id: {
          description: "Optional identifier for actions whose route uses :id.",
          anyOf: [{ type: "string" }, { type: "integer" }]
        },
        path_params: {
          type: "object",
          description: "Optional path parameters such as source_type, profile_id, job_id, or idx.",
          additionalProperties: true
        },
        query: {
          type: "object",
          description: "Optional query string parameters.",
          additionalProperties: true
        },
        body: {
          type: "object",
          description: "Optional JSON request body.",
          additionalProperties: true
        }
      },
      required: ["resource", "action"],
      additionalProperties: false
    }
  },
  {
    name: "sub2api_admin_find_capability",
    description: "Search resources and actions by intent, keyword, path, or parameter name and return recommended MCP call templates.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keyword, intent, parameter name, or partial path to search for."
        },
        limit: {
          type: "integer",
          description: "Maximum matches to return. Defaults to 10."
        },
        include_examples: {
          type: "boolean",
          description: "Include documented example invocations when available."
        }
      },
      required: ["query"],
      additionalProperties: false
    }
  }
]

function getCliArgValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index < 0) {
    return null
  }

  const value = process.argv[index + 1]
  return value && !value.startsWith("--") ? value : null
}

if (process.argv.includes("--help")) {
  printHelp()
  process.exit(0)
}

if (process.argv.includes("--print-tools")) {
  process.stdout.write(`${JSON.stringify(TOOL_DEFINITIONS, null, 2)}\n`)
  process.exit(0)
}

if (process.argv.includes("--print-resources")) {
  process.stdout.write(`${JSON.stringify(listResources(), null, 2)}\n`)
  process.exit(0)
}

const capabilityQuery = getCliArgValue("--find-capability")
const capabilityLimit = parseInteger(getCliArgValue("--limit"), 10)
const capabilityIncludeExamples = process.argv.includes("--include-examples")

process.on("uncaughtException", (error) => {
  writeToStderr(`uncaught exception: ${error.stack || error.message}`)
})

process.on("unhandledRejection", (reason) => {
  const detail = reason instanceof Error ? (reason.stack || reason.message) : String(reason)
  writeToStderr(`unhandled rejection: ${detail}`)
})

function printHelp() {
  const lines = [
    "sub2api-admin-mcp",
    "",
    "Environment:",
    "  SUB2API_BASE_URL            Required. Example: http://127.0.0.1:8080",
    "  SUB2API_ADMIN_API_KEY       Preferred auth mode. Uses x-api-key.",
    "  SUB2API_ADMIN_JWT           Static Bearer token auth.",
    "  SUB2API_ADMIN_EMAIL         Login auth mode email.",
    "  SUB2API_ADMIN_PASSWORD      Login auth mode password.",
    "  SUB2API_ADMIN_TOTP_CODE     Optional TOTP code for login/2fa.",
    "  SUB2API_ADMIN_TURNSTILE_TOKEN Optional Turnstile token for login when required.",
    "  SUB2API_TIMEOUT_MS          Optional request timeout in milliseconds.",
    "",
    "CLI:",
    "  --print-tools              Print MCP tool definitions and exit.",
    "  --print-resources          Print resource catalog and exit.",
    "  --find-capability <query>  Run local capability routing for a query and print the ranked results as JSON.",
    "  --limit <n>                Optional result limit used with --find-capability.",
    "  --include-examples         Include documented examples with --find-capability.",
    "  --help                     Show this message."
  ]

  process.stdout.write(`${lines.join("\n")}\n`)
}

function parseInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value || "", 10)
  return Number.isFinite(parsed) ? parsed : fallbackValue
}

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim()
  if (!raw) {
    throw new Error("SUB2API_BASE_URL is required")
  }
  return raw.replace(/\/+$/, "")
}

function getBaseUrl() {
  return normalizeBaseUrl(process.env.SUB2API_BASE_URL)
}

function getAuthMode() {
  if (process.env.SUB2API_ADMIN_API_KEY) {
    return "admin_api_key"
  }
  if (process.env.SUB2API_ADMIN_JWT) {
    return "jwt"
  }
  if (process.env.SUB2API_ADMIN_EMAIL && process.env.SUB2API_ADMIN_PASSWORD) {
    return "credentials"
  }
  throw new Error(
    "Configure SUB2API_ADMIN_API_KEY, SUB2API_ADMIN_JWT, or SUB2API_ADMIN_EMAIL plus SUB2API_ADMIN_PASSWORD"
  )
}

async function getAuthHeaders(forceRefresh = false) {
  const mode = getAuthMode()
  authState.mode = mode

  if (mode === "admin_api_key") {
    return { "x-api-key": process.env.SUB2API_ADMIN_API_KEY.trim() }
  }

  if (mode === "jwt") {
    return { Authorization: `Bearer ${process.env.SUB2API_ADMIN_JWT.trim()}` }
  }

  if (forceRefresh) {
    authState.expiresAt = 0
  }

  await ensureCredentialAuth()
  return { Authorization: `Bearer ${authState.accessToken}` }
}

async function ensureCredentialAuth() {
  const now = Date.now()
  if (authState.accessToken && authState.expiresAt > now + REFRESH_SKEW_MS) {
    return
  }

  if (authState.refreshToken) {
    try {
      await refreshCredentialAuth()
      if (authState.accessToken && authState.expiresAt > Date.now() + REFRESH_SKEW_MS) {
        return
      }
    } catch {
      authState.accessToken = ""
      authState.refreshToken = ""
      authState.expiresAt = 0
    }
  }

  await loginWithCredentials()
}

async function loginWithCredentials() {
  const body = {
    email: process.env.SUB2API_ADMIN_EMAIL,
    password: process.env.SUB2API_ADMIN_PASSWORD
  }

  if (process.env.SUB2API_ADMIN_TURNSTILE_TOKEN) {
    body.turnstile_token = process.env.SUB2API_ADMIN_TURNSTILE_TOKEN
  }

  const result = await performHttpRequest({
    method: "POST",
    path: "/api/v1/auth/login",
    body,
    skipAuth: true,
    retryOnAuthFailure: false
  })

  let authPayload = result.data

  if (authPayload && authPayload.requires_2fa) {
    const totpCode = String(process.env.SUB2API_ADMIN_TOTP_CODE || "").trim()
    if (!totpCode) {
      throw new Error("Login requires 2FA. Set SUB2API_ADMIN_TOTP_CODE.")
    }

    const followUp = await performHttpRequest({
      method: "POST",
      path: "/api/v1/auth/login/2fa",
      body: {
        temp_token: authPayload.temp_token,
        totp_code: totpCode
      },
      skipAuth: true,
      retryOnAuthFailure: false
    })

    authPayload = followUp.data
  }

  cacheAuthPayload(authPayload)
}

async function refreshCredentialAuth() {
  const result = await performHttpRequest({
    method: "POST",
    path: "/api/v1/auth/refresh",
    body: {
      refresh_token: authState.refreshToken
    },
    skipAuth: true,
    retryOnAuthFailure: false
  })

  cacheAuthPayload(result.data, { preserveRefreshToken: false })
}

function cacheAuthPayload(payload, options = {}) {
  if (!payload || typeof payload !== "object" || !payload.access_token) {
    throw new Error("Authentication response did not contain access_token")
  }

  authState.accessToken = String(payload.access_token)
  authState.refreshToken = payload.refresh_token
    ? String(payload.refresh_token)
    : (options.preserveRefreshToken ? authState.refreshToken : "")

  const expiresInSeconds = Number(payload.expires_in || 3600)
  authState.expiresAt = Date.now() + Math.max(expiresInSeconds, 60) * 1000
}

async function performHttpRequest({ method, path, query, body, skipAuth = false, retryOnAuthFailure = true }) {
  const url = new URL(resolvePathWithQuery(path, query), getBaseUrl())
  const headers = {
    Accept: "application/json"
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  if (!skipAuth) {
    Object.assign(headers, await getAuthHeaders(false))
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  })

  const parsed = await parseResponseBody(response)

  if (!response.ok) {
    if (!skipAuth && retryOnAuthFailure && response.status === 401 && RETRYABLE_AUTH_MODES.has(authState.mode)) {
      await getAuthHeaders(true)
      return performHttpRequest({ method, path, query, body, skipAuth, retryOnAuthFailure: false })
    }

    throw formatHttpError(method, url.pathname + url.search, response.status, parsed)
  }

  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "code")) {
    if (parsed.code !== 0) {
      throw formatHttpError(method, url.pathname + url.search, response.status, parsed)
    }

    return {
      status: response.status,
      data: parsed.data,
      message: parsed.message || "",
      raw: parsed
    }
  }

  return {
    status: response.status,
    data: parsed,
    message: "",
    raw: parsed
  }
}

async function parseResponseBody(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function formatHttpError(method, path, status, parsed) {
  const error = new Error(buildErrorMessage(method, path, status, parsed))
  error.status = status
  error.payload = parsed
  return error
}

function buildErrorMessage(method, path, status, parsed) {
  if (parsed && typeof parsed === "object") {
    const message = parsed.message || parsed.error || parsed.detail || ""
    if (message) {
      return `${method} ${path} failed with ${status}: ${message}`
    }
  }

  if (typeof parsed === "string" && parsed.trim()) {
    return `${method} ${path} failed with ${status}: ${parsed.trim()}`
  }

  return `${method} ${path} failed with ${status}`
}

function resolvePathWithQuery(path, query) {
  const search = new URLSearchParams()
  appendQuery(search, query || {})
  const queryText = search.toString()
  return queryText ? `${path}?${queryText}` : path
}

function appendQuery(search, source) {
  for (const [key, value] of Object.entries(source || {})) {
    appendQueryValue(search, key, value)
  }
}

function appendQueryValue(search, key, value) {
  if (value === undefined || value === null) {
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(search, key, item)
    }
    return
  }

  if (typeof value === "object") {
    search.append(key, JSON.stringify(value))
    return
  }

  search.append(key, String(value))
}

function resolvePathTemplate(template, args) {
  const pathParams = { ...(args.path_params || {}) }
  if (args.id !== undefined && args.id !== null && pathParams.id === undefined) {
    pathParams.id = args.id
  }

  return template.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    if (pathParams[key] === undefined || pathParams[key] === null || pathParams[key] === "") {
      throw new Error(`Missing path parameter: ${key}`)
    }
    return encodeURIComponent(String(pathParams[key]))
  })
}

function normalizeDescribeView(resourceName, requestedView) {
  const normalized = String(requestedView || "").trim().toLowerCase()
  if (normalized === "compact" || normalized === "summary" || normalized === "catalog") {
    return "compact"
  }

  if (normalized === "full" || normalized === "detail" || normalized === "detailed" || normalized === "actions") {
    return "full"
  }

  return resourceName ? "full" : "compact"
}

function compactResourceSummary(resource) {
  const supportedOperations = Object.entries(resource.operations || {})
    .filter(([, operation]) => Boolean(operation))
    .map(([name]) => name)
  const actionNames = Object.keys(resource.actions || {})

  return {
    name: resource.name,
    description: resource.description,
    notes: resource.notes || [],
    operations: supportedOperations,
    action_names: actionNames,
    action_count: actionNames.length
  }
}

function getOperationDocumentation(resourceName, operationName, isAction) {
  const resourceDocs = getResourceDocumentation(resourceName)
  return isAction
    ? (resourceDocs?.actions?.[operationName] || null)
    : (resourceDocs?.operations?.[operationName] || null)
}

function levenshteinDistance(left, right) {
  const a = String(left || "")
  const b = String(right || "")
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

function getAllowedParameterNames(params) {
  return Object.keys(params || {})
}

function findDocumentedParamEntry(name, params) {
  if (params?.[name]) {
    return [name, params[name]]
  }

  for (const [pattern, details] of Object.entries(params || {})) {
    if (!pattern.includes("<")) {
      continue
    }

    const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/<[^>]+>/g, "[^\\]]+")}$`)
    if (regex.test(name)) {
      return [pattern, details]
    }
  }

  return null
}

function suggestParameterName(name, params) {
  const allowed = getAllowedParameterNames(params)
  if (!allowed.length) {
    return null
  }

  const normalizedName = String(name || "").toLowerCase()

  const directAliasMatch = Object.entries(params).find(([, details]) =>
    (details.aliases || []).map((value) => String(value).toLowerCase()).includes(normalizedName)
  )
  if (directAliasMatch) {
    return directAliasMatch[0]
  }

  const containingMatches = allowed.filter((candidate) => {
    const normalizedCandidate = candidate.toLowerCase()
    return normalizedCandidate.includes(normalizedName) || normalizedName.includes(normalizedCandidate)
  })
  if (containingMatches.length) {
    return containingMatches.sort((left, right) => left.length - right.length)[0]
  }

  let bestName = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of allowed) {
    const distance = levenshteinDistance(name, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      bestName = candidate
    }
  }

  const maxDistance = Math.max(2, Math.floor(normalizedName.length / 2))
  if (bestDistance <= maxDistance) {
    return bestName
  }

  return null
}

function isIntegerLike(value) {
  if (typeof value === "number") {
    return Number.isInteger(value)
  }
  return typeof value === "string" && /^-?\d+$/.test(value.trim())
}

function isNumberLike(value) {
  if (typeof value === "number") {
    return Number.isFinite(value)
  }
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))
}

function isBooleanLike(value) {
  return typeof value === "boolean" || value === "true" || value === "false"
}

function matchesParamType(value, details) {
  if (value === undefined || value === null) {
    return true
  }

  if (!details?.type) {
    return true
  }

  if (details.type === "integer") {
    return isIntegerLike(value)
  }
  if (details.type === "number") {
    return isNumberLike(value)
  }
  if (details.type === "boolean") {
    return isBooleanLike(value)
  }
  if (details.type === "string") {
    return typeof value === "string"
  }
  if (details.type === "enum") {
    return details.enum ? details.enum.map(String).includes(String(value)) : true
  }
  if (details.type === "array") {
    return Array.isArray(value)
  }
  if (details.type === "object") {
    return typeof value === "object" && !Array.isArray(value)
  }

  return true
}

function validateParameterBag(location, value, schema, issues, warnings) {
  if (!schema || value === undefined || value === null) {
    return
  }

  const params = schema.params || {}
  const keys = Object.keys(value)

  for (const [name, details] of Object.entries(params)) {
    if (details.required && value[name] === undefined) {
      issues.push(`${location}.${name} is required`)
    }
  }

  for (const key of keys) {
    const documentedEntry = findDocumentedParamEntry(key, params)
    const details = documentedEntry?.[1]
    if (!details) {
      const suggestion = suggestParameterName(key, params)
      const message = suggestion
        ? `${location}.${key} is not documented. Did you mean ${location}.${suggestion}?`
        : `${location}.${key} is not documented for this endpoint`

      if (schema.strict) {
        issues.push(message)
      } else {
        warnings.push(message)
      }
      continue
    }

    const canonicalName = documentedEntry?.[0] || key
    if (!matchesParamType(value[key], details)) {
      issues.push(`${location}.${key} expected ${details.type}`)
    }

    const togetherWith = details.together_with || []
    if (value[key] !== undefined) {
      for (const companion of togetherWith) {
        if (value[companion] === undefined) {
          issues.push(`${location}.${canonicalName} requires ${location}.${companion}`)
        }
      }
    }
  }
}

function validateOperationArguments(resourceName, operationName, args, documentation, isAction) {
  const issues = []
  const warnings = []

  validateParameterBag("query", args.query, documentation?.query, issues, warnings)
  validateParameterBag("body", args.body, documentation?.body, issues, warnings)

  if (issues.length) {
    const error = new Error(
      `${resourceName}.${operationName} argument validation failed: ${issues.join("; ")}`
    )
    error.status = 400
    error.payload = {
      resource: resourceName,
      operation: operationName,
      kind: isAction ? "action" : "operation",
      issues,
      warnings,
      documentation
    }
    throw error
  }

  return warnings
}

const MUTATING_QUERY_HINTS = [
  "create", "update", "delete", "remove", "reset", "restart", "refresh", "regenerate",
  "assign", "extend", "import", "cancel", "retry", "rollback", "clear", "activate", "set",
  "关闭", "开启", "删除", "重置", "刷新", "导入", "取消", "回滚", "设置", "分配"
]

const BULK_QUERY_HINTS = [
  "all", "every", "fleet", "ranking", "top", "report", "overview", "summary", "batch",
  "today", "daily", "全部", "汇总", "排行", "总览", "报表", "批量", "今日", "今天"
]

const RANKING_QUERY_HINTS = [
  "ranking", "rank", "top", "leaderboard", "排行", "排名", "前几", "top"
]

const OVERVIEW_QUERY_HINTS = [
  "overview", "summary", "snapshot", "report", "总览", "概览", "汇总", "报表", "看下", "看看"
]

const BREAKDOWN_QUERY_HINTS = [
  "breakdown", "per", "each", "by", "明细", "逐个", "每个", "按", "分布"
]

const HEALTH_QUERY_HINTS = [
  "health", "healthy", "availability", "status", "capacity", "schedulable",
  "健康", "可用", "状态", "容量", "可调度", "限流"
]

const ERROR_QUERY_HINTS = [
  "error", "errors", "failure", "failed", "incident", "alert", "retry",
  "错误", "报错", "失败", "告警", "异常", "重试"
]

const EXPORT_QUERY_HINTS = [
  "export", "download", "backup", "导出", "下载", "备份"
]

const INVENTORY_QUERY_HINTS = [
  "list", "inventory", "which", "what", "有哪些", "列表", "清单", "哪些", "看下", "看看"
]

const TREND_QUERY_HINTS = [
  "trend", "history", "histogram", "distribution", "走势", "趋势", "历史", "分布"
]

const REALTIME_QUERY_HINTS = [
  "realtime", "real-time", "live", "current", "now", "实时", "当前", "现在"
]

const TODAY_QUERY_HINTS = [
  "today", "daily", "今日", "今天", "当日"
]

const EXACT_QUERY_HINTS = [
  "exact", "precise", "reconcile", "validate", "实时", "精确", "核对", "校验"
]

const LOG_QUERY_HINTS = [
  "log", "logs", "日志"
]

const ENTITY_HINTS = {
  account: ["account", "accounts", "账号", "上游账号"],
  api_key: ["api key", "api_keys", "key", "keys", "apikey", "api-key", "密钥"],
  user: ["user", "users", "用户"],
  group: ["group", "groups", "分组"],
  subscription: ["subscription", "subscriptions", "订阅"],
  proxy: ["proxy", "proxies", "代理"],
  backup: ["backup", "backups", "备份"],
  system: ["system", "version", "update", "rollback", "系统", "版本", "更新"],
  ops: ["ops", "traffic", "health", "concurrency", "监控", "健康", "并发", "告警", "日志", "错误"]
}

function extractCjkTerms(text) {
  const segments = String(text || "").match(/[\u4e00-\u9fff]{2,}/g) || []
  const terms = new Set()

  for (const segment of segments) {
    terms.add(segment)
    const maxSize = Math.min(4, segment.length)
    for (let size = 2; size <= maxSize; size += 1) {
      for (let index = 0; index <= segment.length - size; index += 1) {
        terms.add(segment.slice(index, index + size))
      }
    }
  }

  return [...terms]
}

function normalizeSearchTerms(query) {
  const raw = String(query || "").toLowerCase()
  const pieces = raw
    .split(/[\s,，。.!?、/\\:_-]+/)
    .map((term) => term.trim())
    .filter(Boolean)

  const hintTerms = [
    ...Object.values(ENTITY_HINTS).flat(),
    ...MUTATING_QUERY_HINTS,
    ...BULK_QUERY_HINTS,
    ...RANKING_QUERY_HINTS,
    ...OVERVIEW_QUERY_HINTS,
    ...BREAKDOWN_QUERY_HINTS,
    ...HEALTH_QUERY_HINTS,
    ...ERROR_QUERY_HINTS,
    ...EXPORT_QUERY_HINTS,
    ...INVENTORY_QUERY_HINTS,
    ...TREND_QUERY_HINTS,
    ...REALTIME_QUERY_HINTS,
    ...TODAY_QUERY_HINTS,
    ...EXACT_QUERY_HINTS,
    ...LOG_QUERY_HINTS
  ].filter((term) => raw.includes(term))

  return [...new Set([raw, ...pieces, ...hintTerms, ...extractCjkTerms(raw)])]
}

function includesAny(text, terms) {
  const haystack = String(text || "").toLowerCase()
  return terms.some((term) => haystack.includes(term))
}

function buildSearchContext(query) {
  const terms = normalizeSearchTerms(query)
  const raw = String(query || "").toLowerCase()
  let primaryEntity = null
  for (const [entity, hints] of Object.entries(ENTITY_HINTS)) {
    if (includesAny(raw, hints)) {
      primaryEntity = entity
      break
    }
  }

  return {
    query,
    raw,
    terms,
    wantsMutation: includesAny(raw, MUTATING_QUERY_HINTS),
    wantsBulk: includesAny(raw, BULK_QUERY_HINTS),
    wantsRanking: includesAny(raw, RANKING_QUERY_HINTS),
    wantsOverview: includesAny(raw, OVERVIEW_QUERY_HINTS),
    wantsBreakdown: includesAny(raw, BREAKDOWN_QUERY_HINTS),
    wantsHealth: includesAny(raw, HEALTH_QUERY_HINTS),
    wantsErrors: includesAny(raw, ERROR_QUERY_HINTS),
    wantsExport: includesAny(raw, EXPORT_QUERY_HINTS),
    wantsInventory: includesAny(raw, INVENTORY_QUERY_HINTS),
    wantsTrend: includesAny(raw, TREND_QUERY_HINTS),
    wantsRealtime: includesAny(raw, REALTIME_QUERY_HINTS),
    wantsToday: includesAny(raw, TODAY_QUERY_HINTS),
    wantsExact: includesAny(raw, EXACT_QUERY_HINTS),
    wantsLogs: includesAny(raw, LOG_QUERY_HINTS),
    primaryEntity
  }
}

function countTermHits(text, terms) {
  const haystack = String(text || "").toLowerCase()
  if (!haystack) {
    return 0
  }

  return terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
}

function scorePreferredFor(preferredFor, terms) {
  return (preferredFor || []).reduce((sum, phrase) => {
    const hits = countTermHits(phrase, terms)
    return sum + (hits > 0 ? 3 + hits : 0)
  }, 0)
}

function operationTargetsSingleRecord(operation, documentation) {
  return Boolean(operation.path_params?.length) && !documentation.supports_bulk
}

function scoreEndpointResult(resource, operation, context) {
  const documentation = operation.documentation || {}
  const baseScore =
    countTermHits(resource.name, context.terms) * 3 +
    countTermHits(operation.name, context.terms) * 4 +
    countTermHits(operation.description, context.terms) * 2 +
    countTermHits(operation.path, context.terms) +
    countTermHits(JSON.stringify(documentation), context.terms)

  let score = baseScore + scorePreferredFor(documentation.preferred_for, context.terms)

  if (!context.wantsMutation && documentation.mutating) {
    score -= 5
  }
  if (context.wantsBulk && documentation.supports_bulk) {
    score += 4
  }
  if (context.wantsBulk && documentation.avoids_n_plus_one) {
    score += 4
  }
  if (context.wantsBulk && operationTargetsSingleRecord(operation, documentation)) {
    score -= 5
  }
  if (context.primaryEntity && String(documentation.returns_breakdown_by || "").includes(context.primaryEntity)) {
    score += 5
  }
  if (context.primaryEntity === "account" && resource.name === "accounts") {
    score += 3
  }
  if (context.primaryEntity === "api_key" && String(operation.name).includes("api_keys")) {
    score += 3
  }
  if (context.wantsExact && documentation.freshness === "realtime") {
    score += 3
  }
  if (context.wantsRealtime && documentation.freshness === "realtime") {
    score += 4
  }
  if (context.wantsRealtime && documentation.freshness === "preaggregated_may_lag") {
    score -= 1
  }
  if (context.wantsOverview && documentation.returns_breakdown_by === "summary") {
    score += 4
  }
  if (context.wantsOverview && documentation.returns_breakdown_by && documentation.returns_breakdown_by !== "summary" && !documentation.supports_bulk) {
    score -= 2
  }
  if (context.wantsBreakdown && documentation.returns_breakdown_by && documentation.returns_breakdown_by !== "summary") {
    score += 4
  }
  if (context.wantsBreakdown && documentation.returns_breakdown_by === "summary") {
    score -= 3
  }
  if (context.wantsRanking && (String(operation.name).includes("ranking") || scorePreferredFor(documentation.preferred_for, ["ranking", "排行", "排名"]) > 0)) {
    score += 6
  }
  if (context.wantsRanking && documentation.returns_breakdown_by === "summary") {
    score -= 2
  }
  if (context.wantsHealth && (resource.name === "ops" || includesAny(`${operation.name} ${operation.description}`, ["health", "availability", "capacity", "status", "schedulable", "健康", "可用", "容量", "限流"]))) {
    score += 5
  }
  if (context.wantsErrors && includesAny(`${resource.name} ${operation.name} ${operation.description}`, ["error", "alert", "retry", "resolve", "错误", "告警", "异常"])) {
    score += 6
  }
  if (context.wantsExport && includesAny(`${operation.name} ${operation.path}`, ["export", "download", "backup", "导出", "下载", "备份"])) {
    score += 5
  }
  if (context.wantsInventory && includesAny(`${operation.name} ${operation.path}`, ["list", "get_all", "search", "/all", "列表", "清单"])) {
    score += 4
  }
  if (context.wantsTrend && includesAny(`${operation.name} ${operation.path} ${operation.description}`, ["trend", "histogram", "distribution", "走势", "趋势", "分布"])) {
    score += 6
  }
  if (context.wantsLogs && includesAny(`${operation.name} ${operation.path} ${operation.description}`, ["log", "logs", "日志"])) {
    score += 5
  }
  if (context.wantsToday && scorePreferredFor(documentation.preferred_for, ["today", "今日", "今天"]) > 0) {
    score += 2
  }

  return score
}

function scoreRecipe(recipe, context) {
  const haystack = [
    recipe.id,
    recipe.title,
    recipe.summary,
    ...(recipe.intent_aliases || []),
    ...(recipe.output_shape || []),
    ...(recipe.avoid_patterns || [])
  ].join(" ").toLowerCase()

  let score = countTermHits(haystack, context.terms) * 3

  for (const alias of recipe.intent_aliases || []) {
    const hits = countTermHits(alias, context.terms)
    if (hits > 0) {
      score += 5 + hits
    }
  }

  if (!context.wantsMutation && recipe.read_only) {
    score += 2
  }
  if (context.wantsBulk && recipe.avoids_n_plus_one) {
    score += 4
  }
  if (context.wantsRanking && includesAny(recipe.title, ["ranking", "排行", "排名"])) {
    score += 4
  }
  if (context.wantsOverview && includesAny(recipe.title, ["overview", "summary", "概览", "总览"])) {
    score += 3
  }
  if (context.wantsErrors && includesAny(recipe.title, ["error", "triage", "错误", "告警"])) {
    score += 4
  }
  if (context.wantsErrors && (recipe.preferred_endpoints || []).some((entry) =>
    includesAny(`${entry.resource} ${entry.name}`, ["error", "alert", "log", "错误", "告警", "日志"])
  )) {
    score += 6
  }
  if (context.wantsErrors && (recipe.output_shape || []).some((field) =>
    includesAny(field, ["request_error", "upstream_error"])
  )) {
    score += 5
  } else if (context.wantsErrors && (recipe.output_shape || []).some((field) => field === "error")) {
    score += 1
  }
  if (context.wantsErrors && !context.primaryEntity && includesAny(recipe.id, ["request_error", "upstream_error"])) {
    score += 3
  }
  if (context.wantsHealth && includesAny(recipe.title, ["health", "availability", "capacity", "健康", "可用", "容量"])) {
    score += 4
  }
  if (context.wantsHealth && (recipe.preferred_endpoints || []).some((entry) =>
    includesAny(`${entry.resource} ${entry.name}`, ["health", "availability", "capacity", "concurrency", "schedulable", "健康", "可用", "容量", "并发"])
  )) {
    score += 4
  }
  if (context.wantsInventory && includesAny(`${recipe.title} ${recipe.summary}`, ["inventory", "list", "status", "列表", "清单", "状态"])) {
    score += 3
  }
  if (context.primaryEntity && includesAny(recipe.title, ENTITY_HINTS[context.primaryEntity] || [])) {
    score += 4
  }

  return score
}

function humanizeEntity(entity) {
  const labels = {
    account: "account",
    api_key: "API key",
    user: "user",
    group: "group",
    subscription: "subscription",
    proxy: "proxy",
    backup: "backup",
    system: "system",
    ops: "ops"
  }

  return labels[entity] || entity
}

function buildRecipeWhy(recipe, context) {
  const reasons = []

  if (countTermHits((recipe.intent_aliases || []).join(" "), context.terms) > 0) {
    reasons.push("Intent aliases match the request closely.")
  }
  if (!context.wantsMutation && recipe.read_only) {
    reasons.push("This is a read-only workflow for inspection tasks.")
  }
  if (context.wantsBulk && recipe.avoids_n_plus_one) {
    reasons.push("It prefers batch-safe endpoints and avoids N+1 loops.")
  }
  if (context.primaryEntity && (recipe.output_shape || []).some((field) => field.includes(context.primaryEntity) || field.includes(context.primaryEntity.replace("_", "")))) {
    reasons.push(`It produces ${humanizeEntity(context.primaryEntity)}-level rows.`)
  }

  return reasons.slice(0, 4)
}

function buildEndpointWhy(resource, operation, context) {
  const documentation = operation.documentation || {}
  const reasons = []

  if (scorePreferredFor(documentation.preferred_for, context.terms) > 0) {
    reasons.push("Documentation marks it as a preferred fit for this task.")
  }
  if (context.wantsBulk && documentation.avoids_n_plus_one) {
    reasons.push("It avoids per-record loops.")
  }
  if (context.wantsBulk && documentation.supports_bulk) {
    reasons.push("It supports bulk retrieval.")
  }
  if (documentation.returns_breakdown_by && documentation.returns_breakdown_by !== "summary" && context.wantsBreakdown) {
    reasons.push(`It returns a ${documentation.returns_breakdown_by} breakdown.`)
  }
  if (documentation.returns_breakdown_by === "summary" && context.wantsOverview) {
    reasons.push("It returns an aggregate summary view.")
  }
  if (documentation.freshness === "realtime" && (context.wantsRealtime || context.wantsExact)) {
    reasons.push("It is documented as realtime.")
  }
  if (resource.name === "ops" && context.wantsHealth) {
    reasons.push("It belongs to the ops monitoring surface.")
  }

  return reasons.slice(0, 4)
}

function buildRecipeResult(recipe, score) {
  return {
    score,
    kind: "recipe",
    id: recipe.id,
    title: recipe.title,
    summary: recipe.summary,
    read_only: recipe.read_only,
    avoids_n_plus_one: recipe.avoids_n_plus_one || false,
    output_shape: recipe.output_shape || [],
    why: [],
    preferred_endpoints: recipe.preferred_endpoints || [],
    fallback_endpoints: recipe.fallback_endpoints || [],
    avoid_patterns: recipe.avoid_patterns || [],
    workflow: recipe.workflow || []
  }
}

function summarizeRecommendedMatch(match) {
  if (!match) {
    return null
  }

  if (match.kind === "recipe") {
    return {
      kind: "recipe",
      label: match.title,
      id: match.id,
      why: match.why || [],
      first_step: match.workflow?.[0] || null,
      avoid_patterns: (match.avoid_patterns || []).slice(0, 3)
    }
  }

  return {
    kind: match.kind,
    label: `${match.resource}.${match.name}`,
    resource: match.resource,
    name: match.name,
    why: match.why || [],
    call_template: match.call_template || null,
    freshness: match.documentation?.freshness || null
  }
}

function buildCapabilitySearchPayload({ query, limit = 10, includeExamples = false }) {
  const context = buildSearchContext(query)
  const resources = listResources()
  const matches = []

  for (const recipe of listTaskRecipes()) {
    const score = scoreRecipe(recipe, context)
    if (score > 0) {
      const result = buildRecipeResult(recipe, score)
      result.why = buildRecipeWhy(recipe, context)
      matches.push(result)
    }
  }

  for (const resource of resources) {
    const resourceHaystack = [
      resource.name,
      resource.description,
      ...(resource.notes || [])
    ].join(" ").toLowerCase()

    for (const [operationName, operation] of Object.entries(resource.operations || {})) {
      if (!operation) {
        continue
      }
      const haystack = [
        resourceHaystack,
        operationName,
        operation.method,
        operation.path,
        JSON.stringify(operation.documentation || {})
      ].join(" ").toLowerCase()
      const score = scoreEndpointResult(resource, {
        ...operation,
        name: operationName
      }, context)
      if (score > 0) {
        matches.push({
          score,
          resource: resource.name,
          kind: "operation",
          name: operationName,
          method: operation.method,
          path: operation.path,
          description: resource.description,
          documentation: operation.documentation || null,
          call_template: operation.call_template,
          why: buildEndpointWhy(resource, {
            ...operation,
            name: operationName
          }, context),
          related_recipes: resource.related_recipes || [],
          examples: includeExamples ? (operation.examples || []) : []
        })
      }
    }

    for (const [actionName, action] of Object.entries(resource.actions || {})) {
      const haystack = [
        resourceHaystack,
        actionName,
        action.description,
        action.method,
        action.path,
        JSON.stringify(action.documentation || {})
      ].join(" ").toLowerCase()
      const score = scoreEndpointResult(resource, {
        ...action,
        name: actionName
      }, context)
      if (score > 0) {
        matches.push({
          score,
          resource: resource.name,
          kind: "action",
          name: actionName,
          method: action.method,
          path: action.path,
          description: action.description,
          documentation: action.documentation || null,
          call_template: action.call_template,
          why: buildEndpointWhy(resource, {
            ...action,
            name: actionName
          }, context),
          related_recipes: resource.related_recipes || [],
          examples: includeExamples ? (action.examples || []) : []
        })
      }
    }
  }

  matches.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }
    if (left.kind === "recipe" && right.kind !== "recipe") {
      return -1
    }
    if (left.kind !== "recipe" && right.kind === "recipe") {
      return 1
    }
    const leftLabel = left.kind === "recipe" ? `recipe.${left.id}` : `${left.resource}.${left.name}`
    const rightLabel = right.kind === "recipe" ? `recipe.${right.id}` : `${right.resource}.${right.name}`
    return leftLabel.localeCompare(rightLabel)
  })

  return {
    tool: "sub2api_admin_find_capability",
    query,
    limit,
    context: {
      wants_mutation: context.wantsMutation,
      wants_bulk: context.wantsBulk,
      wants_ranking: context.wantsRanking,
      wants_overview: context.wantsOverview,
      wants_breakdown: context.wantsBreakdown,
      wants_health: context.wantsHealth,
      wants_errors: context.wantsErrors,
      wants_export: context.wantsExport,
      wants_inventory: context.wantsInventory,
      wants_trend: context.wantsTrend,
      wants_realtime: context.wantsRealtime,
      wants_today: context.wantsToday,
      wants_exact: context.wantsExact,
      wants_logs: context.wantsLogs,
      primary_entity: context.primaryEntity
    },
    recommended: summarizeRecommendedMatch(matches[0] || null),
    results: matches.slice(0, limit)
  }
}

if (capabilityQuery) {
  process.stdout.write(`${JSON.stringify(buildCapabilitySearchPayload({
    query: capabilityQuery,
    limit: capabilityLimit,
    includeExamples: capabilityIncludeExamples
  }), null, 2)}\n`)
  process.exit(0)
}

function buildDescribeResourcesPayload(resourceName, requestedView) {
  const view = normalizeDescribeView(resourceName, requestedView)
  const resources = listResources()

  if (resourceName) {
    const resource = resources.find((entry) => entry.name === resourceName) || null
    return {
      tool: "sub2api_admin_describe_resources",
      resource: resourceName,
      view,
      tips: getDiscoveryTips(),
      data: view === "compact" && resource ? compactResourceSummary(resource) : resource
    }
  }

  const data = view === "compact"
    ? {
        resource_count: resources.length,
        resources: resources.map(compactResourceSummary)
      }
    : {
        resource_count: resources.length,
        resources
      }

  return {
    tool: "sub2api_admin_describe_resources",
    view,
    tips: getDiscoveryTips(),
    data
  }
}

async function executeOperation(toolName, args) {
  if (toolName === "sub2api_admin_find_capability") {
    return buildSuccessResult(buildCapabilitySearchPayload({
      query: args.query,
      limit: args.limit || 10,
      includeExamples: Boolean(args.include_examples)
    }))
  }

  const resourceName = requireString(args.resource, "resource")
  const resource = getResource(resourceName)
  if (!resource) {
    throw new Error(`Unknown resource: ${resourceName}`)
  }

  if (toolName === "sub2api_admin_describe_resources") {
    return buildSuccessResult(buildDescribeResourcesPayload(resourceName, args.view))
  }

  if (toolName === "sub2api_admin_list") {
    return runNamedOperation(toolName, resourceName, "list", resource.list, args, args.body, false)
  }

  if (toolName === "sub2api_admin_get") {
    return runNamedOperation(toolName, resourceName, "get", resource.get, args, args.body, false)
  }

  if (toolName === "sub2api_admin_create") {
    return runNamedOperation(toolName, resourceName, "create", resource.create, args, args.body, false)
  }

  if (toolName === "sub2api_admin_update") {
    return runNamedOperation(toolName, resourceName, "update", resource.update, args, args.body, false)
  }

  if (toolName === "sub2api_admin_delete") {
    return runNamedOperation(toolName, resourceName, "delete", resource.delete, args, args.body, false)
  }

  if (toolName === "sub2api_admin_action") {
    const actionName = requireString(args.action, "action")
    const action = resource.actions?.[actionName]
    if (!action) {
      throw new Error(`Resource ${resourceName} does not define action ${actionName}`)
    }
    return runNamedOperation(toolName, resourceName, actionName, action, args, args.body, true)
  }

  throw new Error(`Unsupported tool: ${toolName}`)
}

function requireString(value, fieldName) {
  const normalized = String(value || "").trim()
  if (!normalized) {
    throw new Error(`Missing required field: ${fieldName}`)
  }
  return normalized
}

const SENSITIVE_FIELD_NAMES = new Set([
  "access_token",
  "refresh_token",
  "password",
  "secret_access_key",
  "client_secret",
  "session_token",
  "temp_token",
  "cookie",
  "authorization"
])

function summarizeCredentials(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "<redacted>"
  }

  return {
    redacted: true,
    keys: Object.keys(value).sort()
  }
}

function sanitizeSensitiveData(value, key = "") {
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSensitiveData(entry))
  }

  if (typeof value !== "object") {
    if (SENSITIVE_FIELD_NAMES.has(key)) {
      return "<redacted>"
    }
    return value
  }

  const result = {}
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (entryKey === "credentials") {
      result[entryKey] = summarizeCredentials(entryValue)
      continue
    }

    if (SENSITIVE_FIELD_NAMES.has(entryKey)) {
      result[entryKey] = "<redacted>"
      continue
    }

    result[entryKey] = sanitizeSensitiveData(entryValue, entryKey)
  }

  return result
}

function sanitizeResponseData(resourceName, operationName, data) {
  if (resourceName === "accounts" && (operationName === "list" || operationName === "get")) {
    return sanitizeSensitiveData(data)
  }

  return data
}

async function runNamedOperation(toolName, resourceName, operationName, operation, args, body, isAction) {
  if (!operation) {
    throw new Error(`Resource ${resourceName} does not support ${operationName}`)
  }

  const documentation = getOperationDocumentation(resourceName, operationName, isAction)
  const warnings = validateOperationArguments(resourceName, operationName, args, documentation, isAction)
  const path = resolvePathTemplate(operation.path, args)
  const result = await performHttpRequest({
    method: operation.method,
    path,
    query: args.query,
    body
  })
  const sanitizedData = sanitizeResponseData(resourceName, operationName, result.data)

  return buildSuccessResult({
    tool: toolName,
    resource: resourceName,
    operation: operationName,
    method: operation.method,
    path,
    query: args.query || null,
    body: body === undefined ? null : body,
    status: result.status,
    message: result.message,
    data: sanitizedData,
    warnings: warnings.length ? warnings : null,
    auth_mode: authState.mode || getAuthMode()
  })
}

function buildSuccessResult(payload) {
  return {
    structuredContent: payload,
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }]
  }
}

function buildErrorResult(error) {
  const payload = {
    error: String(error.message || error),
    status: error.status || null,
    details: error.payload || null
  }

  return {
    isError: true,
    structuredContent: payload,
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }]
  }
}

function writeToStderr(message) {
  process.stderr.write(`[sub2api-admin-mcp] ${message}\n`)
}

function createMcpServer() {
  const server = new McpServer(SERVER_INFO)

  server.registerTool("sub2api_admin_describe_resources", {
    description: "Describe the supported admin resources, CRUD coverage, and named actions for this MCP server.",
    inputSchema: describeResourcesArgsSchema
  }, async ({ resource, view }) => {
    try {
      if (!resource) {
        return buildSuccessResult(buildDescribeResourcesPayload(null, view))
      }

      return await executeOperation("sub2api_admin_describe_resources", { resource, view })
    } catch (error) {
      return buildErrorResult(error)
    }
  })

  server.registerTool("sub2api_admin_list", {
    description: "Run a list or collection query for an admin resource.",
    inputSchema: listArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_list", args))

  server.registerTool("sub2api_admin_get", {
    description: "Get a single admin resource record or singleton config resource.",
    inputSchema: getArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_get", args))

  server.registerTool("sub2api_admin_create", {
    description: "Create a new admin resource record.",
    inputSchema: createArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_create", args))

  server.registerTool("sub2api_admin_update", {
    description: "Update an admin resource record or singleton config resource.",
    inputSchema: updateArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_update", args))

  server.registerTool("sub2api_admin_delete", {
    description: "Delete an admin resource record.",
    inputSchema: deleteArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_delete", args))

  server.registerTool("sub2api_admin_action", {
    description: "Run a named non-CRUD admin action such as stats, batch jobs, resets, or OAuth helpers.",
    inputSchema: actionArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_action", args))

  server.registerTool("sub2api_admin_find_capability", {
    description: "Search resources and actions by intent, keyword, path, or parameter name and return recommended MCP call templates.",
    inputSchema: capabilitySearchArgsSchema
  }, async (args) => executeWithResult("sub2api_admin_find_capability", args))

  return server
}

async function executeWithResult(toolName, args) {
  try {
    return await executeOperation(toolName, args)
  } catch (error) {
    return buildErrorResult(error)
  }
}

async function main() {
  const server = createMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  writeToStderr(`server error: ${error.stack || error.message}`)
  process.exit(1)
})
