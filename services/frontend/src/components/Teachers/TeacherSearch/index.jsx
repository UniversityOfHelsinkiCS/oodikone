import React, { useState, useMemo, useEffect } from 'react'
import { Search, Segment, Icon } from 'semantic-ui-react'

import './teacherSearch.css'
import { useFindTeachersQuery } from 'redux/teachers'
import { validateInputLength, splitByEmptySpace } from 'common'
import { useDebounce } from 'common/hooks'
import SortableTable from '../../SortableTable'

export const TeacherSearch = ({ onClick }) => {
  const [searchterm, setSearchterm] = useState('')
  const [teachers, setTeachers] = useState([])
  const [debouncedSearchTerm, setDebouncedSearchTerm, , dirty] = useDebounce(searchterm, 500, () => null)
  const { data, isLoading, isFetching } = useFindTeachersQuery(
    { searchString: splitByEmptySpace(debouncedSearchTerm.trim()).find(t => validateInputLength(t, 4)) },
    { skip: !splitByEmptySpace(debouncedSearchTerm.trim()).find(t => validateInputLength(t, 4)) || dirty }
  )

  useEffect(() => setTeachers(data || []), [data])

  const handleSearchChange = e => {
    setSearchterm(e.target.value)
    setDebouncedSearchTerm(e.target.value)
    if (e.target.value.length === 0) setTeachers([])
  }

  const columns = useMemo(
    () => [
      {
        key: 'name-parent',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'name',
            title: 'Name',
            getRowVal: s => s.name,
            cellProps: row => ({
              onClick: () => onClick(row),
            }),
          },
          {
            key: 'icon',
            getRowContent: () => <Icon name="level up alternate" />,
            export: false,
            cellProps: row => ({
              onClick: () => onClick(row),
            }),
          },
        ],
      },
    ],
    [onClick]
  )

  const getContent = () => {
    if (dirty || isLoading || isFetching) return <Icon loading size="huge" name="spinner" />

    if (teachers.length === 0) return <div>No teachers matched your search</div>

    return <SortableTable defaultSort={['name', 'desc']} hideHeaderBar columns={columns} data={teachers} />
  }

  return (
    <div className="searchContainer">
      <Search
        className="searchInput"
        input={{ fluid: true }}
        placeholder="Search by entering a name or an id"
        value={searchterm}
        onSearchChange={handleSearchChange}
        showNoResults={false}
      />
      <Segment className="contentSegment">{getContent()}</Segment>
    </div>
  )
}
