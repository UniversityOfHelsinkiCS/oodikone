const { Studyright, StudyrightElement } = require('../../db/models')
const { selectFromByIds } = require('../../db')

const studentsThatNeedToBeFixed = [
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

const graduationsThatNeedToBeFixed = [
  { id: 'hy-hlo-121306201', date: '2021-09-09' },
  { id: 'hy-hlo-125516474', date: '2021-09-03' },
  { id: 'hy-hlo-120791479', date: '2021-09-10' },
  { id: 'hy-hlo-125585515', date: '2021-09-02' },
]

const fixVarhaiskasvatusGraduations = async studentsToBeFixed => {
  const students = await selectFromByIds('persons', studentsToBeFixed)

  for (const student of students) {
    const bsc = await Studyright.findOne({
      where: {
        student_studentnumber: student.student_number,
      },
      include: {
        model: StudyrightElement,
        where: {
          code: 'KH60_001',
        },
      },
    })

    bsc.enddate = new Date(graduationsThatNeedToBeFixed.find(s => s.id === student.id).date)
    bsc.graduated = 1
    await bsc.save()
  }
}

const fixVarhaiskasvatusStudyRights = async studentsToBeFixed => {
  const students = await selectFromByIds('persons', studentsToBeFixed)
  for (const student of students) {
    const bsc = await StudyrightElement.findOne({
      where: {
        studentnumber: student.student_number,
        code: 'KH60_001',
      },
      include: {
        model: Studyright,
        attributes: ['graduated'],
      },
    })

    bsc.startdate = new Date(studentsThatNeedToBeFixed.find(s => s.id === student.id).started)
    await bsc.save()

    const msc = await StudyrightElement.findOne({
      where: {
        studentnumber: student.student_number,
        code: 'MH60_001',
      },
    })

    if (bsc.studyright.graduated) {
      const bscEnd = new Date(bsc.enddate)
      bscEnd.setDate(bscEnd.getDate() + 1)
      msc.startdate = bscEnd
      await msc.save()
    }
  }
}

module.exports = {
  fixVarhaiskasvatusStudyRights,
  fixVarhaiskasvatusGraduations,
  studentsThatNeedToBeFixed,
  graduationsThatNeedToBeFixed,
}
