import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Divider } from 'semantic-ui-react'

import LineGraph from './LineGraph'
import StackedBarChart from './StackedBarChart'
import BarChart from './BarChart'
import DataTable from './DataTable'
import InfoBox from '../../Info/InfoBox'
import { getBasicStats, getCreditStats, getGraduationStats } from '../../../redux/studyProgramme'
import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const basicStatsTitles = ['', 'Started', 'Graduated', 'Cancelled', 'Transferred away', 'Transferred to']
const creditStatsTitles = ['', 'Major students credits', 'Non major students credits', 'Transferred credits']
const graduationStatsTitles = ['', 'Graduated', 'Wrote thesis']

const Overview = props => {
  const toolTips = InfotoolTips.Studyprogramme
  const {
    studyprogramme,
    basicStats,
    creditStats,
    graduationStats,
    dispatchGetBasicStats,
    dispatchGetCreditStats,
    dispatchGetGetGraduationStats,
  } = props

  useEffect(() => {
    dispatchGetBasicStats(studyprogramme)
    dispatchGetCreditStats(studyprogramme)
    dispatchGetGetGraduationStats(studyprogramme)
  }, [])

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider horizontal>{title}</Divider>
      </div>
      <InfoBox content={toolTips[toolTipText]} />
    </>
  )

  return (
    <div className="studyprogramme-overview">
      {getDivider('Students of the studyprogramme', 'StudentsOfTheStudyprogramme')}
      <div className="section-container">
        <LineGraph categories={basicStats?.data?.years} data={basicStats?.data?.graphStats} />
        <DataTable titles={basicStatsTitles} data={basicStats?.data?.tableStats} />
      </div>
      {getDivider('Credits produced by the studyprogramme')}
      <div className="section-container">
        <StackedBarChart categories={creditStats?.data?.years} data={creditStats?.data?.graphStats} />
        <DataTable titles={creditStatsTitles} data={creditStats?.data?.tableStats} />
      </div>
      {getDivider('Graduated and thesis writers of the programme')}
      <div className="section-container">
        <BarChart categories={graduationStats?.data?.years} data={graduationStats?.data?.graphStats} />
        <DataTable titles={graduationStatsTitles} data={graduationStats?.data?.tableStats} />
      </div>
    </div>
  )
}

const mapStateToProps = ({ studyProgramme }) => ({
  basicStats: studyProgramme?.basicStats,
  creditStats: studyProgramme?.creditStats,
  graduationStats: studyProgramme?.graduationStats,
})

export default connect(mapStateToProps, {
  dispatchGetBasicStats: getBasicStats,
  dispatchGetCreditStats: getCreditStats,
  dispatchGetGetGraduationStats: getGraduationStats,
})(Overview)
