import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { debounce } from 'lodash'
import { connect } from 'react-redux'
import { Message, Header, Form } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

const FacultySelector = ({ faculties, selected, language }) => {
  const [filter, setFilter] = useState('')
  const [filteredFaculties, setFilteredFaculties] = useState([])

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
      title: 'code',
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
      title: 'name',
      getRowVal: faculty => getTextIn(faculty.name, language),
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
          {getTextIn(faculty.name, language)}
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
    <>
      <Form>
        Filter faculties:
        <Form.Input onChange={e => handleFilterChange(e.target.value)} width="4" />
      </Form>
      {filteredFaculties.length > 0 ? (
        <>
          <Header>Faculties</Header>
          <SortableTable
            figure={false}
            columns={headers}
            getRowKey={faculty => faculty.code}
            data={filteredFaculties}
          />
        </>
      ) : null}
    </>
  )
}

const mapStateToProps = ({ settings }) => {
  const { language } = settings

  return {
    language,
  }
}

export default connect(mapStateToProps, null)(FacultySelector)
