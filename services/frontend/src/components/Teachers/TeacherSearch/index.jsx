import React, { useState, useMemo, useEffect } from 'react'
import { Search, Segment, Icon } from 'semantic-ui-react'

import { validateInputLength, splitByEmptySpace } from '@/common'
import { useDebounce } from '@/common/hooks'
import { SortableTable } from '@/components/SortableTable'
import { useFindTeachersQuery } from '@/redux/teachers'
import './teacherSearch.css'

export const TeacherSearch = ({ onClick }) => {
  const [searchterm, setSearchterm] = useState('')
  const [teachers, setTeachers] = useState([])
  const [debouncedSearchTerm, setDebouncedSearchTerm, , dirty] = useDebounce(searchterm, 500, () => null)
  const { data, isLoading, isFetching } = useFindTeachersQuery(
    { searchString: splitByEmptySpace(debouncedSearchTerm.trim()).find(t => validateInputLength(t, 4)) },
    { skip: !splitByEmptySpace(debouncedSearchTerm.trim()).find(t => validateInputLength(t, 4)) || dirty }
  )

  useEffect(() => setTeachers(data || []), [data])

  const handleSearchChange = event => {
    setSearchterm(event.target.value)
    setDebouncedSearchTerm(event.target.value)
    if (event.target.value.length === 0) setTeachers([])
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
    if (dirty || isLoading || isFetching) return <Icon loading name="spinner" size="huge" />

    if (teachers.length === 0) return <div>No teachers matched your search</div>

    return <SortableTable columns={columns} data={teachers} defaultSort={['name', 'desc']} hideHeaderBar />
  }

  return (
    <div className="searchContainer">
      <Search
        className="searchInput"
        input={{ fluid: true }}
        onSearchChange={handleSearchChange}
        placeholder="Search by entering a name or an id"
        showNoResults={false}
        value={searchterm}
      />
      <Segment className="contentSegment">{getContent()}</Segment>
    </div>
  )
}
