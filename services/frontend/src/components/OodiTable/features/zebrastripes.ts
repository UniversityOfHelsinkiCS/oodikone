import { TableFeature } from '@tanstack/react-table'

export interface Zebrastripes {
  useZebrastripes: boolean
}

export const ZebrastripesFeature: TableFeature<unknown> = {
  getInitialState: (state): Zebrastripes => {
    return {
      useZebrastripes: true,
      ...state,
    }
  },
}
