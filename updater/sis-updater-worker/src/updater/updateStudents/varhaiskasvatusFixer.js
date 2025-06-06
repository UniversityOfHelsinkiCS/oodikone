import { Op } from 'sequelize'

import { selectFromByIds } from '../../db/index.js'
import { SISStudyRight, SISStudyRightElement } from '../../db/models/index.js'

export const studentsThatNeedToBeFixed = [
  { id: 'hy-hlo-109316006', started: '2019-04-30' },
  { id: 'hy-hlo-111165291', started: '2017-10-18' },
  { id: 'hy-hlo-114813057', started: '2019-02-22' },
  { id: 'hy-hlo-105286342', started: '2018-04-07' },
  { id: 'hy-hlo-114827384', started: '2017-10-12' },
  { id: 'hy-hlo-114892724', started: '2018-03-24' },
  { id: 'hy-hlo-114990124', started: '2018-08-10' },
  { id: 'hy-hlo-114975254', started: '2019-10-24' },
  { id: 'hy-hlo-114916717', started: '2019-05-29' },
  { id: 'hy-hlo-114941473', started: '2019-01-22' },
  { id: 'hy-hlo-114869408', started: '2017-12-13' },
  { id: 'hy-hlo-115051039', started: '2019-12-18' },
  { id: 'hy-hlo-57634714', started: '2018-05-02' },
  { id: 'hy-hlo-114941473', started: '2019-01-22' },
  { id: 'hy-hlo-97547785', started: '2019-12-18' },
  // new entries
  { id: 'hy-hlo-62121710', started: '2020-12-19' },
]

export const fixVarhaiskasvatusStudyRights = async studentsToBeFixed => {
  const students = await selectFromByIds('persons', studentsToBeFixed)
  for (const student of students) {
    const studentInfo = studentsThatNeedToBeFixed.find(s => s.id === student.id)

    const studyRight = await SISStudyRight.findOne({
      where: {
        studentNumber: student.student_number,
      },
      include: {
        model: SISStudyRightElement,
        where: {
          code: {
            [Op.in]: ['KH60_001', 'MH60_001'],
          },
        },
      },
    })

    if (studyRight) {
      const bachelorElement = studyRight.SISStudyRightElements.find(element => element.code === 'KH60_001')
      if (bachelorElement) {
        bachelorElement.startDate = new Date(studentInfo.started)
        await bachelorElement.save()
        if (bachelorElement.graduated) {
          const masterElement = studyRight.SISStudyRightElements.find(element => element.code === 'MH60_001')
          if (masterElement) {
            const bscEndDate = new Date(bachelorElement.endDate)
            bscEndDate.setDate(bscEndDate.getDate() + 1)
            masterElement.startDate = bscEndDate
            await masterElement.save()
          }
        }
      }
    }
  }
}
