import { Op } from 'sequelize'

import { CreditTypeCode } from '@oodikone/shared/types'
import { CourseModel, CourseProviderModel, CreditModel, OrganizationModel } from '../../models'
import { formatCredit } from './format'

export const getCreditsForProvider = async (provider: string, codes: string[], since: Date) => {
  const credits = await CreditModel.findAll({
    where: {
      course_code: { [Op.in]: codes },
      attainment_date: { [Op.gte]: since },
      isStudyModule: { [Op.not]: true },
      credittypecode: CreditTypeCode.PASSED,
    },
    raw: true,
  })

  const courseIds = credits.map(cr => cr.course_id)

  const providers = await CourseProviderModel.findAll({
    where: {
      coursecode: { [Op.in]: courseIds },
    },
    raw: true,
  })
  const organizationIds = providers.map(p => p.organizationcode)
  const organizations = await OrganizationModel.findAll({
    where: {
      id: {
        [Op.in]: organizationIds,
      },
    },
    raw: true,
  })

  const organizationIdToCodeMap = organizations.reduce<Record<string, string>>((obj, org) => {
    obj[org.id] = org.code
    return obj
  }, {})

  const courseIdToShareMap = providers.reduce<Record<string, CourseProviderModel[]>>((obj, provider) => {
    if (!obj[provider.coursecode]) obj[provider.coursecode] = []
    obj[provider.coursecode].push(provider)
    return obj
  }, {})

  const courseIdToShare = (courseId: string, attainmentDate: Date) => {
    const providers = courseIdToShareMap[courseId]
    const relevantProvider = providers?.find(p => organizationIdToCodeMap[p.organizationcode] === provider)
    if (!relevantProvider?.shares) return 0
    const relevantShare = relevantProvider.shares
      .filter(share => {
        const startMatches = share.startDate == null || new Date(share.startDate) <= attainmentDate
        const endMatches = share.endDate == null || new Date(share.endDate) >= attainmentDate
        const bothArentNull = share.startDate != null || share.endDate != null
        return startMatches && endMatches && bothArentNull
      })
      // The next mess is for cases where there are multiple shares with only startdate or enddate.
      // This isn't pretty and it may not be 100% correct but because the
      // data is all over the place, this is best approximation for now.
      .sort((a, b) => {
        if (!b.startDate || !a.startDate) return 0
        const bTime = b.startDate ? new Date(b.startDate).getTime() : 0
        const aTime = a.startDate ? new Date(a.startDate).getTime() : 0
        return bTime - aTime
      })
      .sort((a, b) => {
        if (!b.endDate || !a.endDate) return 0
        const bTime = b.endDate ? new Date(b.endDate).getTime() : 0
        const aTime = a.endDate ? new Date(a.endDate).getTime() : 0
        return bTime - aTime
      })[0]

    // Odd logic, but if there are multiple providers for same course code, if no fitting dates are
    // not found for our relevant provider, we can assume the share of that date is of some other provider.
    // But if only 1 provider exists, we can assume it has share of 1.
    if (!relevantShare) {
      if (providers.length > 1) return 0
      return 1
    }
    return relevantShare.share
  }

  return credits
    .map(cr => ({ ...cr, credits: cr.credits * courseIdToShare(cr.course_id, cr.attainment_date) }))
    .map(formatCredit)
}

export const getTransferredCredits = async (provider: string, since: Date) =>
  await CreditModel.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'createdate'],
    include: {
      model: CourseModel,
      attributes: ['code'],
      required: true,
      include: [
        {
          model: OrganizationModel,
          required: true,
          where: {
            code: provider,
          },
        },
      ],
    },
    where: {
      credittypecode: CreditTypeCode.APPROVED,
      isStudyModule: {
        [Op.not]: true,
      },
      createdate: {
        [Op.gte]: since,
      },
    },
  })

export const getStudyRightThesisCredits = async (thesisType: string[], studyRightIds: string[]) =>
  await CreditModel.findAll({
    attributes: ['attainment_date', 'student_studentnumber'],
    include: {
      model: CourseModel,
      attributes: [],
      where: {
        course_unit_type: {
          [Op.in]: thesisType,
        },
      },
    },
    where: {
      credittypecode: CreditTypeCode.PASSED,
      isStudyModule: {
        [Op.not]: true,
      },
      studyright_id: {
        [Op.in]: studyRightIds,
      },
    },
  })

export const getOrganizationThesisCredits = async (provider: string, thesisType: string[], studentnumbers: string[]) =>
  await CreditModel.findAll({
    attributes: ['attainment_date', 'student_studentnumber'],
    include: {
      model: CourseModel,
      attributes: [],
      where: {
        course_unit_type: {
          [Op.in]: thesisType,
        },
      },
      include: [
        {
          model: OrganizationModel,
          attributes: [],
          through: {
            attributes: [],
          },
          where: {
            code: provider,
          },
        },
      ],
    },
    where: {
      credittypecode: CreditTypeCode.PASSED,
      isStudyModule: {
        [Op.not]: true,
      },
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })
