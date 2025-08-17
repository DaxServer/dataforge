import { Elysia, t } from 'elysia'
import { wikibaseConfigService } from '@backend/services/wikibase-config.service'

/**
 * Wikibase instance management API endpoints
 */
export const wikibaseInstancesApi = new Elysia({ prefix: '/wikibase/instances' })
  .get(
    '/',
    async () => {
      try {
        const instances = await wikibaseConfigService.getInstances()
        return {
          success: true,
          data: instances,
        }
      } catch (error) {
        throw new Error(
          `Failed to get instances: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
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
        return status(404, {
          data: [],
          errors: [
            {
              code: 'NOT_FOUND',
              message: error instanceof Error ? error.message : 'Instance not found',
              details: [instanceId],
            },
          ],
        })
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
        return {
          success: true,
          message: 'Instance added successfully',
        }
      } catch (error) {
        return status(400, {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              message: error instanceof Error ? error.message : 'Failed to add instance',
              details: [body],
            },
          ],
        })
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
        return {
          success: true,
          message: 'Instance updated successfully',
        }
      } catch (error) {
        return status(400, {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              message: error instanceof Error ? error.message : 'Failed to update instance',
              details: [instanceId, body],
            },
          ],
        })
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
        await wikibaseConfigService.removeInstance(instanceId)
        return {
          success: true,
          message: 'Instance removed successfully',
        }
      } catch (error) {
        return status(400, {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              message: error instanceof Error ? error.message : 'Failed to remove instance',
              details: [instanceId],
            },
          ],
        })
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
        return status(404, {
          data: [],
          errors: [
            {
              code: 'NOT_FOUND',
              message: error instanceof Error ? error.message : 'Instance not found',
              details: [instanceId],
            },
          ],
        })
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
        return status(404, {
          data: [],
          errors: [
            {
              code: 'NOT_FOUND',
              message: error instanceof Error ? error.message : 'Instance not found',
              details: [instanceId],
            },
          ],
        })
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
