import { Op } from 'sequelize'

import { Name } from '@oodikone/shared/types'
import { Unification } from '../../types'

export type FormattedProgramme = {
  code: string
  name: Name
  startDate?: Date
  facultyCode: string | null
  organization: OrganizationDetails | null
}

export const getIsOpen = (unification: Unification) => {
  const options = {
    open: { [Op.eq]: true },
    regular: { [Op.eq]: false },
    unify: { [Op.in]: [false, true] },
  }
  return options[unification]
}

export type OrganizationDetails = {
  code?: string
  name: Name
}
