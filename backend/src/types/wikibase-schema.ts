import { Type, type Static, type TSchema } from '@sinclair/typebox'

export const EntityType = Type.Union([
  Type.Literal('item'),
  Type.Literal('property'),
  Type.Literal('lexeme'),
  Type.Literal('form'),
  Type.Literal('sense'),
  Type.Literal('entity-schema'),
])

export type EntityType = Static<typeof EntityType>

export const NumericId = Type.TemplateLiteral([Type.Number()])

export type NumericId = Static<typeof NumericId>

export const ItemId = Type.TemplateLiteral([Type.Literal('Q'), Type.Number()])

export type ItemId = Static<typeof ItemId>

export const PropertyId = Type.TemplateLiteral([Type.Literal('P'), Type.Number()])

export type PropertyId = Static<typeof PropertyId>

export const LexemeId = Type.TemplateLiteral([Type.Literal('L'), Type.Number()])

export type LexemeId = Static<typeof LexemeId>

export const FormId = Type.TemplateLiteral([
  Type.Literal('L'),
  Type.Number(),
  Type.Literal('-F'),
  Type.Number(),
])

export type FormId = Static<typeof FormId>

export const SenseId = Type.TemplateLiteral([
  Type.Literal('L'),
  Type.Number(),
  Type.Literal('-S'),
  Type.Number(),
])

export type SenseId = Static<typeof SenseId>

export const EntitySchemaId = Type.TemplateLiteral([Type.Literal('E'), Type.Number()])

export type EntitySchemaId = Static<typeof EntitySchemaId>

export const MediaInfoId = Type.TemplateLiteral([Type.Literal('M'), Type.Number()])

export type MediaInfoId = Static<typeof MediaInfoId>

export const RevisionId = Type.TemplateLiteral([Type.Number()])

export type RevisionId = Static<typeof RevisionId>

export const Hash = Type.String()

export type Hash = Static<typeof Hash>

export const EntityInfo = <T extends TSchema>(T: T) =>
  Type.Object({
    pageid: Type.Optional(Type.Number()),
    ns: Type.Optional(Type.Number()),
    title: Type.Optional(Type.String()),
    lastrevid: Type.Optional(Type.Number()),
    modified: Type.Optional(Type.String()),
    redirects: Type.Optional(
      Type.Object({
        from: T,
        to: T,
      }),
    ),
    id: T,
  })

export type EntityInfo<T extends TSchema> = Static<ReturnType<typeof EntityInfo<T>>>

export const Rank = Type.Union([
  Type.Literal('normal'),
  Type.Literal('preferred'),
  Type.Literal('deprecated'),
])

export type Rank = Static<typeof Rank>

export const SnakType = Type.Union([
  Type.Literal('value'),
  Type.Literal('somevalue'),
  Type.Literal('novalue'),
])

export type SnakType = Static<typeof SnakType>

export const DataType = Type.Any()

export type DataType = Static<typeof DataType>

export const GlobeCoordinateSnakDataValue = Type.Object({
  type: Type.Literal('globecoordinate'),
  value: Type.Object({
    latitude: Type.Number(),
    longitude: Type.Number(),
    altitude: Type.Union([Type.Number(), Type.Null()]),
    precision: Type.Number(),
    globe: Type.String(),
  }),
})

export type GlobeCoordinateSnakDataValue = Static<typeof GlobeCoordinateSnakDataValue>

export const QuantitySnakDataValue = Type.Object({
  type: Type.Literal('quantity'),
  value: Type.Object({
    amount: Type.String(),
    unit: Type.String(),
    upperBound: Type.Optional(Type.String()),
    lowerBound: Type.Optional(Type.String()),
  }),
})

export type QuantitySnakDataValue = Static<typeof QuantitySnakDataValue>

export const StringSnakDataValue = Type.Object({
  type: Type.Literal('string'),
  value: Type.String(),
})

export type StringSnakDataValue = Static<typeof StringSnakDataValue>

export const TimeSnakDataValue = Type.Object({
  type: Type.Literal('time'),
  value: Type.Object({
    time: Type.String(),
    timezone: Type.Number(),
    before: Type.Number(),
    after: Type.Number(),
    precision: Type.Number(),
    calendarmodel: Type.String(),
  }),
})

export type TimeSnakDataValue = Static<typeof TimeSnakDataValue>

export const LanguageCode = Type.String()

export type LanguageCode = Static<typeof LanguageCode>

export const SimplifiedTerm = Type.String()

export type SimplifiedTerm = Static<typeof SimplifiedTerm>

export const SitelinkTitle = Type.String()

export type SitelinkTitle = Static<typeof SitelinkTitle>

const Site_Chunk1 = Type.Union([
  Type.Literal('aawiki'),
  Type.Literal('aawikibooks'),
  Type.Literal('aawiktionary'),
  Type.Literal('abwiki'),
  Type.Literal('abwiktionary'),
  Type.Literal('acewiki'),
  Type.Literal('adywiki'),
  Type.Literal('afwiki'),
  Type.Literal('afwikibooks'),
  Type.Literal('afwikiquote'),
  Type.Literal('afwiktionary'),
  Type.Literal('akwiki'),
  Type.Literal('akwikibooks'),
  Type.Literal('akwiktionary'),
  Type.Literal('alswiki'),
  Type.Literal('alswikibooks'),
  Type.Literal('alswikiquote'),
  Type.Literal('alswiktionary'),
  Type.Literal('altwiki'),
  Type.Literal('amiwiki'),
])
const Site_Chunk2 = Type.Union([
  Type.Literal('amwiki'),
  Type.Literal('amwikiquote'),
  Type.Literal('amwiktionary'),
  Type.Literal('angwiki'),
  Type.Literal('angwikibooks'),
  Type.Literal('angwikiquote'),
  Type.Literal('angwikisource'),
  Type.Literal('angwiktionary'),
  Type.Literal('annwiki'),
  Type.Literal('anpwiki'),
  Type.Literal('anwiki'),
  Type.Literal('anwiktionary'),
  Type.Literal('arcwiki'),
  Type.Literal('arwiki'),
  Type.Literal('arwikibooks'),
  Type.Literal('arwikinews'),
  Type.Literal('arwikiquote'),
  Type.Literal('arwikisource'),
  Type.Literal('arwikiversity'),
  Type.Literal('arwiktionary'),
])
const Site_Chunk3 = Type.Union([
  Type.Literal('arywiki'),
  Type.Literal('arzwiki'),
  Type.Literal('astwiki'),
  Type.Literal('astwikibooks'),
  Type.Literal('astwikiquote'),
  Type.Literal('astwiktionary'),
  Type.Literal('aswiki'),
  Type.Literal('aswikibooks'),
  Type.Literal('aswikiquote'),
  Type.Literal('aswikisource'),
  Type.Literal('aswiktionary'),
  Type.Literal('atjwiki'),
  Type.Literal('avkwiki'),
  Type.Literal('avwiki'),
  Type.Literal('avwiktionary'),
  Type.Literal('awawiki'),
  Type.Literal('aywiki'),
  Type.Literal('aywikibooks'),
  Type.Literal('aywiktionary'),
  Type.Literal('azbwiki'),
])
const Site_Chunk4 = Type.Union([
  Type.Literal('azwiki'),
  Type.Literal('azwikibooks'),
  Type.Literal('azwikiquote'),
  Type.Literal('azwikisource'),
  Type.Literal('azwiktionary'),
  Type.Literal('banwiki'),
  Type.Literal('banwikisource'),
  Type.Literal('barwiki'),
  Type.Literal('bat_smgwiki'),
  Type.Literal('bawiki'),
  Type.Literal('bawikibooks'),
  Type.Literal('bbcwiki'),
  Type.Literal('bclwiki'),
  Type.Literal('bclwikiquote'),
  Type.Literal('bclwikisource'),
  Type.Literal('bclwiktionary'),
  Type.Literal('bdrwiki'),
  Type.Literal('be_x_oldwiki'),
  Type.Literal('bewiki'),
  Type.Literal('bewikibooks'),
])
const Site_Chunk5 = Type.Union([
  Type.Literal('bewikiquote'),
  Type.Literal('bewikisource'),
  Type.Literal('bewiktionary'),
  Type.Literal('bewwiki'),
  Type.Literal('bgwiki'),
  Type.Literal('bgwikibooks'),
  Type.Literal('bgwikinews'),
  Type.Literal('bgwikiquote'),
  Type.Literal('bgwikisource'),
  Type.Literal('bgwiktionary'),
  Type.Literal('bhwiki'),
  Type.Literal('bhwiktionary'),
  Type.Literal('biwiki'),
  Type.Literal('biwikibooks'),
  Type.Literal('biwiktionary'),
  Type.Literal('bjnwiki'),
  Type.Literal('bjnwikiquote'),
  Type.Literal('bjnwiktionary'),
  Type.Literal('blkwiki'),
  Type.Literal('blkwiktionary'),
])
const Site_Chunk6 = Type.Union([
  Type.Literal('bmwiki'),
  Type.Literal('bmwikibooks'),
  Type.Literal('bmwikiquote'),
  Type.Literal('bmwiktionary'),
  Type.Literal('bnwiki'),
  Type.Literal('bnwikibooks'),
  Type.Literal('bnwikiquote'),
  Type.Literal('bnwikisource'),
  Type.Literal('bnwikivoyage'),
  Type.Literal('bnwiktionary'),
  Type.Literal('bowiki'),
  Type.Literal('bowikibooks'),
  Type.Literal('bowiktionary'),
  Type.Literal('bpywiki'),
  Type.Literal('brwiki'),
  Type.Literal('brwikiquote'),
  Type.Literal('brwikisource'),
  Type.Literal('brwiktionary'),
  Type.Literal('bswiki'),
  Type.Literal('bswikibooks'),
])
const Site_Chunk7 = Type.Union([
  Type.Literal('bswikinews'),
  Type.Literal('bswikiquote'),
  Type.Literal('bswikisource'),
  Type.Literal('bswiktionary'),
  Type.Literal('btmwiki'),
  Type.Literal('btmwiktionary'),
  Type.Literal('bugwiki'),
  Type.Literal('bxrwiki'),
  Type.Literal('cawiki'),
  Type.Literal('cawikibooks'),
  Type.Literal('cawikinews'),
  Type.Literal('cawikiquote'),
  Type.Literal('cawikisource'),
  Type.Literal('cawiktionary'),
  Type.Literal('cbk_zamwiki'),
  Type.Literal('cdowiki'),
  Type.Literal('cebwiki'),
  Type.Literal('cewiki'),
  Type.Literal('chowiki'),
  Type.Literal('chrwiki'),
])
const Site_Chunk8 = Type.Union([
  Type.Literal('chrwiktionary'),
  Type.Literal('chwiki'),
  Type.Literal('chwikibooks'),
  Type.Literal('chwiktionary'),
  Type.Literal('chywiki'),
  Type.Literal('ckbwiki'),
  Type.Literal('ckbwiktionary'),
  Type.Literal('commonswiki'),
  Type.Literal('cowiki'),
  Type.Literal('cowikibooks'),
  Type.Literal('cowikiquote'),
  Type.Literal('cowiktionary'),
  Type.Literal('crhwiki'),
  Type.Literal('crwiki'),
  Type.Literal('crwikiquote'),
  Type.Literal('crwiktionary'),
  Type.Literal('csbwiki'),
  Type.Literal('csbwiktionary'),
  Type.Literal('cswiki'),
  Type.Literal('cswikibooks'),
])
const Site_Chunk9 = Type.Union([
  Type.Literal('cswikinews'),
  Type.Literal('cswikiquote'),
  Type.Literal('cswikisource'),
  Type.Literal('cswikiversity'),
  Type.Literal('cswikivoyage'),
  Type.Literal('cswiktionary'),
  Type.Literal('cuwiki'),
  Type.Literal('cvwiki'),
  Type.Literal('cvwikibooks'),
  Type.Literal('cywiki'),
  Type.Literal('cywikibooks'),
  Type.Literal('cywikiquote'),
  Type.Literal('cywikisource'),
  Type.Literal('cywiktionary'),
  Type.Literal('dagwiki'),
  Type.Literal('dawiki'),
  Type.Literal('dawikibooks'),
  Type.Literal('dawikiquote'),
  Type.Literal('dawikisource'),
  Type.Literal('dawiktionary'),
])
const Site_Chunk10 = Type.Union([
  Type.Literal('dewiki'),
  Type.Literal('dewikibooks'),
  Type.Literal('dewikinews'),
  Type.Literal('dewikiquote'),
  Type.Literal('dewikisource'),
  Type.Literal('dewikiversity'),
  Type.Literal('dewikivoyage'),
  Type.Literal('dewiktionary'),
  Type.Literal('dgawiki'),
  Type.Literal('dinwiki'),
  Type.Literal('diqwiki'),
  Type.Literal('diqwiktionary'),
  Type.Literal('dsbwiki'),
  Type.Literal('dtpwiki'),
  Type.Literal('dtywiki'),
  Type.Literal('dvwiki'),
  Type.Literal('dvwiktionary'),
  Type.Literal('dzwiki'),
  Type.Literal('dzwiktionary'),
  Type.Literal('eewiki'),
])
const Site_Chunk11 = Type.Union([
  Type.Literal('elwiki'),
  Type.Literal('elwikibooks'),
  Type.Literal('elwikinews'),
  Type.Literal('elwikiquote'),
  Type.Literal('elwikisource'),
  Type.Literal('elwikiversity'),
  Type.Literal('elwikivoyage'),
  Type.Literal('elwiktionary'),
  Type.Literal('emlwiki'),
  Type.Literal('enwiki'),
  Type.Literal('enwikibooks'),
  Type.Literal('enwikinews'),
  Type.Literal('enwikiquote'),
  Type.Literal('enwikisource'),
  Type.Literal('enwikiversity'),
  Type.Literal('enwikivoyage'),
  Type.Literal('enwiktionary'),
  Type.Literal('eowiki'),
  Type.Literal('eowikibooks'),
  Type.Literal('eowikinews'),
])
const Site_Chunk12 = Type.Union([
  Type.Literal('eowikiquote'),
  Type.Literal('eowikisource'),
  Type.Literal('eowikivoyage'),
  Type.Literal('eowiktionary'),
  Type.Literal('eswiki'),
  Type.Literal('eswikibooks'),
  Type.Literal('eswikinews'),
  Type.Literal('eswikiquote'),
  Type.Literal('eswikisource'),
  Type.Literal('eswikiversity'),
  Type.Literal('eswikivoyage'),
  Type.Literal('eswiktionary'),
  Type.Literal('etwiki'),
  Type.Literal('etwikibooks'),
  Type.Literal('etwikiquote'),
  Type.Literal('etwikisource'),
  Type.Literal('etwiktionary'),
  Type.Literal('euwiki'),
  Type.Literal('euwikibooks'),
  Type.Literal('euwikiquote'),
])
const Site_Chunk13 = Type.Union([
  Type.Literal('euwikisource'),
  Type.Literal('euwiktionary'),
  Type.Literal('extwiki'),
  Type.Literal('fatwiki'),
  Type.Literal('fawiki'),
  Type.Literal('fawikibooks'),
  Type.Literal('fawikinews'),
  Type.Literal('fawikiquote'),
  Type.Literal('fawikisource'),
  Type.Literal('fawikivoyage'),
  Type.Literal('fawiktionary'),
  Type.Literal('ffwiki'),
  Type.Literal('fiu_vrowiki'),
  Type.Literal('fiwiki'),
  Type.Literal('fiwikibooks'),
  Type.Literal('fiwikinews'),
  Type.Literal('fiwikiquote'),
  Type.Literal('fiwikisource'),
  Type.Literal('fiwikiversity'),
  Type.Literal('fiwikivoyage'),
])
const Site_Chunk14 = Type.Union([
  Type.Literal('fiwiktionary'),
  Type.Literal('fjwiki'),
  Type.Literal('fjwiktionary'),
  Type.Literal('fonwiki'),
  Type.Literal('foundationwiki'),
  Type.Literal('fowiki'),
  Type.Literal('fowikisource'),
  Type.Literal('fowiktionary'),
  Type.Literal('frpwiki'),
  Type.Literal('frrwiki'),
  Type.Literal('frwiki'),
  Type.Literal('frwikibooks'),
  Type.Literal('frwikinews'),
  Type.Literal('frwikiquote'),
  Type.Literal('frwikisource'),
  Type.Literal('frwikiversity'),
  Type.Literal('frwikivoyage'),
  Type.Literal('frwiktionary'),
  Type.Literal('furwiki'),
  Type.Literal('fywiki'),
])
const Site_Chunk15 = Type.Union([
  Type.Literal('fywikibooks'),
  Type.Literal('fywiktionary'),
  Type.Literal('gagwiki'),
  Type.Literal('ganwiki'),
  Type.Literal('gawiki'),
  Type.Literal('gawikibooks'),
  Type.Literal('gawikiquote'),
  Type.Literal('gawiktionary'),
  Type.Literal('gcrwiki'),
  Type.Literal('gdwiki'),
  Type.Literal('gdwiktionary'),
  Type.Literal('glkwiki'),
  Type.Literal('glwiki'),
  Type.Literal('glwikibooks'),
  Type.Literal('glwikiquote'),
  Type.Literal('glwikisource'),
  Type.Literal('glwiktionary'),
  Type.Literal('gnwiki'),
  Type.Literal('gnwikibooks'),
  Type.Literal('gnwiktionary'),
])
const Site_Chunk16 = Type.Union([
  Type.Literal('gomwiki'),
  Type.Literal('gomwiktionary'),
  Type.Literal('gorwiki'),
  Type.Literal('gorwikiquote'),
  Type.Literal('gorwiktionary'),
  Type.Literal('gotwiki'),
  Type.Literal('gotwikibooks'),
  Type.Literal('gpewiki'),
  Type.Literal('gucwiki'),
  Type.Literal('gurwiki'),
  Type.Literal('guwiki'),
  Type.Literal('guwikibooks'),
  Type.Literal('guwikiquote'),
  Type.Literal('guwikisource'),
  Type.Literal('guwiktionary'),
  Type.Literal('guwwiki'),
  Type.Literal('guwwikinews'),
  Type.Literal('guwwikiquote'),
  Type.Literal('guwwiktionary'),
  Type.Literal('gvwiki'),
])
const Site_Chunk17 = Type.Union([
  Type.Literal('gvwiktionary'),
  Type.Literal('hakwiki'),
  Type.Literal('hawiki'),
  Type.Literal('hawiktionary'),
  Type.Literal('hawwiki'),
  Type.Literal('hewiki'),
  Type.Literal('hewikibooks'),
  Type.Literal('hewikinews'),
  Type.Literal('hewikiquote'),
  Type.Literal('hewikisource'),
  Type.Literal('hewikivoyage'),
  Type.Literal('hewiktionary'),
  Type.Literal('hifwiki'),
  Type.Literal('hifwiktionary'),
  Type.Literal('hiwiki'),
  Type.Literal('hiwikibooks'),
  Type.Literal('hiwikiquote'),
  Type.Literal('hiwikisource'),
  Type.Literal('hiwikiversity'),
  Type.Literal('hiwikivoyage'),
])
const Site_Chunk18 = Type.Union([
  Type.Literal('hiwiktionary'),
  Type.Literal('howiki'),
  Type.Literal('hrwiki'),
  Type.Literal('hrwikibooks'),
  Type.Literal('hrwikiquote'),
  Type.Literal('hrwikisource'),
  Type.Literal('hrwiktionary'),
  Type.Literal('hsbwiki'),
  Type.Literal('hsbwiktionary'),
  Type.Literal('htwiki'),
  Type.Literal('htwikisource'),
  Type.Literal('huwiki'),
  Type.Literal('huwikibooks'),
  Type.Literal('huwikinews'),
  Type.Literal('huwikiquote'),
  Type.Literal('huwikisource'),
  Type.Literal('huwiktionary'),
  Type.Literal('hywiki'),
  Type.Literal('hywikibooks'),
  Type.Literal('hywikiquote'),
])
const Site_Chunk19 = Type.Union([
  Type.Literal('hywikisource'),
  Type.Literal('hywiktionary'),
  Type.Literal('hywwiki'),
  Type.Literal('hzwiki'),
  Type.Literal('iawiki'),
  Type.Literal('iawikibooks'),
  Type.Literal('iawiktionary'),
  Type.Literal('ibawiki'),
  Type.Literal('idwiki'),
  Type.Literal('idwikibooks'),
  Type.Literal('idwikiquote'),
  Type.Literal('idwikisource'),
  Type.Literal('idwikivoyage'),
  Type.Literal('idwiktionary'),
  Type.Literal('iewiki'),
  Type.Literal('iewikibooks'),
  Type.Literal('iewiktionary'),
  Type.Literal('iglwiki'),
  Type.Literal('igwiki'),
  Type.Literal('igwikiquote'),
])
const Site_Chunk20 = Type.Union([
  Type.Literal('igwiktionary'),
  Type.Literal('iiwiki'),
  Type.Literal('ikwiki'),
  Type.Literal('ikwiktionary'),
  Type.Literal('ilowiki'),
  Type.Literal('inhwiki'),
  Type.Literal('iowiki'),
  Type.Literal('iowiktionary'),
  Type.Literal('iswiki'),
  Type.Literal('iswikibooks'),
  Type.Literal('iswikiquote'),
  Type.Literal('iswikisource'),
  Type.Literal('iswiktionary'),
  Type.Literal('itwiki'),
  Type.Literal('itwikibooks'),
  Type.Literal('itwikinews'),
  Type.Literal('itwikiquote'),
  Type.Literal('itwikisource'),
  Type.Literal('itwikiversity'),
  Type.Literal('itwikivoyage'),
])
const Site_Chunk21 = Type.Union([
  Type.Literal('itwiktionary'),
  Type.Literal('iuwiki'),
  Type.Literal('iuwiktionary'),
  Type.Literal('jamwiki'),
  Type.Literal('jawiki'),
  Type.Literal('jawikibooks'),
  Type.Literal('jawikinews'),
  Type.Literal('jawikiquote'),
  Type.Literal('jawikisource'),
  Type.Literal('jawikiversity'),
  Type.Literal('jawikivoyage'),
  Type.Literal('jawiktionary'),
  Type.Literal('jbowiki'),
  Type.Literal('jbowiktionary'),
  Type.Literal('jvwiki'),
  Type.Literal('jvwikisource'),
  Type.Literal('jvwiktionary'),
  Type.Literal('kaawiki'),
  Type.Literal('kaawiktionary'),
  Type.Literal('kabwiki'),
])
const Site_Chunk22 = Type.Union([
  Type.Literal('kawiki'),
  Type.Literal('kawikibooks'),
  Type.Literal('kawikiquote'),
  Type.Literal('kawikisource'),
  Type.Literal('kawiktionary'),
  Type.Literal('kbdwiki'),
  Type.Literal('kbdwiktionary'),
  Type.Literal('kbpwiki'),
  Type.Literal('kcgwiki'),
  Type.Literal('kcgwiktionary'),
  Type.Literal('kgewiki'),
  Type.Literal('kgwiki'),
  Type.Literal('kiwiki'),
  Type.Literal('kjwiki'),
  Type.Literal('kkwiki'),
  Type.Literal('kkwikibooks'),
  Type.Literal('kkwikiquote'),
  Type.Literal('kkwiktionary'),
  Type.Literal('klwiki'),
  Type.Literal('klwiktionary'),
])
const Site_Chunk23 = Type.Union([
  Type.Literal('kmwiki'),
  Type.Literal('kmwikibooks'),
  Type.Literal('kmwiktionary'),
  Type.Literal('kncwiki'),
  Type.Literal('knwiki'),
  Type.Literal('knwikibooks'),
  Type.Literal('knwikiquote'),
  Type.Literal('knwikisource'),
  Type.Literal('knwiktionary'),
  Type.Literal('koiwiki'),
  Type.Literal('kowiki'),
  Type.Literal('kowikibooks'),
  Type.Literal('kowikinews'),
  Type.Literal('kowikiquote'),
  Type.Literal('kowikisource'),
  Type.Literal('kowikiversity'),
  Type.Literal('kowiktionary'),
  Type.Literal('krcwiki'),
  Type.Literal('krwiki'),
  Type.Literal('krwikiquote'),
])
const Site_Chunk24 = Type.Union([
  Type.Literal('kshwiki'),
  Type.Literal('kswiki'),
  Type.Literal('kswikibooks'),
  Type.Literal('kswikiquote'),
  Type.Literal('kswiktionary'),
  Type.Literal('kuswiki'),
  Type.Literal('kuwiki'),
  Type.Literal('kuwikibooks'),
  Type.Literal('kuwikiquote'),
  Type.Literal('kuwiktionary'),
  Type.Literal('kvwiki'),
  Type.Literal('kwwiki'),
  Type.Literal('kwwikiquote'),
  Type.Literal('kwwiktionary'),
  Type.Literal('kywiki'),
  Type.Literal('kywikibooks'),
  Type.Literal('kywikiquote'),
  Type.Literal('kywiktionary'),
  Type.Literal('ladwiki'),
  Type.Literal('lawiki'),
])
const Site_Chunk25 = Type.Union([
  Type.Literal('lawikibooks'),
  Type.Literal('lawikiquote'),
  Type.Literal('lawikisource'),
  Type.Literal('lawiktionary'),
  Type.Literal('lbewiki'),
  Type.Literal('lbwiki'),
  Type.Literal('lbwikibooks'),
  Type.Literal('lbwikiquote'),
  Type.Literal('lbwiktionary'),
  Type.Literal('lezwiki'),
  Type.Literal('lfnwiki'),
  Type.Literal('lgwiki'),
  Type.Literal('lijwiki'),
  Type.Literal('lijwikisource'),
  Type.Literal('liwiki'),
  Type.Literal('liwikibooks'),
  Type.Literal('liwikinews'),
  Type.Literal('liwikiquote'),
  Type.Literal('liwikisource'),
  Type.Literal('liwiktionary'),
])
const Site_Chunk26 = Type.Union([
  Type.Literal('lldwiki'),
  Type.Literal('lmowiki'),
  Type.Literal('lmowiktionary'),
  Type.Literal('lnwiki'),
  Type.Literal('lnwikibooks'),
  Type.Literal('lnwiktionary'),
  Type.Literal('lowiki'),
  Type.Literal('lowiktionary'),
  Type.Literal('lrcwiki'),
  Type.Literal('ltgwiki'),
  Type.Literal('ltwiki'),
  Type.Literal('ltwikibooks'),
  Type.Literal('ltwikiquote'),
  Type.Literal('ltwikisource'),
  Type.Literal('ltwiktionary'),
  Type.Literal('lvwiki'),
  Type.Literal('lvwikibooks'),
  Type.Literal('lvwiktionary'),
  Type.Literal('madwiki'),
  Type.Literal('madwiktionary'),
])
const Site_Chunk27 = Type.Union([
  Type.Literal('maiwiki'),
  Type.Literal('map_bmswiki'),
  Type.Literal('mdfwiki'),
  Type.Literal('mediawikiwiki'),
  Type.Literal('metawiki'),
  Type.Literal('mgwiki'),
  Type.Literal('mgwikibooks'),
  Type.Literal('mgwiktionary'),
  Type.Literal('mhrwiki'),
  Type.Literal('mhwiki'),
  Type.Literal('mhwiktionary'),
  Type.Literal('minwiki'),
  Type.Literal('minwiktionary'),
  Type.Literal('miwiki'),
  Type.Literal('miwikibooks'),
  Type.Literal('miwiktionary'),
  Type.Literal('mkwiki'),
  Type.Literal('mkwikibooks'),
  Type.Literal('mkwikisource'),
  Type.Literal('mkwiktionary'),
])
const Site_Chunk28 = Type.Union([
  Type.Literal('mlwiki'),
  Type.Literal('mlwikibooks'),
  Type.Literal('mlwikiquote'),
  Type.Literal('mlwikisource'),
  Type.Literal('mlwiktionary'),
  Type.Literal('mniwiki'),
  Type.Literal('mniwiktionary'),
  Type.Literal('mnwiki'),
  Type.Literal('mnwikibooks'),
  Type.Literal('mnwiktionary'),
  Type.Literal('mnwwiki'),
  Type.Literal('mnwwiktionary'),
  Type.Literal('moswiki'),
  Type.Literal('mowiki'),
  Type.Literal('mowiktionary'),
  Type.Literal('mrjwiki'),
  Type.Literal('mrwiki'),
  Type.Literal('mrwikibooks'),
  Type.Literal('mrwikiquote'),
  Type.Literal('mrwikisource'),
])
const Site_Chunk29 = Type.Union([
  Type.Literal('mrwiktionary'),
  Type.Literal('mswiki'),
  Type.Literal('mswikibooks'),
  Type.Literal('mswikisource'),
  Type.Literal('mswiktionary'),
  Type.Literal('mtwiki'),
  Type.Literal('mtwiktionary'),
  Type.Literal('muswiki'),
  Type.Literal('mwlwiki'),
  Type.Literal('myvwiki'),
  Type.Literal('mywiki'),
  Type.Literal('mywikibooks'),
  Type.Literal('mywikisource'),
  Type.Literal('mywiktionary'),
  Type.Literal('mznwiki'),
  Type.Literal('nahwiki'),
  Type.Literal('nahwikibooks'),
  Type.Literal('nahwiktionary'),
  Type.Literal('napwiki'),
  Type.Literal('napwikisource'),
])
const Site_Chunk30 = Type.Union([
  Type.Literal('nawiki'),
  Type.Literal('nawikibooks'),
  Type.Literal('nawikiquote'),
  Type.Literal('nawiktionary'),
  Type.Literal('nds_nlwiki'),
  Type.Literal('ndswiki'),
  Type.Literal('ndswikibooks'),
  Type.Literal('ndswikiquote'),
  Type.Literal('ndswiktionary'),
  Type.Literal('newiki'),
  Type.Literal('newikibooks'),
  Type.Literal('newiktionary'),
  Type.Literal('newwiki'),
  Type.Literal('ngwiki'),
  Type.Literal('niawiki'),
  Type.Literal('niawiktionary'),
  Type.Literal('nlwiki'),
  Type.Literal('nlwikibooks'),
  Type.Literal('nlwikinews'),
  Type.Literal('nlwikiquote'),
])
const Site_Chunk31 = Type.Union([
  Type.Literal('nlwikisource'),
  Type.Literal('nlwikivoyage'),
  Type.Literal('nlwiktionary'),
  Type.Literal('nnwiki'),
  Type.Literal('nnwikiquote'),
  Type.Literal('nnwiktionary'),
  Type.Literal('novwiki'),
  Type.Literal('nowiki'),
  Type.Literal('nowikibooks'),
  Type.Literal('nowikinews'),
  Type.Literal('nowikiquote'),
  Type.Literal('nowikisource'),
  Type.Literal('nowiktionary'),
  Type.Literal('nqowiki'),
  Type.Literal('nrmwiki'),
  Type.Literal('nrwiki'),
  Type.Literal('nsowiki'),
  Type.Literal('nvwiki'),
  Type.Literal('nywiki'),
  Type.Literal('ocwiki'),
])
const Site_Chunk32 = Type.Union([
  Type.Literal('ocwikibooks'),
  Type.Literal('ocwiktionary'),
  Type.Literal('olowiki'),
  Type.Literal('omwiki'),
  Type.Literal('omwiktionary'),
  Type.Literal('orwiki'),
  Type.Literal('orwikisource'),
  Type.Literal('orwiktionary'),
  Type.Literal('oswiki'),
  Type.Literal('outreachwiki'),
  Type.Literal('pagwiki'),
  Type.Literal('pamwiki'),
  Type.Literal('papwiki'),
  Type.Literal('pawiki'),
  Type.Literal('pawikibooks'),
  Type.Literal('pawikisource'),
  Type.Literal('pawiktionary'),
  Type.Literal('pcdwiki'),
  Type.Literal('pcmwiki'),
  Type.Literal('pdcwiki'),
])
const Site_Chunk33 = Type.Union([
  Type.Literal('pflwiki'),
  Type.Literal('pihwiki'),
  Type.Literal('piwiki'),
  Type.Literal('piwiktionary'),
  Type.Literal('plwiki'),
  Type.Literal('plwikibooks'),
  Type.Literal('plwikinews'),
  Type.Literal('plwikiquote'),
  Type.Literal('plwikisource'),
  Type.Literal('plwikivoyage'),
  Type.Literal('plwiktionary'),
  Type.Literal('pmswiki'),
  Type.Literal('pmswikisource'),
  Type.Literal('pnbwiki'),
  Type.Literal('pnbwiktionary'),
  Type.Literal('pntwiki'),
  Type.Literal('pswiki'),
  Type.Literal('pswikibooks'),
  Type.Literal('pswikivoyage'),
  Type.Literal('pswiktionary'),
])
const Site_Chunk34 = Type.Union([
  Type.Literal('ptwiki'),
  Type.Literal('ptwikibooks'),
  Type.Literal('ptwikinews'),
  Type.Literal('ptwikiquote'),
  Type.Literal('ptwikisource'),
  Type.Literal('ptwikiversity'),
  Type.Literal('ptwikivoyage'),
  Type.Literal('ptwiktionary'),
  Type.Literal('pwnwiki'),
  Type.Literal('quwiki'),
  Type.Literal('quwikibooks'),
  Type.Literal('quwikiquote'),
  Type.Literal('quwiktionary'),
  Type.Literal('rmwiki'),
  Type.Literal('rmwikibooks'),
  Type.Literal('rmwiktionary'),
  Type.Literal('rmywiki'),
  Type.Literal('rnwiki'),
  Type.Literal('rnwiktionary'),
  Type.Literal('roa_rupwiki'),
])
const Site_Chunk35 = Type.Union([
  Type.Literal('roa_rupwiktionary'),
  Type.Literal('roa_tarawiki'),
  Type.Literal('rowiki'),
  Type.Literal('rowikibooks'),
  Type.Literal('rowikinews'),
  Type.Literal('rowikiquote'),
  Type.Literal('rowikisource'),
  Type.Literal('rowikivoyage'),
  Type.Literal('rowiktionary'),
  Type.Literal('rskwiki'),
  Type.Literal('ruewiki'),
  Type.Literal('ruwiki'),
  Type.Literal('ruwikibooks'),
  Type.Literal('ruwikinews'),
  Type.Literal('ruwikiquote'),
  Type.Literal('ruwikisource'),
  Type.Literal('ruwikiversity'),
  Type.Literal('ruwikivoyage'),
  Type.Literal('ruwiktionary'),
  Type.Literal('rwwiki'),
])
const Site_Chunk36 = Type.Union([
  Type.Literal('rwwiktionary'),
  Type.Literal('sahwiki'),
  Type.Literal('sahwikiquote'),
  Type.Literal('sahwikisource'),
  Type.Literal('satwiki'),
  Type.Literal('satwiktionary'),
  Type.Literal('sawiki'),
  Type.Literal('sawikibooks'),
  Type.Literal('sawikiquote'),
  Type.Literal('sawikisource'),
  Type.Literal('sawiktionary'),
  Type.Literal('scnwiki'),
  Type.Literal('scnwiktionary'),
  Type.Literal('scowiki'),
  Type.Literal('scwiki'),
  Type.Literal('scwiktionary'),
  Type.Literal('sdwiki'),
  Type.Literal('sdwikinews'),
  Type.Literal('sdwiktionary'),
  Type.Literal('sewiki'),
])
const Site_Chunk37 = Type.Union([
  Type.Literal('sewikibooks'),
  Type.Literal('sgwiki'),
  Type.Literal('sgwiktionary'),
  Type.Literal('shiwiki'),
  Type.Literal('shnwiki'),
  Type.Literal('shnwikibooks'),
  Type.Literal('shnwikinews'),
  Type.Literal('shnwikivoyage'),
  Type.Literal('shnwiktionary'),
  Type.Literal('shwiki'),
  Type.Literal('shwiktionary'),
  Type.Literal('shywiktionary'),
  Type.Literal('simplewiki'),
  Type.Literal('simplewikibooks'),
  Type.Literal('simplewikiquote'),
  Type.Literal('simplewiktionary'),
  Type.Literal('siwiki'),
  Type.Literal('siwikibooks'),
  Type.Literal('siwiktionary'),
  Type.Literal('skrwiki'),
])
const Site_Chunk38 = Type.Union([
  Type.Literal('skrwiktionary'),
  Type.Literal('skwiki'),
  Type.Literal('skwikibooks'),
  Type.Literal('skwikiquote'),
  Type.Literal('skwikisource'),
  Type.Literal('skwiktionary'),
  Type.Literal('slwiki'),
  Type.Literal('slwikibooks'),
  Type.Literal('slwikiquote'),
  Type.Literal('slwikisource'),
  Type.Literal('slwikiversity'),
  Type.Literal('slwiktionary'),
  Type.Literal('smnwiki'),
  Type.Literal('smwiki'),
  Type.Literal('smwiktionary'),
  Type.Literal('snwiki'),
  Type.Literal('snwiktionary'),
  Type.Literal('sourceswiki'),
  Type.Literal('sowiki'),
  Type.Literal('sowiktionary'),
])
const Site_Chunk39 = Type.Union([
  Type.Literal('specieswiki'),
  Type.Literal('sqwiki'),
  Type.Literal('sqwikibooks'),
  Type.Literal('sqwikinews'),
  Type.Literal('sqwikiquote'),
  Type.Literal('sqwiktionary'),
  Type.Literal('srnwiki'),
  Type.Literal('srwiki'),
  Type.Literal('srwikibooks'),
  Type.Literal('srwikinews'),
  Type.Literal('srwikiquote'),
  Type.Literal('srwikisource'),
  Type.Literal('srwiktionary'),
  Type.Literal('sswiki'),
  Type.Literal('sswiktionary'),
  Type.Literal('stqwiki'),
  Type.Literal('stwiki'),
  Type.Literal('stwiktionary'),
  Type.Literal('suwiki'),
  Type.Literal('suwikibooks'),
])
const Site_Chunk40 = Type.Union([
  Type.Literal('suwikiquote'),
  Type.Literal('suwikisource'),
  Type.Literal('suwiktionary'),
  Type.Literal('svwiki'),
  Type.Literal('svwikibooks'),
  Type.Literal('svwikinews'),
  Type.Literal('svwikiquote'),
  Type.Literal('svwikisource'),
  Type.Literal('svwikiversity'),
  Type.Literal('svwikivoyage'),
  Type.Literal('svwiktionary'),
  Type.Literal('swwiki'),
  Type.Literal('swwikibooks'),
  Type.Literal('swwiktionary'),
  Type.Literal('sylwiki'),
  Type.Literal('szlwiki'),
  Type.Literal('szywiki'),
  Type.Literal('tawiki'),
  Type.Literal('tawikibooks'),
  Type.Literal('tawikinews'),
])
const Site_Chunk41 = Type.Union([
  Type.Literal('tawikiquote'),
  Type.Literal('tawikisource'),
  Type.Literal('tawiktionary'),
  Type.Literal('taywiki'),
  Type.Literal('tcywiki'),
  Type.Literal('tcywikisource'),
  Type.Literal('tcywiktionary'),
  Type.Literal('tddwiki'),
  Type.Literal('tetwiki'),
  Type.Literal('tewiki'),
  Type.Literal('tewikibooks'),
  Type.Literal('tewikiquote'),
  Type.Literal('tewikisource'),
  Type.Literal('tewiktionary'),
  Type.Literal('tgwiki'),
  Type.Literal('tgwikibooks'),
  Type.Literal('tgwiktionary'),
  Type.Literal('thwiki'),
  Type.Literal('thwikibooks'),
  Type.Literal('thwikinews'),
])
const Site_Chunk42 = Type.Union([
  Type.Literal('thwikiquote'),
  Type.Literal('thwikisource'),
  Type.Literal('thwiktionary'),
  Type.Literal('tigwiki'),
  Type.Literal('tiwiki'),
  Type.Literal('tiwiktionary'),
  Type.Literal('tkwiki'),
  Type.Literal('tkwikibooks'),
  Type.Literal('tkwikiquote'),
  Type.Literal('tkwiktionary'),
  Type.Literal('tlwiki'),
  Type.Literal('tlwikibooks'),
  Type.Literal('tlwikiquote'),
  Type.Literal('tlwiktionary'),
  Type.Literal('tlywiki'),
  Type.Literal('tnwiki'),
  Type.Literal('tnwiktionary'),
  Type.Literal('towiki'),
  Type.Literal('towiktionary'),
  Type.Literal('tpiwiki'),
])
const Site_Chunk43 = Type.Union([
  Type.Literal('tpiwiktionary'),
  Type.Literal('trvwiki'),
  Type.Literal('trwiki'),
  Type.Literal('trwikibooks'),
  Type.Literal('trwikinews'),
  Type.Literal('trwikiquote'),
  Type.Literal('trwikisource'),
  Type.Literal('trwikivoyage'),
  Type.Literal('trwiktionary'),
  Type.Literal('tswiki'),
  Type.Literal('tswiktionary'),
  Type.Literal('ttwiki'),
  Type.Literal('ttwikibooks'),
  Type.Literal('ttwikiquote'),
  Type.Literal('ttwiktionary'),
  Type.Literal('tumwiki'),
  Type.Literal('twwiki'),
  Type.Literal('twwiktionary'),
  Type.Literal('tyvwiki'),
  Type.Literal('tywiki'),
])
const Site_Chunk44 = Type.Union([
  Type.Literal('udmwiki'),
  Type.Literal('ugwiki'),
  Type.Literal('ugwikibooks'),
  Type.Literal('ugwikiquote'),
  Type.Literal('ugwiktionary'),
  Type.Literal('ukwiki'),
  Type.Literal('ukwikibooks'),
  Type.Literal('ukwikinews'),
  Type.Literal('ukwikiquote'),
  Type.Literal('ukwikisource'),
  Type.Literal('ukwikivoyage'),
  Type.Literal('ukwiktionary'),
  Type.Literal('urwiki'),
  Type.Literal('urwikibooks'),
  Type.Literal('urwikiquote'),
  Type.Literal('urwiktionary'),
  Type.Literal('uzwiki'),
  Type.Literal('uzwikibooks'),
  Type.Literal('uzwikiquote'),
  Type.Literal('uzwiktionary'),
])
const Site_Chunk45 = Type.Union([
  Type.Literal('vecwiki'),
  Type.Literal('vecwikisource'),
  Type.Literal('vecwiktionary'),
  Type.Literal('vepwiki'),
  Type.Literal('vewiki'),
  Type.Literal('viwiki'),
  Type.Literal('viwikibooks'),
  Type.Literal('viwikiquote'),
  Type.Literal('viwikisource'),
  Type.Literal('viwikivoyage'),
  Type.Literal('viwiktionary'),
  Type.Literal('vlswiki'),
  Type.Literal('vowiki'),
  Type.Literal('vowikibooks'),
  Type.Literal('vowikiquote'),
  Type.Literal('vowiktionary'),
  Type.Literal('warwiki'),
  Type.Literal('wawiki'),
  Type.Literal('wawikibooks'),
  Type.Literal('wawikisource'),
])
const Site_Chunk46 = Type.Union([
  Type.Literal('wawiktionary'),
  Type.Literal('wikidatawiki'),
  Type.Literal('wikifunctionswiki'),
  Type.Literal('wikimaniawiki'),
  Type.Literal('wowiki'),
  Type.Literal('wowikiquote'),
  Type.Literal('wowiktionary'),
  Type.Literal('wuuwiki'),
  Type.Literal('xalwiki'),
  Type.Literal('xhwiki'),
  Type.Literal('xhwikibooks'),
  Type.Literal('xhwiktionary'),
  Type.Literal('xmfwiki'),
  Type.Literal('yiwiki'),
  Type.Literal('yiwikisource'),
  Type.Literal('yiwiktionary'),
  Type.Literal('yowiki'),
  Type.Literal('yowikibooks'),
  Type.Literal('yowiktionary'),
  Type.Literal('yuewiktionary'),
])
const Site_Chunk47 = Type.Union([
  Type.Literal('zawiki'),
  Type.Literal('zawikibooks'),
  Type.Literal('zawikiquote'),
  Type.Literal('zawiktionary'),
  Type.Literal('zeawiki'),
  Type.Literal('zghwiki'),
  Type.Literal('zh_classicalwiki'),
  Type.Literal('zh_min_nanwiki'),
  Type.Literal('zh_min_nanwikibooks'),
  Type.Literal('zh_min_nanwikiquote'),
  Type.Literal('zh_min_nanwikisource'),
  Type.Literal('zh_min_nanwiktionary'),
  Type.Literal('zh_yuewiki'),
  Type.Literal('zhwiki'),
  Type.Literal('zhwikibooks'),
  Type.Literal('zhwikinews'),
  Type.Literal('zhwikiquote'),
  Type.Literal('zhwikisource'),
  Type.Literal('zhwikiversity'),
  Type.Literal('zhwikivoyage'),
])
const Site_Chunk48 = Type.Union([
  Type.Literal('zhwiktionary'),
  Type.Literal('zuwiki'),
  Type.Literal('zuwikibooks'),
  Type.Literal('zuwiktionary'),
])
export const Url = Type.String()

export type Url = Static<typeof Url>

export const SitelinkBadges = Type.Array(ItemId)

export type SitelinkBadges = Static<typeof SitelinkBadges>

export const NamespacedEntityId = Type.Union([
  Type.TemplateLiteral([Type.Literal('Item:'), Type.String()]),
  Type.TemplateLiteral([Type.Literal('Lexeme:'), Type.String()]),
  Type.TemplateLiteral([Type.Literal('Property:'), Type.String()]),
  Type.TemplateLiteral([Type.Literal('EntitySchema:'), Type.String()]),
])

export type NamespacedEntityId = Static<typeof NamespacedEntityId>

export const IdByEntityType = Type.Object({
  form: FormId,
  item: ItemId,
  lexeme: LexemeId,
  property: PropertyId,
  sense: SenseId,
  'entity-schema': EntitySchemaId,
})

export type IdByEntityType = Static<typeof IdByEntityType>

export const NonNestedEntityId = Type.Union([
  ItemId,
  PropertyId,
  LexemeId,
  MediaInfoId,
  EntitySchemaId,
])

export type NonNestedEntityId = Static<typeof NonNestedEntityId>

export const CustomSimplifiedSnak = Type.Object({
  type: Type.Optional(DataType),
  value: Type.Unknown(),
  snaktype: Type.Optional(SnakType),
  hash: Type.Optional(Hash),
})

export type CustomSimplifiedSnak = Static<typeof CustomSimplifiedSnak>

export const LanguageRecord = <V extends TSchema>(V: V) =>
  Type.Partial(Type.Readonly(Type.Record(LanguageCode, V)))

export type LanguageRecord<V extends TSchema> = Static<ReturnType<typeof LanguageRecord<V>>>

export const Term = Type.Object({
  language: LanguageCode,
  value: Type.String(),
})

export type Term = Static<typeof Term>

export const MonolingualTextSnakDataValue = Type.Object({
  type: Type.Literal('monolingualtext'),
  value: Type.Object({
    language: LanguageCode,
    text: Type.String(),
  }),
})

export type MonolingualTextSnakDataValue = Static<typeof MonolingualTextSnakDataValue>

export const Site = Type.Union([
  Site_Chunk1,
  Site_Chunk2,
  Site_Chunk3,
  Site_Chunk4,
  Site_Chunk5,
  Site_Chunk6,
  Site_Chunk7,
  Site_Chunk8,
  Site_Chunk9,
  Site_Chunk10,
  Site_Chunk11,
  Site_Chunk12,
  Site_Chunk13,
  Site_Chunk14,
  Site_Chunk15,
  Site_Chunk16,
  Site_Chunk17,
  Site_Chunk18,
  Site_Chunk19,
  Site_Chunk20,
  Site_Chunk21,
  Site_Chunk22,
  Site_Chunk23,
  Site_Chunk24,
  Site_Chunk25,
  Site_Chunk26,
  Site_Chunk27,
  Site_Chunk28,
  Site_Chunk29,
  Site_Chunk30,
  Site_Chunk31,
  Site_Chunk32,
  Site_Chunk33,
  Site_Chunk34,
  Site_Chunk35,
  Site_Chunk36,
  Site_Chunk37,
  Site_Chunk38,
  Site_Chunk39,
  Site_Chunk40,
  Site_Chunk41,
  Site_Chunk42,
  Site_Chunk43,
  Site_Chunk44,
  Site_Chunk45,
  Site_Chunk46,
  Site_Chunk47,
  Site_Chunk48,
])

export type Site = Static<typeof Site>

export const EntityPageTitle = Type.Union([NamespacedEntityId, ItemId])

export type EntityPageTitle = Static<typeof EntityPageTitle>

export const GenericWikibaseEntityIdSnakDataValue = <T extends TSchema>(T: T) =>
  Type.Object({
    type: Type.Literal('wikibase-entityid'),
    value: Type.Object({
      id: Type.Index(IdByEntityType, T),
      'numeric-id': Type.Optional(Type.Number()),
      'entity-type': T,
    }),
  })

export type GenericWikibaseEntityIdSnakDataValue<T extends TSchema> = Static<
  ReturnType<typeof GenericWikibaseEntityIdSnakDataValue<T>>
>

export const EntityId = Type.Union([NonNestedEntityId, FormId, SenseId])

export type EntityId = Static<typeof EntityId>

export const SimplifiedSnak = Type.Union([Type.String(), Type.Number(), CustomSimplifiedSnak])

export type SimplifiedSnak = Static<typeof SimplifiedSnak>

export const SimplifiedLabels = LanguageRecord(SimplifiedTerm)

export type SimplifiedLabels = Static<typeof SimplifiedLabels>

export const SimplifiedDescriptions = LanguageRecord(SimplifiedTerm)

export type SimplifiedDescriptions = Static<typeof SimplifiedDescriptions>

export const SimplifiedAliases = LanguageRecord(Type.Readonly(Type.Array(SimplifiedTerm)))

export type SimplifiedAliases = Static<typeof SimplifiedAliases>

export const SimplifiedLemmas = LanguageRecord(SimplifiedTerm)

export type SimplifiedLemmas = Static<typeof SimplifiedLemmas>

export const SimplifiedRepresentations = LanguageRecord(SimplifiedTerm)

export type SimplifiedRepresentations = Static<typeof SimplifiedRepresentations>

export const SimplifiedGlosses = LanguageRecord(SimplifiedTerm)

export type SimplifiedGlosses = Static<typeof SimplifiedGlosses>

export const Labels = LanguageRecord(Term)

export type Labels = Static<typeof Labels>

export const Descriptions = LanguageRecord(Term)

export type Descriptions = Static<typeof Descriptions>

export const Aliases = LanguageRecord(Type.Readonly(Type.Array(Term)))

export type Aliases = Static<typeof Aliases>

export const Lemmas = LanguageRecord(Term)

export type Lemmas = Static<typeof Lemmas>

export const Representations = LanguageRecord(Term)

export type Representations = Static<typeof Representations>

export const Glosses = LanguageRecord(Term)

export type Glosses = Static<typeof Glosses>

export const SimplifiedSitelinks = Type.Partial(
  Type.Intersect([
    Type.Record(Site_Chunk1, SitelinkTitle),
    Type.Record(Site_Chunk2, SitelinkTitle),
    Type.Record(Site_Chunk3, SitelinkTitle),
    Type.Record(Site_Chunk4, SitelinkTitle),
    Type.Record(Site_Chunk5, SitelinkTitle),
    Type.Record(Site_Chunk6, SitelinkTitle),
    Type.Record(Site_Chunk7, SitelinkTitle),
    Type.Record(Site_Chunk8, SitelinkTitle),
    Type.Record(Site_Chunk9, SitelinkTitle),
    Type.Record(Site_Chunk10, SitelinkTitle),
    Type.Record(Site_Chunk11, SitelinkTitle),
    Type.Record(Site_Chunk12, SitelinkTitle),
    Type.Record(Site_Chunk13, SitelinkTitle),
    Type.Record(Site_Chunk14, SitelinkTitle),
    Type.Record(Site_Chunk15, SitelinkTitle),
    Type.Record(Site_Chunk16, SitelinkTitle),
    Type.Record(Site_Chunk17, SitelinkTitle),
    Type.Record(Site_Chunk18, SitelinkTitle),
    Type.Record(Site_Chunk19, SitelinkTitle),
    Type.Record(Site_Chunk20, SitelinkTitle),
    Type.Record(Site_Chunk21, SitelinkTitle),
    Type.Record(Site_Chunk22, SitelinkTitle),
    Type.Record(Site_Chunk23, SitelinkTitle),
    Type.Record(Site_Chunk24, SitelinkTitle),
    Type.Record(Site_Chunk25, SitelinkTitle),
    Type.Record(Site_Chunk26, SitelinkTitle),
    Type.Record(Site_Chunk27, SitelinkTitle),
    Type.Record(Site_Chunk28, SitelinkTitle),
    Type.Record(Site_Chunk29, SitelinkTitle),
    Type.Record(Site_Chunk30, SitelinkTitle),
    Type.Record(Site_Chunk31, SitelinkTitle),
    Type.Record(Site_Chunk32, SitelinkTitle),
    Type.Record(Site_Chunk33, SitelinkTitle),
    Type.Record(Site_Chunk34, SitelinkTitle),
    Type.Record(Site_Chunk35, SitelinkTitle),
    Type.Record(Site_Chunk36, SitelinkTitle),
    Type.Record(Site_Chunk37, SitelinkTitle),
    Type.Record(Site_Chunk38, SitelinkTitle),
    Type.Record(Site_Chunk39, SitelinkTitle),
    Type.Record(Site_Chunk40, SitelinkTitle),
    Type.Record(Site_Chunk41, SitelinkTitle),
    Type.Record(Site_Chunk42, SitelinkTitle),
    Type.Record(Site_Chunk43, SitelinkTitle),
    Type.Record(Site_Chunk44, SitelinkTitle),
    Type.Record(Site_Chunk45, SitelinkTitle),
    Type.Record(Site_Chunk46, SitelinkTitle),
    Type.Record(Site_Chunk47, SitelinkTitle),
    Type.Record(Site_Chunk48, SitelinkTitle),
  ]),
)

export type SimplifiedSitelinks = Static<typeof SimplifiedSitelinks>

export const Sitelink = Type.Object({
  site: Site,
  title: SitelinkTitle,
  badges: SitelinkBadges,
  url: Type.Optional(Url),
})

export type Sitelink = Static<typeof Sitelink>

export const WikibaseFormSnakDataValue = GenericWikibaseEntityIdSnakDataValue(Type.Literal('form'))

export type WikibaseFormSnakDataValue = Static<typeof WikibaseFormSnakDataValue>

export const WikibaseItemSnakDataValue = GenericWikibaseEntityIdSnakDataValue(Type.Literal('item'))

export type WikibaseItemSnakDataValue = Static<typeof WikibaseItemSnakDataValue>

export const WikibaseLexemeSnakDataValue = GenericWikibaseEntityIdSnakDataValue(
  Type.Literal('lexeme'),
)

export type WikibaseLexemeSnakDataValue = Static<typeof WikibaseLexemeSnakDataValue>

export const WikibasePropertySnakDataValue = GenericWikibaseEntityIdSnakDataValue(
  Type.Literal('property'),
)

export type WikibasePropertySnakDataValue = Static<typeof WikibasePropertySnakDataValue>

export const WikibaseSenseSnakDataValue = GenericWikibaseEntityIdSnakDataValue(
  Type.Literal('sense'),
)

export type WikibaseSenseSnakDataValue = Static<typeof WikibaseSenseSnakDataValue>

export const EntitySchemaSnakDataValue = GenericWikibaseEntityIdSnakDataValue(
  Type.Literal('entity-schema'),
)

export type EntitySchemaSnakDataValue = Static<typeof EntitySchemaSnakDataValue>

export const PropertyClaimsId = Type.TemplateLiteral([
  Type.String(),
  Type.Literal('#'),
  Type.String(),
])

export type PropertyClaimsId = Static<typeof PropertyClaimsId>

export const Guid = Type.TemplateLiteral([
  Type.Union([Type.String(), Type.String()]),
  Type.Literal('$'),
  Type.String(),
])

export type Guid = Static<typeof Guid>

export const GuidAltSyntax = Type.TemplateLiteral([
  Type.Union([Type.String(), Type.String()]),
  Type.Literal('-'),
  Type.String(),
])

export type GuidAltSyntax = Static<typeof GuidAltSyntax>

export const SimplifiedEntityInfo = Type.Object({
  id: EntityId,
  modified: Type.Optional(Type.String()),
})

export type SimplifiedEntityInfo = Static<typeof SimplifiedEntityInfo>

export const SimplifiedQualifier = SimplifiedSnak

export type SimplifiedQualifier = Static<typeof SimplifiedQualifier>

export const SimplifiedReferenceSnak = SimplifiedSnak

export type SimplifiedReferenceSnak = Static<typeof SimplifiedReferenceSnak>

export const Sitelinks = Type.Partial(
  Type.Intersect([
    Type.Record(Site_Chunk1, Sitelink),
    Type.Record(Site_Chunk2, Sitelink),
    Type.Record(Site_Chunk3, Sitelink),
    Type.Record(Site_Chunk4, Sitelink),
    Type.Record(Site_Chunk5, Sitelink),
    Type.Record(Site_Chunk6, Sitelink),
    Type.Record(Site_Chunk7, Sitelink),
    Type.Record(Site_Chunk8, Sitelink),
    Type.Record(Site_Chunk9, Sitelink),
    Type.Record(Site_Chunk10, Sitelink),
    Type.Record(Site_Chunk11, Sitelink),
    Type.Record(Site_Chunk12, Sitelink),
    Type.Record(Site_Chunk13, Sitelink),
    Type.Record(Site_Chunk14, Sitelink),
    Type.Record(Site_Chunk15, Sitelink),
    Type.Record(Site_Chunk16, Sitelink),
    Type.Record(Site_Chunk17, Sitelink),
    Type.Record(Site_Chunk18, Sitelink),
    Type.Record(Site_Chunk19, Sitelink),
    Type.Record(Site_Chunk20, Sitelink),
    Type.Record(Site_Chunk21, Sitelink),
    Type.Record(Site_Chunk22, Sitelink),
    Type.Record(Site_Chunk23, Sitelink),
    Type.Record(Site_Chunk24, Sitelink),
    Type.Record(Site_Chunk25, Sitelink),
    Type.Record(Site_Chunk26, Sitelink),
    Type.Record(Site_Chunk27, Sitelink),
    Type.Record(Site_Chunk28, Sitelink),
    Type.Record(Site_Chunk29, Sitelink),
    Type.Record(Site_Chunk30, Sitelink),
    Type.Record(Site_Chunk31, Sitelink),
    Type.Record(Site_Chunk32, Sitelink),
    Type.Record(Site_Chunk33, Sitelink),
    Type.Record(Site_Chunk34, Sitelink),
    Type.Record(Site_Chunk35, Sitelink),
    Type.Record(Site_Chunk36, Sitelink),
    Type.Record(Site_Chunk37, Sitelink),
    Type.Record(Site_Chunk38, Sitelink),
    Type.Record(Site_Chunk39, Sitelink),
    Type.Record(Site_Chunk40, Sitelink),
    Type.Record(Site_Chunk41, Sitelink),
    Type.Record(Site_Chunk42, Sitelink),
    Type.Record(Site_Chunk43, Sitelink),
    Type.Record(Site_Chunk44, Sitelink),
    Type.Record(Site_Chunk45, Sitelink),
    Type.Record(Site_Chunk46, Sitelink),
    Type.Record(Site_Chunk47, Sitelink),
    Type.Record(Site_Chunk48, Sitelink),
  ]),
)

export type Sitelinks = Static<typeof Sitelinks>

export const WikibaseEntityIdSnakDataValue = Type.Union([
  WikibaseFormSnakDataValue,
  WikibaseItemSnakDataValue,
  WikibaseLexemeSnakDataValue,
  WikibasePropertySnakDataValue,
  WikibaseSenseSnakDataValue,
  EntitySchemaSnakDataValue,
])

export type WikibaseEntityIdSnakDataValue = Static<typeof WikibaseEntityIdSnakDataValue>

export const SimplifiedPropertyQualifiers = Type.Array(SimplifiedQualifier)

export type SimplifiedPropertyQualifiers = Static<typeof SimplifiedPropertyQualifiers>

export const SimplifiedReferenceSnaks = Type.Record(PropertyId, Type.Array(SimplifiedReferenceSnak))

export type SimplifiedReferenceSnaks = Static<typeof SimplifiedReferenceSnaks>

export const SnakDataValue = Type.Union([
  GlobeCoordinateSnakDataValue,
  MonolingualTextSnakDataValue,
  QuantitySnakDataValue,
  StringSnakDataValue,
  TimeSnakDataValue,
  WikibaseEntityIdSnakDataValue,
])

export type SnakDataValue = Static<typeof SnakDataValue>

export const SimplifiedQualifiers = Type.Object({})

export type SimplifiedQualifiers = Static<typeof SimplifiedQualifiers>

export const RichSimplifiedReferenceSnaks = Type.Object({
  snaks: SimplifiedReferenceSnaks,
  hash: Hash,
})

export type RichSimplifiedReferenceSnaks = Static<typeof RichSimplifiedReferenceSnaks>

export const Snak = Type.Object({
  datatype: DataType,
  datavalue: Type.Optional(SnakDataValue),
  hash: Type.String(),
  property: PropertyId,
  snaktype: SnakType,
})

export type Snak = Static<typeof Snak>

export const SimplifiedReference = Type.Union([
  SimplifiedReferenceSnaks,
  RichSimplifiedReferenceSnaks,
])

export type SimplifiedReference = Static<typeof SimplifiedReference>

export const ReferenceSnak = Snak

export type ReferenceSnak = Static<typeof ReferenceSnak>

export const Qualifier = Snak

export type Qualifier = Static<typeof Qualifier>

export const SimplifiedReferences = Type.Array(SimplifiedReference)

export type SimplifiedReferences = Static<typeof SimplifiedReferences>

export const Reference = Type.Object({
  hash: Type.String(),
  snaks: Type.Record(PropertyId, Type.Array(ReferenceSnak)),
  'snaks-order': Type.Array(PropertyId),
})

export type Reference = Static<typeof Reference>

export const PropertyQualifiers = Type.Array(Qualifier)

export type PropertyQualifiers = Static<typeof PropertyQualifiers>

export const CustomSimplifiedClaim = Type.Composite([
  CustomSimplifiedSnak,
  Type.Object({
    id: Type.Optional(Guid),
    rank: Type.Optional(Rank),
    qualifiers: Type.Optional(SimplifiedQualifiers),
    references: Type.Optional(SimplifiedReferences),
  }),
])

export type CustomSimplifiedClaim = Static<typeof CustomSimplifiedClaim>

export const Qualifiers = Type.Record(PropertyId, PropertyQualifiers)

export type Qualifiers = Static<typeof Qualifiers>

export const SimplifiedClaim = Type.Union([Type.String(), Type.Number(), CustomSimplifiedClaim])

export type SimplifiedClaim = Static<typeof SimplifiedClaim>

export const Claim = Type.Object({
  id: Guid,
  mainsnak: Snak,
  rank: Rank,
  type: Type.Literal('statement'),
  qualifiers: Type.Optional(Qualifiers),
  'qualifiers-order': Type.Optional(Type.Array(PropertyId)),
  references: Type.Optional(Type.Array(Reference)),
})

export type Claim = Static<typeof Claim>

export const SimplifiedPropertyClaims = Type.Array(SimplifiedClaim)

export type SimplifiedPropertyClaims = Static<typeof SimplifiedPropertyClaims>

export const PropertyClaims = Type.Array(Claim)

export type PropertyClaims = Static<typeof PropertyClaims>

export const SimplifiedClaims = Type.Record(PropertyId, SimplifiedPropertyClaims)

export type SimplifiedClaims = Static<typeof SimplifiedClaims>

export const Claims = Type.Record(PropertyId, PropertyClaims)

export type Claims = Static<typeof Claims>

export const SimplifiedItem = Type.Composite([
  SimplifiedEntityInfo,
  Type.Object({
    type: Type.Literal('item'),
    labels: Type.Optional(SimplifiedLabels),
    descriptions: Type.Optional(SimplifiedDescriptions),
    aliases: Type.Optional(SimplifiedAliases),
    claims: Type.Optional(SimplifiedClaims),
    sitelinks: Type.Optional(SimplifiedSitelinks),
    lexicalCategory: Type.String(),
  }),
])

export type SimplifiedItem = Static<typeof SimplifiedItem>

export const SimplifiedProperty = Type.Composite([
  SimplifiedEntityInfo,
  Type.Object({
    type: Type.Literal('property'),
    datatype: DataType,
    labels: Type.Optional(SimplifiedLabels),
    descriptions: Type.Optional(SimplifiedDescriptions),
    aliases: Type.Optional(SimplifiedAliases),
    claims: Type.Optional(SimplifiedClaims),
    lexicalCategory: Type.String(),
  }),
])

export type SimplifiedProperty = Static<typeof SimplifiedProperty>

export const SimplifiedForm = Type.Object({
  id: FormId,
  representations: Type.Optional(SimplifiedRepresentations),
  grammaticalFeatures: Type.Optional(Type.Array(ItemId)),
  claims: Type.Optional(SimplifiedClaims),
})

export type SimplifiedForm = Static<typeof SimplifiedForm>

export const SimplifiedSense = Type.Object({
  id: SenseId,
  glosses: Type.Optional(SimplifiedGlosses),
  claims: Type.Optional(SimplifiedClaims),
})

export type SimplifiedSense = Static<typeof SimplifiedSense>

export const Property = Type.Composite([
  EntityInfo(PropertyId),
  Type.Object({
    type: Type.Literal('property'),
    datatype: Type.Optional(DataType),
    labels: Type.Optional(Labels),
    descriptions: Type.Optional(Descriptions),
    aliases: Type.Optional(Aliases),
    claims: Type.Optional(Claims),
  }),
])

export type Property = Static<typeof Property>

export const Item = Type.Composite([
  EntityInfo(ItemId),
  Type.Object({
    type: Type.Literal('item'),
    labels: Type.Optional(Labels),
    descriptions: Type.Optional(Descriptions),
    aliases: Type.Optional(Aliases),
    claims: Type.Optional(Claims),
    sitelinks: Type.Optional(Sitelinks),
  }),
])

export type Item = Static<typeof Item>

export const MediaInfo = Type.Composite([
  EntityInfo(MediaInfoId),
  Type.Object({
    type: Type.Literal('mediainfo'),
    labels: Type.Optional(Labels),
    descriptions: Type.Optional(Descriptions),
    statements: Type.Optional(Claims),
  }),
])

export type MediaInfo = Static<typeof MediaInfo>

export const Form = Type.Object({
  id: FormId,
  representations: Type.Optional(Representations),
  grammaticalFeatures: Type.Optional(Type.Array(ItemId)),
  claims: Type.Optional(Claims),
})

export type Form = Static<typeof Form>

export const Sense = Type.Object({
  id: SenseId,
  glosses: Type.Optional(Glosses),
  claims: Type.Optional(Claims),
})

export type Sense = Static<typeof Sense>

export const SimplifiedForms = Type.Record(PropertyId, Type.Array(SimplifiedForm))

export type SimplifiedForms = Static<typeof SimplifiedForms>

export const SimplifiedSenses = Type.Record(PropertyId, Type.Array(SimplifiedSense))

export type SimplifiedSenses = Static<typeof SimplifiedSenses>

export const Lexeme = Type.Composite([
  EntityInfo(LexemeId),
  Type.Object({
    type: Type.Literal('lexeme'),
    lexicalCategory: ItemId,
    language: ItemId,
    claims: Type.Optional(Claims),
    lemmas: Type.Optional(Lemmas),
    forms: Type.Optional(Type.Array(Form)),
    senses: Type.Optional(Type.Array(Sense)),
  }),
])

export type Lexeme = Static<typeof Lexeme>

export const SimplifiedLexeme = Type.Composite([
  SimplifiedEntityInfo,
  Type.Object({
    type: Type.Literal('lexeme'),
    lexicalCategory: ItemId,
    language: ItemId,
    claims: Type.Optional(SimplifiedClaims),
    lemmas: Type.Optional(SimplifiedLemmas),
    forms: Type.Optional(SimplifiedForms),
    senses: Type.Optional(SimplifiedSenses),
  }),
])

export type SimplifiedLexeme = Static<typeof SimplifiedLexeme>

export const Entity = Type.Union([Property, Item, Lexeme, MediaInfo])

export type Entity = Static<typeof Entity>

export const SimplifiedEntity = Type.Union([SimplifiedProperty, SimplifiedItem, SimplifiedLexeme])

export type SimplifiedEntity = Static<typeof SimplifiedEntity>

export const Entities = Type.Record(EntityId, Entity)

export type Entities = Static<typeof Entities>

export const SimplifiedEntities = Type.Record(EntityId, SimplifiedEntity)

export type SimplifiedEntities = Static<typeof SimplifiedEntities>
