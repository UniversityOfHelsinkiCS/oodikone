const { Op } = require('sequelize')
const { ElementDetail, Student, Studyplan, Studyright, StudyrightElement } = require('../../models')

const formatStudent = student => {
  const { studyright_elements: studyrightElements, startdate: startOfStudyright } = student.studyplans[0].studyright
  const programmeCode = student.studyplans[0].programme_code
  const programme = studyrightElements?.find(programme => programme.code === programmeCode)?.element_detail

  return {
    student: {
      studentNumber: student.studentnumber,
      name: student.abbreviatedname,
      sis_person_id: student.sis_person_id,
    },
    startOfStudyright,
    programme: {
      code: programme?.code,
      name: programme?.name,
    },
    credits: {
      hops: student.studyplans[0].completed_credits,
      all: student.creditcount,
    },
  }
}

const getStudentsCloseToGraduation = async () =>
  (
    await Student.findAll({
      attributes: ['abbreviatedname', 'creditcount', 'sis_person_id', 'studentnumber'],
      include: [
        {
          model: Studyplan,
          attributes: ['completed_credits', 'programme_code'],
          where: {
            completed_credits: {
              [Op.gte]: 160,
            },
            programme_code: {
              [Op.like]: 'KH%',
            },
          },
          include: [
            {
              model: Studyright,
              attributes: ['startdate', 'studyrightid'],
              where: {
                graduated: 0,
                cancelled: false,
              },
              include: [
                {
                  model: StudyrightElement,
                  attributes: ['code'],
                  include: [
                    {
                      model: ElementDetail,
                      attributes: ['code', 'name'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  ).map(student => formatStudent(student.toJSON()))

module.exports = {
  getStudentsCloseToGraduation,
}
