import { CourseModel, OrganizationModel } from '../models'

export const getAllProviders = async () => {
  const providers = OrganizationModel.findAll({
    attributes: ['code', 'name'],
  })
  return providers
}

export const getCourseCodesOfProvider = async (provider: string) => {
  const coursesByProvider = await CourseModel.findAll({
    attributes: ['id', 'code', 'substitutions'],
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

  const coursesWithOpenUniSubstitutions = coursesByProvider.map(({ code, substitutions }) => {
    if (!substitutions?.length) {
      return [code]
    }
    const alternatives = [`AY-${code}`, `AY${code}`, `A-${code}`]
    return [code].concat(substitutions.filter(sub => alternatives.includes(sub)))
  })

  return coursesWithOpenUniSubstitutions.flat()
}
