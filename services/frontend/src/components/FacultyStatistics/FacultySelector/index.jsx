import { debounce } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, FormField, FormInput, Message, Header } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'

export const FacultySelector = ({ faculties, selected }) => {
  const [filter, setFilter] = useState('')
  const [filteredFaculties, setFilteredFaculties] = useState([])
  const { getTextIn, language } = useLanguage()

  const handleFilterChange = debounce(value => {
    setFilter(value)
  }, 500)

  useEffect(() => {
    if (faculties) {
      const filteredFaculties = faculties.filter(faculty => {
        if (faculty.name[language]) {
          return (
            faculty.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
            faculty.name[language].toLowerCase().includes(filter.toLocaleLowerCase())
          )
        }
        return (
          faculty.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
          faculty.name.fi.toLowerCase().includes(filter.toLocaleLowerCase())
        )
      })

      setFilteredFaculties(filteredFaculties)
    }
  }, [filter, faculties])

  if (selected) return null

  const headers = [
    {
      key: 'facultycode',
      title: 'Code',
      getRowVal: faculty => faculty.code,
      getRowContent: faculty => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/faculties/${faculty.code}`}
        >
          {faculty.code}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
    {
      key: 'facultyname',
      title: 'Name',
      getRowVal: faculty => getTextIn(faculty.name),
      getRowContent: faculty => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/faculties/${faculty.code}`}
        >
          {getTextIn(faculty.name)}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
  ]

  if (faculties == null) {
    return <Message>You do not have access to any faculties</Message>
  }

  return (
    <div data-cy="select-faculty">
      <Form style={{ width: '402px' }}>
        <FormField>
          <label style={{ marginBottom: '10px' }}>Filter faculties</label>
          <FormInput
            onChange={event => handleFilterChange(event.target.value)}
            placeholder="Type here to filter faculties"
          />
        </FormField>
        {filteredFaculties.length === 0 && <Message>No faculties found</Message>}
      </Form>
      {filteredFaculties.length > 0 && (
        <>
          <Header>Faculties</Header>
          <SortableTable columns={headers} data={filteredFaculties} hideHeaderBar />
        </>
      )}
    </div>
  )
}
