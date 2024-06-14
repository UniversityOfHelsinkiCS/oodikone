import { debounce } from 'lodash'
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Message, Icon, Search, Segment, Item } from 'semantic-ui-react'

import { splitByEmptySpace, validateInputLength } from '@/common'
import { SortableTable } from '@/components/SortableTable'
import { useFindTeachersQuery } from '@/redux/teachers'
import './teacherSearch.css'

export const TeacherSearchTab = () => {
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState('')
  const {
    data: teachers = [],
    isLoading,
    isUninitialized,
  } = useFindTeachersQuery(
    { searchString: splitByEmptySpace(query.trim()).find(t => validateInputLength(t, 4)) },
    { skip: !splitByEmptySpace(query.trim()).find(t => validateInputLength(t, 4)) }
  )

  const debouncedSetQuery = useCallback(
    debounce(value => {
      setQuery(value)
    }, 500),
    []
  )

  const handleSearchChange = event => {
    debouncedSetQuery(event.target.value)
    setSearchString(event.target.value)
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: s => s.name,
      getRowContent: row => (
        <Item as={Link} target="_blank" to={`/teachers/${row.id}`}>
          {row.name}
        </Item>
      ),
    },
  ]

  const getContent = () => {
    if (isUninitialized) return null

    if (isLoading || query !== searchString) return <Icon loading name="spinner" size="huge" />

    if (teachers.length === 0) return <div>No teachers matched your search</div>

    return <SortableTable columns={columns} data={teachers} defaultSort={['name', 'asc']} hideHeaderBar />
  }

  return (
    <>
      <Message
        content="Search for a teacher and click the search result to view their individual statistics from their entire career. "
        header="Teacher search"
      />
      <div className="searchContainer">
        <Search
          className="searchInput"
          input={{ fluid: true }}
          onSearchChange={handleSearchChange}
          placeholder="Search by entering a name or an id"
          showNoResults={false}
          value={searchString}
        />
        <Segment className="contentSegment">{getContent()}</Segment>
      </div>
    </>
  )
}
