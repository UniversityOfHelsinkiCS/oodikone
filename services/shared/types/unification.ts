export enum Unification {
  REGULAR = 'regular',
  OPEN = 'open',
  UNIFY = 'unify',
}

/** @returns valid Unification state if exists, else undefined */
export const parseUnification = (text = '') =>
  ['regular', 'open', 'unify'].includes(text) ? (text as Unification) : undefined
