import { sortBy } from 'lodash'
import { shape } from 'prop-types'
import { Header, Label } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'

export const TagsTable = ({ student }) => {
  const { getTextIn } = useLanguage()
  if (!student) return null

  const data = Object.values(
    student.tags.reduce((acc, tag) => {
      if (!acc[tag.programme.code]) acc[tag.programme.code] = { programme: tag.programme, tags: [] }
      acc[tag.tag.studytrack].tags.push(tag)
      return acc
    }, {})
  )
  if (data.length === 0) return null
  return (
    <>
      <Header content="Tags" />
      <SortableTable
        columns={[
          {
            key: 'PROGRAMME',
            title: 'Programme',
            getRowVal: tag => getTextIn(tag.programme.name),
          },
          {
            key: 'CODE',
            title: 'Code',
            getRowVal: tag => tag.programme.code,
          },
          {
            key: 'TAGS',
            title: 'Tags',
            getRowVal: tag => sortBy(tag.tags.map(tt => tt.tag.tagname)).join(':'),
            getRowContent: tag =>
              sortBy(tag.tags, tag => tag.tag.tagname).map(tag => (
                <Label
                  color={tag.tag.personal_user_id ? 'purple' : null}
                  content={tag.tag.tagname}
                  key={tag.tag.tag_id}
                />
              )),
          },
        ]}
        data={data}
      />
    </>
  )
}

TagsTable.propTypes = {
  student: shape({}).isRequired,
}
