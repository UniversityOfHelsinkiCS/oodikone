# The next generation of SortableTable

## Features

### Adding features

NOTE: **This guide assumes you are adding features to your base table. All of the techniques apply on standalone tables, but adding standalone features is discouraged in place of running them conditionally from the base table.**

Custom features extend `TableFeature` from `@tanstack/react-table`. More information found [here](https://tanstack.com/table/latest/docs/guide/custom-features).
Custom features added to the base table should not depend on `TData`, but a value is intended to pass as a generic for feedback. Therefore `TableFeature<unknown>` is recommended.

Methods in features CAN depend on `TData` by applying generic parameters to functions. E.g.

```ts
createTable: <TData>(table: Table<TData>) => {
  /* ... */
}
```

This CAN also be inferred from the feature by forcing generic parameter to the feature definition. E.g.

```ts
export const MyFeature = <TData>(): TableFeature<TData> = {
  createTable: (table: Table<TData>) => { /* ... */ }
}
```

but this requires running the feature in the table definition

```ts
const tabel: useReactTable<TData>({
  _features: [/* ... */, MyFeature<TData>(), /* ... */],
})
```

### Using features

#### State extending features

Features can apply to the `TableState` i.e.

```ts
interface MyStateInterface {
  myState: boolean
}

/* ... */
getInitialState: (state): MyStateInterface => ({
  myState: true,
  ...state,
})
```

NOTE: `getInitialState` is defined as `(?InitialTableState): Partial<TableState>` therefore applying the interface of your state extension is valid but not recommended.

Feature defined state can be override in any level of the table by setting the state manually e.g.

```ts
const tableOptions = {
  initialState: {
    myState: false,
  },
}
```

or conditinally

```ts
const tableOptions = {
  state: {
    myState: myCondition,
  },
}
```
