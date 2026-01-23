import { isEqual } from 'lodash-es'
import { useRef } from 'react'

/**
 * This hook is similar to useMemo, but it does a deep comparison of the dependencies (using `isEqual` from Lodash).
 */
export const useDeepMemo = (factory: () => any, dependencies: any[]) => {
  const ref = useRef<any>()

  if (!ref.current || !isEqual(dependencies, ref.current.deps)) {
    ref.current = { deps: dependencies, result: factory() }
  }

  return ref.current.result
}
