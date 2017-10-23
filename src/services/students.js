const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, CourseInstance, Course, TagStudent, Tag, sequelize } = require('../models')
const Op = Sequelize.Op

const byId = (id) => {
  return Student.findOne({
    include: [ 
      { 
        model: Credit, 
        include: [ 
          {
            model: CourseInstance, 
            include: [ Course ] 
          } 
        ] 
      },
      TagStudent
    ],
    where: { 
      studentnumber:{
        [Op.eq]: id
      } 
    }
  })
}

const tagsOfStudent = (id) => {
  return TagStudent.findAll({
    where: { 
      taggedstudents_studentnumber:{
        [Op.eq]: id
      } 
    }
  })
}

const byAbreviatedNameOrStudentNumber = (searchTerm) => {
  return Student.findAll({
    limit: 10,
    where: { 
      [Op.or]: [
        {
          studentnumber: {
            [Op.like]: searchTerm
          } 
        }, 
        {
          abbreviatedname: {
            [Op.iLike]: searchTerm
          }
        }
      ] 
      
    }
  })
}

/*
TODO unused?
const withCreditsAfter = (ids, date) => {
  return Student.findAll({
    include: [
      {
        model: Credit, 
        include: [
          {
            model: CourseInstance,
            where: {
              course_code: {
                [Op.gte] :date
              }
            }
          } 
        ]
      }
    ],
    where: { 
      studentnumber: {
        [Op.in]: ids
      } 
    }
  })
}
*/

const formatStudent = ({studentnumber, dateofuniversityenrollment, creditcount, credits, tag_students}) => {
  
  const toCourse = ({grade, credits, courseinstance}) => {
    return {
      course: {
        code: courseinstance.course_code,
        name: courseinstance.course.name
      },
      date: courseinstance.coursedate,
      passed: Credit.passed({grade}),
      grade, 
      credits
    }
  }
  
  const tagnames = (tag_students) => {
    if ( tag_students===undefined || tag_students.length===0 || tag_students[0].tags_tagname===null ) {
      return []
    }    

    return tag_students.map(t=>t.tags_tagname)
  }
  
  const byDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  } 

  if ( credits === undefined) {
    credits = []
  }

  return {
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: credits.sort(byDate).map(toCourse),
    tags: tagnames(tag_students)
  }
}

const addTagToStudent = (id, tag) => {
  return TagStudent.create({
    taggedstudents_studentnumber: id,
    tags_tagname: tag
  })
}

const findTag = (tag) => {
  return Tag.findOne({
    where: { 
      tagname: {
        [Op.eq]: tag
      } 
    }
  })
}

const findTagOf = (id, tag) => {
  return TagStudent.findOne({
    where: { 
      [Op.and]: [ 
        {
          tags_tagname: {
            [Op.eq]: tag
          }
        },
        { 
          taggedstudents_studentnumber:{
            [Op.eq]: id
          } 
        } 
      ]
    }
  })
}

const deleteTagStudent = (id, tagname) => {
  return sequelize.query(
    `DELETE 
      FROM tag_student 
      WHERE taggedstudents_studentnumber = '${id}' 
      AND tags_tagname = '${tagname}'`
  )
}

async function bySeachTerm(term) {
  try{
    const result = await byAbreviatedNameOrStudentNumber(`%${term}%`)
    return result.map(formatStudent)
  } catch (e) {
    return {
      error: e
    }
  } 
}

async function withId(id) {
  try {
    const result = await byId(id)
    // TODO for some reason including tags in query do not work
    // perhaps it is due to lacking primary key field 
    const tags = await tagsOfStudent(id)
    result.tag_students = tags.map(t=>t.dataValues)

    return formatStudent(result)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  } 
}

async function addTag(id, tagname) {
  try {
    const student = await byId(id)
    const tag = await findTag(tagname)

    if (tag === null) {
      return {
        error: `tag '${tagname}' does not exist`
      }
    }

    if (student.tag_students.map(t=>t.tags_tagname).includes(tagname)) {
      return {
        error: `tag '${tagname}' already assosiated with student '${id}'`
      }
    }

    return await addTagToStudent(id, tagname)
  } catch (e) {
    return {
      error: e
    }
  } 
}

async function deleteTag(id, tagname) {
  try {
    const tag = await findTagOf(id, tagname) 
    if (tag === null) {
      return {
        error: `tag '${tagname}' is not assosiated with student '${id}'`
      }
    }

    await deleteTagStudent(id, tagname)
    return {}
  } catch (e) {
    return {
      error: e
    }
  } 

}

module.exports = {
  withId, bySeachTerm, addTag, deleteTag, formatStudent
}