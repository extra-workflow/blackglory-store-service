import { IRecord, IStore } from 'extra-workflow'
import { sortNumbersAscending } from 'extra-sort'
import { assert, isntUndefined, JSONValue } from '@blackglory/prelude'
import { last, toString, pipeAsync } from 'extra-utils'
import { StoreClient } from '@blackglory/store-js'
import { map } from 'extra-promise'

export class StoreService<T> implements IStore<T> {
  private toJSONValue: (value: T) => JSONValue
  private fromJSONValue: (json: JSONValue) => T

  constructor(
    private client: StoreClient
  , private namespace: string
  , options: {
      toJSONValue: (value: T) => JSONValue
      fromJSONValue: (json: JSONValue) => T
    }
  ) {
    this.toJSONValue = options.toJSONValue
    this.fromJSONValue = options.fromJSONValue
  }

  async set(index: number, record: IRecord<T>): Promise<void> {
    await this.client.setItem(
      this.namespace
    , this.indexToItemId(index)
    , {
        type: record.type
      , value: this.toJSONValue(record.value)
      } satisfies IRecord<JSONValue>
    )
  }

  async get(index: number): Promise<IRecord<T> | undefined> {
    const item = await this.client.getItem(
      this.namespace
    , this.indexToItemId(index)
    )

    if (item) {
      const record = item.value as unknown as IRecord<JSONValue>

      return {
        type: record.type
      , value: this.fromJSONValue(record.value)
      }
    }
  }

  async pop(): Promise<IRecord<T> | undefined> {
    const lastIndex = last(await this.getIndexesAscending())

    if (isntUndefined(lastIndex)) {
      const record = await this.get(lastIndex)

      await this.client.removeItem(
        this.namespace
      , this.indexToItemId(lastIndex)
      )

      return record
    }
  }

  async clear(): Promise<void> {
    await this.client.clearItemsByNamespace(this.namespace)
  }

  async dump(): Promise<Array<IRecord<T>>> {
    const indexes = await this.getIndexesAscending()

    return await map(indexes, async index => {
      const record = await this.get(index)
      assert(record)

      return record
    })
  }

  private async getIndexesAscending(): Promise<number[]> {
    const indexes = await pipeAsync(
      this.client.getAllItemIds(this.namespace)
    , itemIds => itemIds.map(itemId => this.itemIdToIndex(itemId))
    )

    sortNumbersAscending(indexes)

    return indexes
  }

  private indexToItemId(index: number): string {
    return toString(index)
  }

  private itemIdToIndex(itemId: string): number {
    return Number.parseInt(itemId, 10)
  }
}
