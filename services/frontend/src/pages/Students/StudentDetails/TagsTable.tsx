import { Chip, TableCell, TableHead, TableBody, TableRow, Stack } from '@mui/material'
import { sortBy } from 'lodash'
import { Link } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { StyledTable } from '@/components/material/StyledTable'
import { Name } from '@/shared/types'

type Tag = {
  programme: {
    code: string
    name: Name
  }
  tags: Array<{
    id: string
    tagName: string
    userId: string | null
  }>
}

export const TagsTable = ({ student }: { student: any }) => {
  const { getTextIn } = useLanguage()
  if (!student) return null

  const tagData: Tag[] = []

  for (const tag of student.tags) {
    const tagsForProgramme = tagData.find(({ programme }) => programme.code === tag.programme.code)
    const parsedTag = { userId: tag.tag.personal_user_id, tagName: tag.tag.tagname, id: tag.tag_id }

    if (tagsForProgramme) {
      tagsForProgramme.tags.push(parsedTag)
    } else {
      tagData.push({ programme: tag.programme, tags: [parsedTag] })
    }
  }

  if (tagData.length === 0) {
    return null
  }

  return (
    <Section
      infoBoxContent="Personal tags have a purple background, while shared tags have a gray background. You can view or create tags by clicking the programme name."
      title="Tags"
    >
      <StyledTable showCellBorders>
        <TableHead>
          <TableRow>
            <TableCell>Programme</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Tags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tagData.map(({ programme, tags }) => (
            <TableRow key={programme.code}>
              <TableCell>
                <Link target="_blank" to={`/study-programme/${programme.code}?tab=4`}>
                  {getTextIn(programme.name)}
                </Link>
              </TableCell>
              <TableCell>{programme.code}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {sortBy(tags, 'tagName').map(tag => (
                    <Chip color={tag.userId ? 'secondary' : 'default'} key={tag.id} label={tag.tagName} />
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </Section>
  )
}
