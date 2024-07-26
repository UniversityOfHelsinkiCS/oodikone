import { Op } from 'sequelize'

import { Tag, TagStudent } from '../models/kone'

export const findTagsByStudyTrack = async (studyTrack: string) => {
  return Tag.findAll({
    where: {
      studytrack: {
        [Op.eq]: studyTrack,
      },
    },
  })
}

export const findTagsFromStudyTrackById = async (studyTrack: string, tagIds: string[]) => {
  return Tag.findAll({
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

export type TagFromFrontend = {
  studytrack: string
  tagname: string
  year: string
  personal_user_id: string | null
}

export const createNewTag = async (tag: TagFromFrontend) => {
  if (Number.isNaN(tag.year)) {
    const newTag = {
      ...tag,
      year: null,
    }
    return Tag.create(newTag)
  }
  return Tag.create(tag)
}

export const deleteTag = async (tagId: string) => {
  return Tag.destroy({
    where: {
      tag_id: {
        [Op.eq]: tagId,
      },
    },
  })
}

export const getStudentTagsByStudyTrack = (studyTrack: string) => {
  return TagStudent.findAll({
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname', 'personal_user_id'],
      where: {
        studytrack: {
          [Op.eq]: studyTrack,
        },
      },
    },
  })
}

export type StudentTagFromFrontend = {
  tag_id: string
  studentnumber: string
}

export const createMultipleStudentTags = async (tags: StudentTagFromFrontend[]) => {
  return TagStudent.bulkCreate(tags, { ignoreDuplicates: true })
}

export const deleteMultipleStudentTags = async (tagId: string, studentNumbers: string[]) => {
  return TagStudent.destroy({
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
