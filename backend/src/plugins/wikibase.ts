import { Elysia } from 'elysia'
import { nodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'

export const wikibasePlugin = new Elysia({ name: 'wikibase', seed: 'wikibase-plugin' }).decorate(
  'wikibase',
  nodemwWikibaseService,
)
