const infoTooltips = {
  PopulationStatistics: {
    Filters: {
      CreditsAtLeast: 'Removes students that do not have at least given amount of credits',
      CreditsLessThanFromMandatory: `Removes students that have more than the given  
          amount of credits from the set of mandatory courses`,
      CreditsLessThan: 'Removes students that have more than the given amount of credits',
      StartingThisSemester: `Switch the toggle to choose a filter that removes 
        students that have studied before this population enrollment date or vice versa`,
      EnrollmentStatus: 'Show students that we\'re present or absent during the chosen semesters',
      CanceledStudyright: 'Show students that officially canceled their studyright to the queried program',
      DisciplineTypes: `Automatically gives course participation filters for 
        the given course types of the given discipline. You can set a limit for 
        participations to bring up only the popular courses.`,
      ExtentGraduated: `Build a filter to students that have or have not studied or graduated a given extent
       of studies. For example here you can show students that have graduated from a bachelor's degree`,
      TransferFilter: `You can choose students that transfered from a given programme to another. 
        Transfer means a student that changed their program during his studyright (not a student getting 
        another studyright at some other institution)`
    }
  }
}

export default infoTooltips
