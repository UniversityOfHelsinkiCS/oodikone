import { Op } from 'sequelize'

export enum Unification {
  REGULAR = 'regular',
  OPEN = 'open',
  UNIFY = 'unify',
}

export const getIsOpen = (unification: Unification) => {
  const options = {
    open: { [Op.eq]: true },
    regular: { [Op.eq]: false },
    unify: { [Op.in]: [false, true] },
  }
  return options[unification]
}
