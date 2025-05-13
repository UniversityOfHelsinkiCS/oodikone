import type { Optional } from '../../types'

import type { Tag } from './tag'

export type TagStudentCreation = Optional<TagStudent, 'tag'>
export type TagStudent = {
  tag_id: string
  studentnumber: string
  tag: Tag
}
