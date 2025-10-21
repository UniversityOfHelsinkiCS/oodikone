import { ReactNode } from 'react'

export const flexRender = <TProps extends object>(
  Comp: ((props: TProps) => ReactNode) | string | undefined,
  props: TProps
): ReactNode => {
  if (typeof Comp === 'string') return Comp
  return Comp ? Comp(props) : null
}
