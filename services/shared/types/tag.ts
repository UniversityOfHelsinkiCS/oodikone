export type Tag = {
  id: string
  name: string
  personalUserId: string | null
  studyTrack: string
  year: string | null
}

export type NewTag = Omit<Tag, 'id'>
