import { Name } from '@oodikone/shared/types'

export type Programme = {
  active: boolean
  code: string
  facultyCode: string
  graduated: boolean
  cancelled: boolean
  name: Name
}

export const joinProgrammes = (
  programmes: Programme[] | undefined,
  getTextIn: (_: Name) => any,
  delimiter: string,
  includeMeta = true
) => {
  if (!programmes) return null
  return programmes
    .map(programme => {
      const name = getTextIn(programme.name)
      if (includeMeta) {
        if (programme.graduated) return `${name} (graduated)`
        if (!programme.active) return `${name} (inactive)`
      }
      return name
    })
    .join(delimiter)
}
