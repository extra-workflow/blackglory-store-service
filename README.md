# @extra-workflow/blackglory-store-service
## Install
```sh
npm install --save @extra-workflow/blackglory-store-service
# or
yarn add @extra-workflow/blackglory-store-service
```

## API
### StoreService
```ts
class StoreService<T> implements IStore<T> {
  constructor(
    client: StoreClient
  , namespace: string
  , options: {
      toJSONValue: (value: T) => JSONValue
      fromJSONValue: (json: JSONValue) => T
    }
  )
}
```
