import { Op } from 'sequelize'

import { Tag as TagModel, TagStudent as TagStudentModel } from '../models/kone'
import { NewTag, StudentTag, Tag } from '../shared/types'

export const findTagsByStudyTrack = async (studyTrack: string) => {
  const tags = await TagModel.findAll({
    where: {
      studytrack: {
        [Op.eq]: studyTrack,
      },
    },
  })
  return tags.map(
    tag =>
      ({
        id: tag.tag_id,
        name: tag.tagname,
        studyTrack: tag.studytrack,
        personalUserId: tag.personal_user_id,
        year: tag.year,
      }) as Tag
  )
}

export const findTagsFromStudyTrackById = async (studyTrack: string, tagIds: string[]) => {
  return TagModel.findAll({
    where: {
      studytrack: {
        [Op.eq]: studyTrack,
      },
      tag_id: {
        [Op.in]: tagIds,
      },
    },
  })
}

export const createNewTag = async (tag: NewTag) => {
  return TagModel.create({
    studytrack: tag.studyTrack,
    tagname: tag.name,
    personal_user_id: tag.personalUserId,
    year: Number.isNaN(tag.year) ? null : tag.year,
  })
}

export const deleteTag = async (tagId: string) => {
  return TagModel.destroy({
    where: {
      tag_id: {
        [Op.eq]: tagId,
      },
    },
  })
}

export const getStudentTagsByStudyTrack = async (studyTrack: string) => {
  const studentTags = await TagStudentModel.findAll({
    include: {
      model: TagModel,
      attributes: ['personal_user_id'],
      where: {
        studytrack: {
          [Op.eq]: studyTrack,
        },
      },
    },
  })
  return studentTags.map(studentTag => studentTag.toJSON())
}

export const createMultipleStudentTags = async (studentTags: StudentTag[]) => {
  return TagStudentModel.bulkCreate(
    studentTags.map(studentTag => ({
      tag_id: studentTag.tagId,
      studentnumber: studentTag.studentNumber,
    })),
    { ignoreDuplicates: true }
  )
}

export const deleteMultipleStudentTags = async (tagId: string, studentNumbers: string[]) => {
  return TagStudentModel.destroy({
    where: {
      tag_id: {
        [Op.eq]: tagId,
      },
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })
}
