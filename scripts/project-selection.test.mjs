import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../src/features/contractors/', import.meta.url)
const modules = new Map()
const owner = { user: { id: 'customer-a' } }
globalThis[Symbol.for('project-selection-test-owner')] = owner
const authModule = `data:text/javascript;base64,${Buffer.from(
  "export const useAuthStore = Object.assign(selector => selector(globalThis[Symbol.for('project-selection-test-owner')]), {getState: () => globalThis[Symbol.for('project-selection-test-owner')]})"
).toString('base64')}`

async function loadSource(file) {
  if (modules.has(file.href)) return modules.get(file.href)
  let js = ts.transpileModule(await readFile(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext }
  }).outputText
  for (const match of [...js.matchAll(/from ['"]([^'"]+)['"]/g)]) {
    const path = match[1]
    const resolved = path.startsWith('.')
      ? await loadSource(new URL(path + '.ts', file))
      : path === '@/shared/auth'
        ? authModule
        : import.meta.resolve(path)
    js = js.replace(match[0], `from '${resolved}'`)
  }
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
  modules.set(file.href, url)
  return url
}

class MemoryStorage {
  values = new Map()
  writes = 0
  blocked = false
  getItem(key) {
    return this.values.get(key) ?? null
  }
  setItem(key, value) {
    if (this.blocked) throw new Error('QuotaExceededError')
    this.writes++
    this.values.set(key, value)
  }
  removeItem(key) {
    this.values.delete(key)
  }
}
globalThis.localStorage = new MemoryStorage()
const storage = globalThis.localStorage
const service = await import(await loadSource(new URL('services/project-selection.service.ts', root)))
const { emptyBrief } = await import(await loadSource(new URL('services/brief.service.ts', root)))
const {
  useProjectSelectionStore: store,
  PROJECT_SELECTION_STORAGE_KEY: key,
  hydrateProjectSelection,
  refreshSelectedProject
} = await import(await loadSource(new URL('store/project-selection.store.ts', root)))

function brief(id = 'local-a', overrides = {}) {
  return {
    ...emptyBrief(),
    id,
    userId: 'customer-a',
    ownershipVersion: 1,
    constructionSiteId: 'site-' + id,
    name: 'Project ' + id,
    buildingType: 'House',
    landArea: 120,
    address: { provinceCode: 66, provinceName: 'Province', wardCode: 1, wardName: 'Ward', street: 'Street' },
    scope: 'construction',
    scopeNote: 'Build a home',
    status: 'ready',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...overrides
  }
}
function persist(selections) {
  storage.setItem(key, JSON.stringify({ state: { selectedProjects: selections }, version: 2 }))
}
function selected(userId = owner.user.id) {
  return store.getState().selectedProjects[userId]
}

test('the first completed project is selectable; empty, incomplete, contracted and foreign projects are not', () => {
  assert.equal(service.isSelectableProject(brief(), 'customer-a'), true)
  for (const overrides of [
    { scopeNote: '' },
    { landArea: 0 },
    { status: 'contracted' },
    { userId: 'customer-b' },
    { ownershipVersion: undefined }
  ]) {
    assert.equal(service.isSelectableProject(brief('invalid', overrides), 'customer-a'), false)
  }
})

test('a saved choice survives a newer project and refreshes its live summary', () => {
  const chosen = brief('a')
  const updated = { ...chosen, name: 'Updated project', address: { ...chosen.address, street: 'New street' } }
  const newer = brief('b', { updatedAt: '2026-10-06T00:00:00Z' })
  assert.equal(
    service.resolveSelectedProject([newer, updated], service.projectSelectionSnapshot(chosen), 'customer-a'),
    updated
  )
})

test('server/local URL aliases resolve to the same project', () => {
  const local = brief('local-a')
  const server = { ...local, id: local.constructionSiteId }
  assert.equal(service.resolveSelectedProject([local], service.projectSelectionSnapshot(server), 'customer-a'), local)
})

test('a deleted or ineligible choice falls back to the newest eligible owned project', () => {
  const chosen = service.projectSelectionSnapshot(brief('missing'))
  const fallback = brief('b', { updatedAt: '2026-10-06T00:00:00Z' })
  assert.equal(
    service.resolveSelectedProject(
      [brief('a'), fallback, brief('foreign', { userId: 'customer-b' })],
      chosen,
      'customer-a'
    ),
    fallback
  )
  assert.equal(
    service.resolveSelectedProject([brief('missing', { status: 'contracted' })], chosen, 'customer-a'),
    undefined
  )
})

test('completion hydration preserves selections already stored for another account', async () => {
  const other = brief('other', { userId: 'customer-b' })
  persist({ 'customer-b': service.projectSelectionSnapshot(other) })
  await hydrateProjectSelection()
  store.getState().selectProject('customer-a', brief())
  assert.equal(selected().id, 'local-a')
  assert.equal(selected('customer-b').id, 'other')
  assert.equal(JSON.parse(storage.getItem(key)).state.selectedProjects['customer-a'].id, 'local-a')
})

test('opening another owned URL updates the persistent choice, without duplicate writes on rerender', () => {
  store.getState().selectProject('customer-a', brief('direct-url'))
  const writes = storage.writes
  store.getState().selectProject('customer-a', brief('direct-url'))
  assert.equal(selected().id, 'direct-url')
  assert.equal(storage.writes, writes)
})

test('editing the chosen project refreshes metadata; editing a different project keeps the choice', () => {
  refreshSelectedProject(brief('unselected', { name: 'Other edit' }))
  assert.equal(selected().id, 'direct-url')
  refreshSelectedProject(
    brief('direct-url', { name: 'Renamed', address: { ...brief().address, street: 'Updated street' } })
  )
  assert.equal(selected().name, 'Renamed')
  assert.equal(selected().address.street, 'Updated street')
})

test('account changes and late responses cannot write a foreign selection', () => {
  owner.user = { id: 'customer-b' }
  assert.throws(() => store.getState().selectProject('customer-a', brief()), /OwnerMismatch/)
  assert.throws(() => store.getState().selectProject('customer-b', brief()), /OwnerMismatch/)
  refreshSelectedProject(brief('direct-url', { name: 'Late response' }))
  assert.equal(selected('customer-a').name, 'Renamed')
  owner.user = { id: 'customer-a' }
})

test('rehydration picks up a choice changed in another tab and key deletion clears memory', async () => {
  persist({ 'customer-a': service.projectSelectionSnapshot(brief('other-tab')) })
  await store.persist.rehydrate()
  assert.equal(selected().id, 'other-tab')
  storage.removeItem(key)
  await store.persist.rehydrate()
  assert.equal(selected(), undefined)
})

test('malformed records are discarded while valid account choices remain', async () => {
  persist({
    'customer-a': { id: 'incomplete' },
    'customer-b': service.projectSelectionSnapshot(brief('b', { userId: 'customer-b' }))
  })
  await store.persist.rehydrate()
  assert.equal(selected(), undefined)
  assert.equal(selected('customer-b').id, 'b')
  assert.deepEqual(service.restoreProjectSelections({ selectedProjects: null }), {})
  assert.deepEqual(
    service.restoreProjectSelections({
      selectedProjects: { 'customer-a': service.projectSelectionSnapshot(brief('b', { userId: 'customer-b' })) }
    }),
    {}
  )
})

test('legacy server references remain candidates without acquiring ownership from storage', () => {
  const legacy = service.projectSelectionSnapshot(brief('legacy', { userId: undefined, ownershipVersion: undefined }))
  assert.equal(
    service.restoreProjectSelections({ selectedProjects: { 'customer-a': legacy } })['customer-a'].ownershipVersion,
    undefined
  )
  assert.equal(service.isSelectableProject(brief('legacy', { ownershipVersion: undefined }), 'customer-a'), false)
})

test('failed storage writes roll back memory and preserve the last saved project', () => {
  store.getState().selectProject('customer-a', brief('saved'))
  storage.blocked = true
  assert.throws(() => store.getState().selectProject('customer-a', brief('unsaved')), /QuotaExceededError/)
  assert.equal(selected().id, 'saved')
  assert.equal(JSON.parse(storage.getItem(key)).state.selectedProjects['customer-a'].id, 'saved')
  storage.blocked = false
})
