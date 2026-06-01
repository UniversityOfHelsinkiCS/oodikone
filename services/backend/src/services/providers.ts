import { getOpenUniCourseCode } from '../../src/util'
import { CourseModel, OrganizationModel } from '../models'

export const getAllProviders = async () => {
  const providers = OrganizationModel.findAll({
    raw: true,
    attributes: ['code', 'name'],
  })
  return providers
}

export const getCourseCodesOfProvider = async (provider: string) => {
  const coursesByProvider = await CourseModel.findAll({
    raw: true,
    attributes: ['id', 'code', 'substitution_groups'],
    include: {
      model: OrganizationModel,
      required: true,
      where: {
        code: provider,
      },
      through: {
        attributes: [],
      },
    },
  })

  const coursesWithOpenUniSubstitutions = coursesByProvider.map(({ code, substitution_groups }) => {
    if (!substitution_groups?.length) {
      return [code]
    }
    // This is ok to flatten, because we only want all credits completed by students, not what courses are
    // completed and how => we don't care about substitutions
    return [code].concat(substitution_groups.filter(group => group.some(code => getOpenUniCourseCode(code))).flat())
  })

  return coursesWithOpenUniSubstitutions.flat()
}
