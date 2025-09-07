import { nodemwWikibaseService } from '@backend/services/nodemw-wikibase.service'
import { Elysia } from 'elysia'

export const wikibasePlugin = new Elysia({ name: 'wikibase', seed: 'wikibase-plugin' }).decorate(
  'wikibase',
  nodemwWikibaseService,
)
