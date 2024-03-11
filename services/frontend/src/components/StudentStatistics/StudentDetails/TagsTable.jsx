import { sortBy } from 'lodash'
import { shape } from 'prop-types'
import React from 'react'
import { Header, Label } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'

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
                <Label color={t.tag.personal_user_id ? 'purple' : null} content={t.tag.tagname} key={t.tag.tag_id} />
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
