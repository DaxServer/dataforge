import { nodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'
import { wikibaseConfigService } from '@backend/services/wikibase-config.service'
import { handleWikibaseError, toErrorResponse } from '@backend/utils/wikibase-error-handler'
import { Elysia, t } from 'elysia'

/**
 * Wikibase instance management API endpoints
 */
export const wikibaseInstancesApi = new Elysia({ prefix: '/wikibase/instances' })
  .get(
    '/',
    async ({ status }) => {
      try {
        const instances = await wikibaseConfigService.getInstances()
        return {
          success: true,
          data: instances,
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, { operation: 'get_instances' })
        const errorResponse = toErrorResponse(wikibaseError)
        return status(500, errorResponse)
      }
    },
    {
      detail: {
        summary: 'Get all Wikibase instances',
        description: 'Retrieve all configured Wikibase instances (pre-defined and custom)',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )

  .get(
    '/:instanceId',
    async ({ params: { instanceId }, status }) => {
      try {
        const instance = await wikibaseConfigService.getInstance(instanceId)
        return {
          success: true,
          data: instance,
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, {
          instanceId,
          operation: 'get_instance',
        })
        const errorResponse = toErrorResponse(wikibaseError)
        const errorMessage = error instanceof Error ? error.message : ''
        return status(errorMessage.includes('not found') ? 404 : 500, errorResponse)
      }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      detail: {
        summary: 'Get Wikibase instance by ID',
        description: 'Retrieve a specific Wikibase instance configuration',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )

  .post(
    '/',
    async ({ body, status }) => {
      try {
        await wikibaseConfigService.addInstance(body)

        // If nodemw configuration is provided, create nodemw client
        if (body.nodemwConfig || body.features) {
          nodemwWikibaseService.createClient(body)
        }

        return {
          success: true,
          message: 'Instance added successfully',
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, {
          instanceId: body.id,
          operation: 'add_instance',
        })
        const errorResponse = toErrorResponse(wikibaseError)
        return status(400, errorResponse)
      }
    },
    {
      body: t.Object({
        id: t.String({ description: 'Unique instance identifier' }),
        name: t.String({ description: 'Human-readable instance name' }),
        baseUrl: t.String({ description: 'Base URL for the Wikibase REST API' }),
        userAgent: t.String({ description: 'User agent string for API requests' }),
        authToken: t.Optional(t.String({ description: 'Authentication token (optional)' })),
        isDefault: t.Optional(t.Boolean({ description: 'Whether this is the default instance' })),
        metadata: t.Optional(
          t.Object({
            description: t.Optional(t.String()),
            language: t.Optional(t.String()),
            version: t.Optional(t.String()),
          }),
        ),
        nodemwConfig: t.Optional(
          t.Object({
            protocol: t.Union([t.Literal('http'), t.Literal('https')], {
              description: 'Protocol to use',
            }),
            server: t.String({ description: 'Server hostname' }),
            path: t.String({ description: 'API path' }),
            concurrency: t.Optional(t.Number({ description: 'Number of concurrent requests' })),
            debug: t.Optional(t.Boolean({ description: 'Enable debug mode' })),
            dryRun: t.Optional(t.Boolean({ description: 'Enable dry run mode' })),
            username: t.Optional(t.String({ description: 'Username for authentication' })),
            password: t.Optional(t.String({ description: 'Password for authentication' })),
            domain: t.Optional(t.String({ description: 'Domain for authentication' })),
          }),
        ),
        features: t.Optional(
          t.Object({
            hasWikidata: t.Boolean({ description: 'Whether instance has Wikidata integration' }),
            hasConstraints: t.Boolean({ description: 'Whether instance supports constraints' }),
            hasSearch: t.Boolean({ description: 'Whether instance supports search' }),
            hasStatements: t.Boolean({ description: 'Whether instance supports statements' }),
            supportedDataTypes: t.Array(t.String(), { description: 'Supported data types' }),
            apiVersion: t.String({ description: 'API version' }),
          }),
        ),
      }),
      detail: {
        summary: 'Add custom Wikibase instance',
        description: 'Add a new custom Wikibase instance configuration',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )

  .put(
    '/:instanceId',
    async ({ params: { instanceId }, body, status }) => {
      try {
        await wikibaseConfigService.updateInstance(instanceId, body)

        // If nodemw configuration is provided, update nodemw client
        if (body.nodemwConfig || body.features) {
          const updatedInstance = await wikibaseConfigService.getInstance(instanceId)
          if (updatedInstance) {
            nodemwWikibaseService.createClient(updatedInstance)
          }
        }

        return {
          success: true,
          message: 'Instance updated successfully',
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, {
          instanceId,
          operation: 'update_instance',
        })
        const errorResponse = toErrorResponse(wikibaseError)
        return status(400, errorResponse)
      }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      body: t.Partial(
        t.Object({
          name: t.String({ description: 'Human-readable instance name' }),
          baseUrl: t.String({ description: 'Base URL for the Wikibase REST API' }),
          userAgent: t.String({ description: 'User agent string for API requests' }),
          authToken: t.String({ description: 'Authentication token' }),
          isDefault: t.Boolean({ description: 'Whether this is the default instance' }),
          metadata: t.Object({
            description: t.Optional(t.String()),
            language: t.Optional(t.String()),
            version: t.Optional(t.String()),
          }),
          nodemwConfig: t.Object({
            protocol: t.Union([t.Literal('http'), t.Literal('https')], {
              description: 'Protocol to use',
            }),
            server: t.String({ description: 'Server hostname' }),
            path: t.String({ description: 'API path' }),
            concurrency: t.Optional(t.Number({ description: 'Number of concurrent requests' })),
            debug: t.Optional(t.Boolean({ description: 'Enable debug mode' })),
            dryRun: t.Optional(t.Boolean({ description: 'Enable dry run mode' })),
            username: t.Optional(t.String({ description: 'Username for authentication' })),
            password: t.Optional(t.String({ description: 'Password for authentication' })),
            domain: t.Optional(t.String({ description: 'Domain for authentication' })),
          }),
          features: t.Object({
            hasWikidata: t.Boolean({ description: 'Whether instance has Wikidata integration' }),
            hasConstraints: t.Boolean({ description: 'Whether instance supports constraints' }),
            hasSearch: t.Boolean({ description: 'Whether instance supports search' }),
            hasStatements: t.Boolean({ description: 'Whether instance supports statements' }),
            supportedDataTypes: t.Array(t.String(), { description: 'Supported data types' }),
            apiVersion: t.String({ description: 'API version' }),
          }),
        }),
      ),
      detail: {
        summary: 'Update Wikibase instance',
        description: 'Update an existing custom Wikibase instance configuration',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )

  .delete(
    '/:instanceId',
    async ({ params: { instanceId }, status }) => {
      try {
        // Remove nodemw client if it exists
        nodemwWikibaseService.removeClient(instanceId)

        await wikibaseConfigService.removeInstance(instanceId)
        return {
          success: true,
          message: 'Instance removed successfully',
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, {
          instanceId,
          operation: 'remove_instance',
        })
        const errorResponse = toErrorResponse(wikibaseError)
        return status(400, errorResponse)
      }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      detail: {
        summary: 'Remove custom Wikibase instance',
        description: 'Remove a custom Wikibase instance configuration',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )

  .post(
    '/:instanceId/validate',
    async ({ params: { instanceId }, status }) => {
      try {
        const instance = await wikibaseConfigService.getInstance(instanceId)
        const validation = await wikibaseConfigService.validateInstanceWithConnectivity(instance)

        return {
          success: true,
          data: validation,
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, {
          instanceId,
          operation: 'validate_instance',
        })
        const errorResponse = toErrorResponse(wikibaseError)
        const errorMessage = error instanceof Error ? error.message : ''
        return status(errorMessage.includes('not found') ? 404 : 500, errorResponse)
      }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      detail: {
        summary: 'Validate Wikibase instance',
        description: 'Validate instance configuration and test connectivity',
        tags: ['Wikibase', 'Instances', 'Validation'],
      },
    },
  )

  .post(
    '/validate',
    async ({ body }) => {
      try {
        const validation = await wikibaseConfigService.validateInstanceWithConnectivity(body)

        return {
          success: true,
          data: validation,
        }
      } catch (error) {
        throw new Error(
          `Failed to validate instance configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
    {
      body: t.Object({
        id: t.String({ description: 'Unique instance identifier' }),
        name: t.String({ description: 'Human-readable instance name' }),
        baseUrl: t.String({ description: 'Base URL for the Wikibase REST API' }),
        userAgent: t.String({ description: 'User agent string for API requests' }),
        authToken: t.Optional(t.String({ description: 'Authentication token (optional)' })),
        isDefault: t.Optional(t.Boolean({ description: 'Whether this is the default instance' })),
        metadata: t.Optional(
          t.Object({
            description: t.Optional(t.String()),
            language: t.Optional(t.String()),
            version: t.Optional(t.String()),
          }),
        ),
        nodemwConfig: t.Optional(
          t.Object({
            protocol: t.Union([t.Literal('http'), t.Literal('https')], {
              description: 'Protocol to use',
            }),
            server: t.String({ description: 'Server hostname' }),
            path: t.String({ description: 'API path' }),
            concurrency: t.Optional(t.Number({ description: 'Number of concurrent requests' })),
            debug: t.Optional(t.Boolean({ description: 'Enable debug mode' })),
            dryRun: t.Optional(t.Boolean({ description: 'Enable dry run mode' })),
            username: t.Optional(t.String({ description: 'Username for authentication' })),
            password: t.Optional(t.String({ description: 'Password for authentication' })),
            domain: t.Optional(t.String({ description: 'Domain for authentication' })),
          }),
        ),
        features: t.Optional(
          t.Object({
            hasWikidata: t.Boolean({ description: 'Whether instance has Wikidata integration' }),
            hasConstraints: t.Boolean({ description: 'Whether instance supports constraints' }),
            hasSearch: t.Boolean({ description: 'Whether instance supports search' }),
            hasStatements: t.Boolean({ description: 'Whether instance supports statements' }),
            supportedDataTypes: t.Array(t.String(), { description: 'Supported data types' }),
            apiVersion: t.String({ description: 'API version' }),
          }),
        ),
      }),
      detail: {
        summary: 'Validate instance configuration',
        description:
          'Validate a Wikibase instance configuration and test connectivity without saving',
        tags: ['Wikibase', 'Instances', 'Validation'],
      },
    },
  )

  .get(
    '/:instanceId/health',
    async ({ params: { instanceId } }) => {
      try {
        const healthCheck = await wikibaseConfigService.performHealthCheck(instanceId)

        return {
          success: true,
          data: healthCheck,
        }
      } catch (error) {
        // Health check should return the result even if the instance doesn't exist
        // The health check itself will indicate the failure
        const healthCheck = {
          instanceId,
          isHealthy: false,
          lastChecked: new Date(),
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Health check failed',
        }

        return {
          success: true,
          data: healthCheck,
        }
      }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      detail: {
        summary: 'Health check for Wikibase instance',
        description: 'Perform a health check on a configured Wikibase instance',
        tags: ['Wikibase', 'Instances', 'Health'],
      },
    },
  )

  .post(
    '/:instanceId/set-default',
    async ({ params: { instanceId }, status }) => {
      try {
        await wikibaseConfigService.setDefaultInstance(instanceId)

        return {
          success: true,
          message: 'Default instance set successfully',
        }
      } catch (error) {
        const wikibaseError = handleWikibaseError(error, {
          instanceId,
          operation: 'set_default_instance',
        })
        const errorResponse = toErrorResponse(wikibaseError)
        const errorMessage = error instanceof Error ? error.message : ''
        return status(errorMessage.includes('not found') ? 404 : 500, errorResponse)
      }
    },
    {
      params: t.Object({
        instanceId: t.String({ description: 'Wikibase instance ID' }),
      }),
      detail: {
        summary: 'Set default Wikibase instance',
        description: 'Set a Wikibase instance as the default for new operations',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )

  .get(
    '/default',
    async () => {
      try {
        const defaultInstance = await wikibaseConfigService.getDefaultInstance()

        if (!defaultInstance) {
          return {
            success: true,
            data: null,
            message: 'No default instance configured',
          }
        }

        return {
          success: true,
          data: defaultInstance,
        }
      } catch (error) {
        throw new Error(
          `Failed to get default instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
    {
      detail: {
        summary: 'Get default Wikibase instance',
        description: 'Retrieve the currently configured default Wikibase instance',
        tags: ['Wikibase', 'Instances'],
      },
    },
  )
