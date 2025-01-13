export const updaterToolTips = {
  updaterSection: `
    **Update meta**: Updates organisations, study modules, course units, study levels, education types, credit types  
    **Update students**: Updates 1000 students at one click in development and all in production environment. Takes about 5 hours in production.  
    **Update curriculums**: Updates all study programmes and their curriculums. This takes a few minutes, and breaks the curriculum features for that time, so do not run in production unnecessarily.  
    **Refresh updater redis**: Refreshes maps (COUNTRIES, EDUCATION_TYPES, ORGANISATION_ID_TO_CODE, etc.) stored in updater redis. Check \`loadMapsOnDemand\` function in updater for more information.
  `,
  refreshDataSection: `
    **Refresh all teacher leaderboards**: Refresh all teacher leaderboard statistics from 1951 until today. Might take some time.  
    **Refresh teacher leaderboards of current and previous year**: Refresh teacher leaderboard statistics for current and previous academic year.  
    **Refresh faculties**: Refresh data for all faculties for all tabs (time consuming).  
    **Refresh study programmes**: Refresh data for new study programmes for basic and studytrack tabs (time consuming).  
    **Refresh language center data**: Refresh data for language center view.  
    **Refresh close to graduation data**: Refresh data for close to graduation view.
  `,
}
