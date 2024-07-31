// ? Are these two the same? Should they be combined?

export enum Unification {
  REGULAR = 'regular',
  OPEN = 'open',
  UNIFY = 'unify',
}

export type UnifyStatus = 'unifyStats' | 'openStats' | 'regularStats' | undefined
