const { Organization, Course } = require('../models')

const getAllProviders = async () =>
  Organization.findAll({
    attributes: ['code', 'name'],
  })

const getCourseCodesOfProvider = async provider => {
  const coursesByProvider = await Course.findAll({
    attributes: ['id', 'code', 'substitutions'],
    include: {
      model: Organization,
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
    if (!substitutions || !substitutions.length) return [code]
    const alternatives = [`AY-${code}`, `AY${code}`, `A-${code}`]
    return [code].concat(substitutions.filter(sub => alternatives.includes(sub)))
  })

  return coursesWithOpenUniSubstitutions.flat()
}

module.exports = {
  getAllProviders,
  getCourseCodesOfProvider,
}
