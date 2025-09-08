import { wikibaseService } from '@backend/services/wikibase.service'
import { Elysia } from 'elysia'

export const wikibasePlugin = new Elysia({ name: 'wikibase', seed: 'wikibase-plugin' }).decorate(
  'wikibase',
  wikibaseService,
)
