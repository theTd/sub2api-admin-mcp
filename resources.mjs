import { coreResources } from "./resources-core.mjs"
import { managementResources } from "./resources-management.mjs"
import { serviceResources } from "./resources-services.mjs"
import { opsResources } from "./resources-ops.mjs"
import { GLOBAL_DISCOVERY_TIPS, getResourceDocs } from "./resource-docs.mjs"
import { getTaskRecipesForResource } from "./task-recipes.mjs"

export const adminResources = {
  ...coreResources,
  ...managementResources,
  ...serviceResources,
  ...opsResources
}

function collectPathParams(path) {
  const matches = path.match(/:([A-Za-z0-9_]+)/g) || []
  return matches.map((match) => match.slice(1))
}

function summarizeOperation(operation) {
  if (!operation) {
    return null
  }

  return {
    method: operation.method,
    path: operation.path,
    path_params: collectPathParams(operation.path)
  }
}

function buildPathParamTemplate(pathParams) {
  if (!pathParams.length) {
    return null
  }

  const values = Object.fromEntries(pathParams.map((name) => [name, `<${name}>`]))
  if (pathParams.length === 1 && pathParams[0] === "id") {
    return { id: "<id>" }
  }

  if (pathParams.includes("id")) {
    const pathParamValues = { ...values }
    delete pathParamValues.id
    return Object.keys(pathParamValues).length
      ? { id: "<id>", path_params: pathParamValues }
      : { id: "<id>" }
  }

  return { path_params: values }
}

function buildRequiredPayload(params) {
  if (!params || !Object.keys(params).length) {
    return null
  }

  const requiredEntries = Object.entries(params)
    .filter(([, details]) => Boolean(details.required))
    .map(([name, details]) => [name, details.example ?? `<${name}>`])

  return requiredEntries.length ? Object.fromEntries(requiredEntries) : null
}

function mergeTemplateBag(requiredBag, starterBag) {
  if (!requiredBag && !starterBag) {
    return null
  }

  return {
    ...(starterBag || {}),
    ...(requiredBag || {})
  }
}

function buildCallTemplate(tool, resourceName, operationName, summary, documentation) {
  const args = { resource: resourceName }
  if (tool === "sub2api_admin_action") {
    args.action = operationName
  }

  const pathTemplate = buildPathParamTemplate(summary.path_params || [])
  if (pathTemplate?.id) {
    args.id = pathTemplate.id
  }
  if (pathTemplate?.path_params) {
    args.path_params = pathTemplate.path_params
  }

  const query = buildRequiredPayload(documentation?.query?.params)
  const starterQuery = documentation?.starter_args?.query || null
  const mergedQuery = mergeTemplateBag(query, starterQuery)
  if (mergedQuery) {
    args.query = mergedQuery
  }

  const body = buildRequiredPayload(documentation?.body?.params)
  const starterBody = documentation?.starter_args?.body || null
  const mergedBody = mergeTemplateBag(body, starterBody)
  if (mergedBody) {
    args.body = mergedBody
  }

  if (documentation?.starter_args?.id !== undefined && args.id === undefined) {
    args.id = documentation.starter_args.id
  }

  if (documentation?.starter_args?.path_params) {
    args.path_params = {
      ...(documentation.starter_args.path_params || {}),
      ...(args.path_params || {})
    }
  }

  return {
    tool,
    arguments: args
  }
}

function buildExamples(tool, resourceName, operationName, documentation) {
  if (!documentation?.examples?.length) {
    return []
  }

  return documentation.examples.map((example) => ({
    title: example.title,
    invocation: {
      tool,
      arguments: {
        resource: resourceName,
        ...(tool === "sub2api_admin_action" ? { action: operationName } : {}),
        ...(example.args || {})
      }
    }
  }))
}

function buildOperationDocumentation(resourceName, operationName, summary, documentation, tool) {
  const details = {
    ...summary,
    documentation: documentation || null,
    call_template: buildCallTemplate(tool, resourceName, operationName, summary, documentation)
  }

  const examples = buildExamples(tool, resourceName, operationName, documentation)
  if (examples.length) {
    details.examples = examples
  }

  return details
}

function summarizeResource(name, spec) {
  const resourceDocs = getResourceDocs(name)
  const actions = {}

  for (const [actionName, action] of Object.entries(spec.actions || {})) {
    const actionSummary = {
      method: action.method,
      path: action.path,
      path_params: collectPathParams(action.path),
      description: action.description || ""
    }
    actions[actionName] = buildOperationDocumentation(
      name,
      actionName,
      actionSummary,
      resourceDocs?.actions?.[actionName] || null,
      "sub2api_admin_action"
    )
  }

  return {
    name,
    description: spec.description,
    notes: resourceDocs?.notes || [],
    related_recipes: getTaskRecipesForResource(name).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      summary: recipe.summary
    })),
    operations: {
      list: spec.list
        ? buildOperationDocumentation(
            name,
            "list",
            summarizeOperation(spec.list),
            resourceDocs?.operations?.list || null,
            "sub2api_admin_list"
          )
        : null,
      get: spec.get
        ? buildOperationDocumentation(
            name,
            "get",
            summarizeOperation(spec.get),
            resourceDocs?.operations?.get || null,
            "sub2api_admin_get"
          )
        : null,
      create: spec.create
        ? buildOperationDocumentation(
            name,
            "create",
            summarizeOperation(spec.create),
            resourceDocs?.operations?.create || null,
            "sub2api_admin_create"
          )
        : null,
      update: spec.update
        ? buildOperationDocumentation(
            name,
            "update",
            summarizeOperation(spec.update),
            resourceDocs?.operations?.update || null,
            "sub2api_admin_update"
          )
        : null,
      delete: spec.delete
        ? buildOperationDocumentation(
            name,
            "delete",
            summarizeOperation(spec.delete),
            resourceDocs?.operations?.delete || null,
            "sub2api_admin_delete"
          )
        : null
    },
    actions
  }
}

export function getResource(name) {
  return adminResources[name] || null
}

export function getResourceDocumentation(name) {
  return getResourceDocs(name)
}

export function listResources() {
  return Object.entries(adminResources).map(([name, spec]) => summarizeResource(name, spec))
}

export function getDiscoveryTips() {
  return GLOBAL_DISCOVERY_TIPS.slice()
}
