import { SISStudyRightElementModel } from '../models'
import logger from './logger'

export const logInfoForGrafana = async (code: string, combinedProgramme: string) => {
  const programme = await SISStudyRightElementModel.findOne({ where: { code } })
  if (!programme) {
    logger.error('Study programme not found', { studyprogrammeCode: code })
    return
  }
  const programmeCode = combinedProgramme ? `${programme.code}-${combinedProgramme}` : programme.code
  logger.info('Study Programme', {
    studyprogrammeName: combinedProgramme ? `${programme.name.fi} + maisteri` : programme.name.fi,
    studyprogrammeCode: programmeCode,
  })
}
