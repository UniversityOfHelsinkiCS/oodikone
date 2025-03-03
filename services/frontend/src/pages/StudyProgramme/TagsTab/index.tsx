import { Stack } from '@mui/material'

import { useGetTagsByStudyTrackQuery } from '@/redux/tags'
import { CreateNewTagSection } from './CreateNewTagSection'
import { TagsSection } from './TagsSection'

export const TagsTab = ({
  combinedProgramme,
  studyProgramme,
}: {
  combinedProgramme: string
  studyProgramme: string
}) => {
  const studyTrack = combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme
  const { data: tags } = useGetTagsByStudyTrackQuery(studyTrack)

  if (!tags) {
    return null
  }

  return (
    <Stack gap={2}>
      <CreateNewTagSection studyTrack={studyTrack} tags={tags} />
      <TagsSection
        combinedProgramme={combinedProgramme}
        studyProgramme={studyProgramme}
        studyTrack={studyTrack}
        tags={tags}
      />
    </Stack>
  )
}
