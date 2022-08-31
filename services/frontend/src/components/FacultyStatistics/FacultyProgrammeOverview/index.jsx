import React from 'react'
// import { Divider, Loader } from 'semantic-ui-react'
import Toggle from '../../StudyProgramme/Toggle'
// import InfoBox from '../../Info/InfoBox'

import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

// const getDivider = (title, toolTipText) => (
//   <>
//     <div className="divider">
//       <Divider data-cy={`Section-${toolTipText}`} horizontal>
//         {title}
//       </Divider>
//     </div>
//     <InfoBox content="Keskimääräiset valmistumisajat" />
//     {/* <InfoBox content={toolTips[toolTipText]} /> */}
//   </>
// )

const FacultyProgrammeOverview = ({ faculty, studyProgrammes, setStudyProgrammes }) => {
  const toolTipsProgramme = InfotoolTips.Faculty
  // // const [programme, setProgramme] = useState(faculty)
  // const [showMeanTime, setShowMeanTime] = useState(false)
  // const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  // const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty?.code, studyProgrammeFilter })

  // const isFetchingOrLoading = graduationStats.isLoading || graduationStats.isFetching

  // const isError = graduationStats.isError || (graduationStats.isSuccess && !graduationStats.data)

  // if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <>
      <div className="programmes-overview">
        <div className="toggle-container">
          <Toggle
            cypress="ProgrammeToggle"
            toolTips={toolTipsProgramme.ProgrammeToggle}
            firstLabel="New study programmes"
            secondLabel="All study programmes"
            value={studyProgrammes}
            setValue={setStudyProgrammes}
          />
        </div>
      </div>
      <strong> Data for {faculty?.code} upcoming</strong>
    </>
  )
}

export default FacultyProgrammeOverview
