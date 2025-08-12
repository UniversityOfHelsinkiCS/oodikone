import { Op } from 'sequelize'

import { Name, Unification } from '@oodikone/shared/types'

export type FormattedProgramme = {
  code: string
  name: Name
  startDate?: Date
  facultyCode: string | null
  organization: OrganizationDetails | null
}

export const getIsOpen = (unification: Unification) => {
  const options: Record<Unification, object> = {
    open: { [Op.eq]: true },
    regular: { [Op.eq]: false },
    unify: { [Op.ne]: null },
  }
  return options[unification]
}

export type OrganizationDetails = {
  code?: string
  name: Name
}
