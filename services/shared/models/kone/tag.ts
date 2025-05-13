import type { Optional } from '../../types'

import type { TagStudent } from './tagStudent'

export type TagCreation = Optional<Tag, 'tag_id' | 'tagStudent'>
export type Tag = {
  tag_id: string
  tagStudent: TagStudent
  tagname: string
  studytrack: string
  year: string | null
  personal_user_id: string | null
}
