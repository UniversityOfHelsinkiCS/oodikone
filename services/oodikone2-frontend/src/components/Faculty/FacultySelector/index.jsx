import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { string, func, arrayOf, shape } from 'prop-types'
import { getFaculties } from '../../../redux/faculties'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

const FacultySelector = ({ language, dispatchGetFaculties, faculties }) => {
  const [ selectedFaculties, setSelectedFaculties ] = useState([])

  const handleSelect = code => setSelectedFaculties(
    selectedFaculties.includes(code) ?
      selectedFaculties.filter(c => c !== code) :
      selectedFaculties.concat(code)
  )

  const fetchFaculties = async () => {
    dispatchGetFaculties()
  }

  useEffect(() => {
    fetchFaculties()
  }, [])

  if (!faculties) return null
  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: faculty => getTextIn(faculty.name, language)
    },
    {
      key: 'code',
      title: 'code',
      getRowVal: faculty => faculty.code
    }
  ]

  const selectedHeaders = [
    ...headers,
    {
      key: 'students',
      title: 'Students',
      getRowVal: () => 1
    },
    {
      key: 'teachers',
      title: 'Teachers',
      getRowVal: () => 1
    }
  ]

  const selectedLength = selectedFaculties.length

  return (
    <div>
      { selectedLength !== faculties.length &&
        <SortableTable
          columns={headers}
          getRowKey={faculty => faculty.code}
          getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
          data={faculties.filter(({ code }) => !selectedFaculties.includes(code))}
        />
      }
      { selectedLength !== 0 &&
        <SortableTable
          columns={selectedHeaders}
          getRowKey={faculty => faculty.code}
          getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
          data={faculties.filter(({ code }) => selectedFaculties.includes(code))}
        />
      }
    </div>
  )
}

FacultySelector.propTypes = {
  language: string.isRequired,
  dispatchGetFaculties: func.isRequired,
  faculties: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ faculties, settings }) => ({
  faculties: faculties.data,
  language: settings.language
})

export default connect(mapStateToProps, { dispatchGetFaculties: getFaculties })(withRouter(FacultySelector))
