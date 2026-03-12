import { describe, test, expect, afterEach, afterAll } from 'vitest'
import { StoreClient } from '@blackglory/store-js'
import { StoreService } from '@src/store-service.js'
import { each } from 'extra-promise'
import { JSONValue } from '@blackglory/prelude'
import { IRecord } from 'extra-workflow'

const server = 'ws://store:8080'
const client = await StoreClient.create({ server })

afterEach(async () => {
  const namespaces = await client.getAllNamespaces()
  await each(namespaces, async namespace => {
    await client.clearItemsByNamespace(namespace)
  })
})

afterAll(async () => {
  await client.close()
})

describe('StoreService', () => {
  describe('set', () => {
    test('record does not exist', async () => {
      const store = new StoreService<JSONValue>(client, 'namespace', {
        fromJSONValue: passThrough
      , toJSONValue: passThrough
      })
      const record: IRecord<string> = {
        type: 'result'
      , value: 'value'
      }

      await store.set(0, record)

      expect(await store.dump()).toStrictEqual([
        record
      ])
    })

    test('record exists', async () => {
      const store = new StoreService<JSONValue>(client, 'namespace', {
        fromJSONValue: passThrough
      , toJSONValue: passThrough
      })
      const oldRecord: IRecord<string> = {
        type: 'result'
      , value: 'old-value'
      }
      await store.set(0, oldRecord)
      const newRecord: IRecord<string> = {
        type: 'result'
      , value: 'new-value'
      }

      await store.set(0, newRecord)

      expect(await store.dump()).toStrictEqual([
        newRecord
      ])
    })
  })

  describe('get', () => {
    test('record exists', async () => {
      const store = new StoreService<JSONValue>(client, 'namespace', {
        fromJSONValue: passThrough
      , toJSONValue: passThrough
      })
      const record: IRecord<string> = {
        type: 'result'
      , value: 'value'
      }
      await store.set(0, record)

      const result = await store.get(0)

      expect(result).toStrictEqual(record)
    })

    test('event does not exist', async () => {
      const store = new StoreService<JSONValue>(client, 'namespace', {
        fromJSONValue: passThrough
      , toJSONValue: passThrough
      })

      const result = await store.get(0)

      expect(result).toBeUndefined()
    })
  })

  describe('pop', () => {
    test('record exists', async () => {
      const store = new StoreService<JSONValue>(client, 'namespace', {
        fromJSONValue: passThrough
      , toJSONValue: passThrough
      })
      const record: IRecord<string> = {
        type: 'result'
      , value: 'value'
      }
      await store.set(0, record)

      const result = await store.pop()

      expect(result).toStrictEqual(record)
      expect(await store.dump()).toStrictEqual([])
    })

    test('record does not exist', async () => {
      const store = new StoreService<JSONValue>(client, 'namespace', {
        fromJSONValue: passThrough
      , toJSONValue: passThrough
      })

      const result = await store.pop()

      expect(result).toBeUndefined()
      expect(await store.dump()).toStrictEqual([])
    })
  })

  test('clear', async () => {
    const store = new StoreService<JSONValue>(client, 'namespace', {
      fromJSONValue: passThrough
    , toJSONValue: passThrough
    })
    const record: IRecord<string> = {
      type: 'result'
    , value: 'value'
    }
    await store.set(0, record)

    await store.clear()

    expect(await store.dump()).toStrictEqual([])
  })

  test('dump', async () => {
    const store = new StoreService<JSONValue>(client, 'namespace', {
      fromJSONValue: passThrough
    , toJSONValue: passThrough
    })
    const record1: IRecord<string> = {
      type: 'result'
    , value: 'value-1'
    }
    const record2: IRecord<string> = {
      type: 'result'
    , value: 'value-2'
    }
    store.set(0, record1)
    store.set(1, record2)

    const result = await store.dump()

    expect(result).toStrictEqual([
      record1
    , record2
    ])
  })
})

function passThrough<T>(value: T): T {
  return value
}
