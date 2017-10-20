const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, CourseInstance, Course, TagStudent, Tag, sequelize } = require('../models')
const Op = Sequelize.Op;

const tagsByTerm = (searchTerm) => {
  return Tag.findAll({
    limit: 20,
    where: { 
      tagname:{
        [Op.iLike]: `%${searchTerm}%`
      } 
    }
  })
}

const tagByName = (tagname) => {
  return Tag.findOne({
    where: { 
      tagname: tagname
    },
    include: [TagStudent]
  })
}

const addTagToStudent = (id, tag) => {
  return TagStudent.create({
    taggedstudents_studentnumber: id,
    tags_tagname: tag
  })
}

const createTag = (tagname) => {
  return Tag.create({
    tagname
  })
}

async function bySeachTerm(searchTerm) {
  try {
    const tag = await tagsByTerm(searchTerm) 
    return tag.map(t=>t.tagname)
  } catch (e) {
    return {
      error: e
    }
  } 

}

async function addToStudents(tagname, students) {
  const notTaggedWith = (tag) => (student) => {
    if (tag.tag_students === undefined ) {
      return true 
    }    
    if (tag.tag_students.length == 1 && tag.tag_students[0].tags_tagname === null) {
      return true 
    }

    return !tag.tag_students.map(s=>s.taggedstudents_studentnumber).includes(student)
  }

  try {
    let tag = await tagByName(tagname) 
    if ( tag===null ) {
      tag = await createTag(tagname) 
    }

    const results = await Promise.all(
      students.filter(notTaggedWith(tag)).map(student=>addTagToStudent(student, tagname))
    )

    return results.map(t=>({student: t.taggedstudents_studentnumber, tag: t.tags_tagname }))
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }   
}

module.exports = {
  bySeachTerm, addToStudents
}