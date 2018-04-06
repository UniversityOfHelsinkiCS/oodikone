const Sequelize = require('sequelize')
const { TagStudent, Tag } = require('../models')
const Op = Sequelize.Op

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
      tagname: {
        [Op.eq]: tagname
      }
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

const bySearchTerm = async (searchTerm) => {
  try {
    const tag = await tagsByTerm(searchTerm) 
    return tag.map(t=>t.tagname)
  } catch (e) {
    return {
      error: e
    }
  } 

}

const addToStudents = async (tagname, students) => {
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
    return {
      error: e
    }
  }   
}

module.exports = {
  bySearchTerm, addToStudents
}