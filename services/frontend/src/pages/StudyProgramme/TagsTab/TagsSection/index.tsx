import List from '@mui/material/List'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Section } from '@/components/Section'
import { Tag } from '@oodikone/shared/types'
import { TagItem } from './TagItem'

export const TagsSection = ({
  combinedProgramme,
  studyProgramme,
  studyTrack,
  tags,
}: {
  combinedProgramme: string
  studyProgramme: string
  studyTrack: string
  tags: Tag[]
}) => {
  return (
    <Section title="Tags">
      {tags.length === 0 ? (
        <Typography color="text.secondary">This degree programme does not have any tags yet</Typography>
      ) : (
        <Stack gap={1}>
          <Typography>Tags associated with this degree programme</Typography>
          <List>
            {tags.map(tag => (
              <TagItem
                combinedProgramme={combinedProgramme}
                key={tag.id}
                studyProgramme={studyProgramme}
                studyTrack={studyTrack}
                tag={tag}
              />
            ))}
          </List>
        </Stack>
      )}
    </Section>
  )
}
