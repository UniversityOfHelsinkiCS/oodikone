import React, { useEffect } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { func, arrayOf, shape } from 'prop-types'
import { getFaculties } from '../../../redux/faculties'
// import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

const FacultySelector = ({ handleSelect, dispatchGetFaculties, faculties }) => {
  const fetchFaculties = async () => {
    await dispatchGetFaculties()
  }
  useEffect(() => {
    fetchFaculties()
  }, [])

  if (!faculties) return null
  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: faculty => faculty.name.fi // getTextIn(faculty.name, language) temp fix maybe
    },
    {
      key: 'code',
      title: 'code',
      getRowVal: faculty => faculty.code
    }
  ]

  return (
    <SortableTable
      columns={headers}
      getRowKey={faculty => faculty.code}
      getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
      data={faculties}
    />
  )
}
FacultySelector.propTypes = {
  // language: string.isRequired,
  handleSelect: func.isRequired,
  dispatchGetFaculties: func.isRequired,
  faculties: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ faculties }) => ({
  faculties: faculties.data
  // language: settings.language
})

export default connect(mapStateToProps, { dispatchGetFaculties: getFaculties })(withRouter(FacultySelector))
