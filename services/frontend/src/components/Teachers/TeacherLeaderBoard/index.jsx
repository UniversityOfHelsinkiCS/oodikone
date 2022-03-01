import React, { useState, useEffect } from 'react'
import { Segment, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { func, arrayOf, bool, shape, any, string } from 'prop-types'
import moment from 'moment'
import { getTopTeachersCategories } from '../../../redux/teachersTopCategories'
import { getTopTeachers } from '../../../redux/teachersTop'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import LeaderForm from './LeaderForm'

const TeacherLeaderBoard = ({
  getTopTeachersCategories,
  getTopTeachers,
  history,
  statistics,
  updated,
  isLoading,
  yearoptions,
  categoryoptions,
}) => {
  const [selectedyear, setSelectedyear] = useState(null)
  const [selectedcategory, setSelectedcategory] = useState(null)

  useEffect(() => {
    getTopTeachersCategories()
  }, [])

  const updateAndSubmitForm = args => {
    const year = args.selectedyear || selectedyear
    const category = args.selectedcategory || selectedcategory
    getTopTeachers(year, category)
  }

  const initLeaderboard = (year, category) => {
    setSelectedyear(year)
    setSelectedcategory(category)
    updateAndSubmitForm({ selectedyear: year, selectedcategory: category })
  }

  const handleYearChange = (e, { value }) => {
    setSelectedyear(value)
    updateAndSubmitForm({ selectedyear: value })
  }

  const handleCategoryChange = (e, { value }) => {
    setSelectedcategory(value)
    updateAndSubmitForm({ selectedcategory: value })
  }

  const filterYearoptions = yearoptions.filter(year => {
    const options =
      moment(new Date()).diff(new Date(`${new Date().getFullYear()}-8-1`), 'days') > 0
        ? year.text.slice(0, 4) <= new Date().getFullYear()
        : year.text.slice(0, 4) < new Date().getFullYear()
    return options
  })
  return (
    <div>
      {isLoading ? (
        <Segment basic loading={isLoading} />
      ) : (
        <div>
          <Message>
            <Message.Header>Teacher leaderboard</Message.Header>
            Teachers who have produced the most credits from all departments.
          </Message>
          <LeaderForm
            yearoptions={filterYearoptions}
            categoryoptions={categoryoptions}
            handleYearChange={handleYearChange}
            handleCategoryChange={handleCategoryChange}
            initLeaderboard={initLeaderboard}
            selectedcategory={selectedcategory}
            selectedyear={selectedyear}
          />
          <Segment>
            <Message>{`Last updated: ${updated}`}</Message>

            <TeacherStatisticsTable
              statistics={statistics}
              onClickFn={id => history.push(`/teachers/${id}`)}
              unifyOpenUniCourses={false}
              renderLink={false}
            />
          </Segment>
        </div>
      )}
    </div>
  )
}

TeacherLeaderBoard.propTypes = {
  isLoading: bool.isRequired,
  statistics: arrayOf(shape({})).isRequired,
  yearoptions: arrayOf(shape({})).isRequired,
  history: shape({}).isRequired,
  updated: string.isRequired,
  getTopTeachers: func.isRequired,
  getTopTeachersCategories: func.isRequired,
  categoryoptions: arrayOf(shape({ key: any, text: string, value: any })).isRequired,
}

const mapStateToProps = ({ teachersTop, teachersTopCategories }) => {
  const { data } = teachersTop
  const { pending, data: yearsAndCategories } = teachersTopCategories
  const { years = {}, categories = {} } = yearsAndCategories
  const updated = new Date(data.updated)
  return {
    isLoading: pending,
    statistics: data.stats || [],
    updated: updated.toLocaleDateString('en-GB'),
    yearoptions: Object.values(years)
      .map(({ yearcode, yearname }) => ({
        key: yearcode,
        value: yearcode,
        text: yearname,
      }))
      .sort((y1, y2) => y2.value - y1.value),
    categoryoptions: Object.values(categories).map(({ id, name }) => ({
      key: id,
      value: id,
      text: name,
    })),
  }
}

export default connect(mapStateToProps, {
  getTopTeachersCategories,
  getTopTeachers,
})(withRouter(TeacherLeaderBoard))
