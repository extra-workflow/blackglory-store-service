import { IRecord, IStore } from 'extra-workflow'
import { sortNumbersAscending } from 'extra-sort'
import { isntUndefined, JSONValue } from '@blackglory/prelude'
import { last, toString, pipeAsync } from 'extra-utils'
import { StoreClient } from '@blackglory/store-js'

export class StoreService<T> implements IStore<T> {
  constructor(
    private client: StoreClient
  , private namespace: string
  , private options: {
      toJSONValue: (value: T) => JSONValue
      fromJSONValue: (json: JSONValue) => T
    }
  ) {}

  async set(index: number, record: IRecord<T>): Promise<void> {
    await this.client.setItem(
      this.namespace
    , this.indexToItemId(index)
    , {
        type: record.type
      , value: this.options.toJSONValue(record.value)
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
      , value: this.options.fromJSONValue(record.value)
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
