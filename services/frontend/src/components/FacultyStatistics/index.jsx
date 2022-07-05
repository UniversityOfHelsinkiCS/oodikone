import React, { useCallback, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { withRouter, useHistory } from 'react-router-dom'
import { Segment, Header, Tab } from 'semantic-ui-react'
import { getFaculties } from 'redux/faculties'
import { getTextIn } from 'common'
import { useTabs, useTitle } from '../../common/hooks'
import FacultySelector from './facultySelector'
import BasicOverview from './BasicOverview'
import ProgrammeOverview from './FacultyProgrammeOverview'
import useLanguage from '../LanguagePicker/useLanguage'
// import TSA from '../../common/tsa'

const FacultyStatistics = props => {
  useTitle('Faculties')
  const history = useHistory()
  const { language } = useLanguage()
  const { match, faculties, getFaculties } = props
  const { facultyCode } = match.params
  const faculty = facultyCode && faculties.find(f => f.code === facultyCode)
  const facultyName = faculty && getTextIn(faculty.name, language)

  const [tab, setTab] = useTabs('p_tab', 0, history)
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)

  useEffect(() => {
    if (faculties.length === 0) getFaculties()
  }, [])

  // useEffect(() => {
  //   if (!facultyName) {
  //     return
  //   }

  //   TSA.Matomo.sendEvent('Faculty Usage', 'faculty overview', facultyName)
  //   TSA.Influx.sendEvent({
  //     group: 'Faculty Usage',
  //     name: 'faculty overview',
  //     label: facultyName,
  //     value: 1,
  //   })
  // }, [facultyName])

  const handleSelect = useCallback(
    faculty => {
      history.push(`/faculties/${faculty}`, { selected: faculty })
    },
    [history]
  )

  const getPanes = () => {
    const panes = [
      {
        menuItem: 'Basic information',
        render: () => (
          <BasicOverview
            faculty={faculty}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            specialGroups={specialGroups}
            setSpecialGroups={setSpecialGroups}
          />
        ),
      },
      {
        menuItem: 'Programmes and student populations',
        render: () => <ProgrammeOverview />,
      },
    ]
    return panes
  }

  const panes = getPanes()

  if (!facultyCode)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Faculty statistics
        </Header>
        <Segment className="contentSegment">
          <FacultySelector faculties={faculties} selected={facultyCode !== undefined} handleSelect={handleSelect} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{facultyName}</Header>
          <span>{facultyCode}</span>
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}

const ignore = ['Y', 'H99', 'Y01', 'H92', 'H930']

const mapStateToProps = state => ({
  faculties: state.faculties.data.filter(f => !ignore.includes(f.code)),
})

export default connect(mapStateToProps, { getFaculties })(withRouter(FacultyStatistics))
