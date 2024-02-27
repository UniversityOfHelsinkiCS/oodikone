import { sortBy } from 'lodash'
import { shape } from 'prop-types'
import React from 'react'
import { Label, Header } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '../../SortableTable'

export const TagsTable = ({ student }) => {
  const { getTextIn } = useLanguage()
  if (!student) return null

  const data = Object.values(
    student.tags.reduce((acc, t) => {
      if (!acc[t.programme.code]) acc[t.programme.code] = { programme: t.programme, tags: [] }
      acc[t.tag.studytrack].tags.push(t)
      return acc
    }, {})
  )
  if (data.length === 0) return null
  return (
    <>
      <Header content="Tags" />
      <SortableTable
        data={data}
        columns={[
          {
            key: 'PROGRAMME',
            title: 'Programme',
            getRowVal: t => getTextIn(t.programme.name),
          },
          {
            key: 'CODE',
            title: 'Code',
            getRowVal: t => t.programme.code,
          },
          {
            key: 'TAGS',
            title: 'Tags',
            getRowVal: t => sortBy(t.tags.map(tt => tt.tag.tagname)).join(':'),
            getRowContent: t =>
              sortBy(t.tags, t => t.tag.tagname).map(t => (
                <Label key={t.tag.tag_id} content={t.tag.tagname} color={t.tag.personal_user_id ? 'purple' : null} />
              )),
          },
        ]}
      />
    </>
  )
}

TagsTable.propTypes = {
  student: shape({}).isRequired,
}
