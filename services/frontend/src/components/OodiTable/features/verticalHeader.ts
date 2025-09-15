import { TableFeature } from '@tanstack/react-table'

export interface VerticalHeaders {
  useVerticalHeaders: string[]
}

export const VerticalHeaderFeature: TableFeature<unknown> = {
  getInitialState: (state): VerticalHeaders => {
    return {
      useVerticalHeaders: [],
      ...state,
    }
  },
}
