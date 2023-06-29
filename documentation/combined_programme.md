# Combined programmes

At the moment only programmes KH90_001 and MH90_001 have a combined view.

The made changes do not have any effects on faculty or trends views. **Needs manual work** is added into those parts that needs visit, if this functionality is added to other programmes.

Basic rule of thumb is that for the master/licentiate programme I used names `combinedProgramme` and in some rare cases `secondProgramme` as whole or part of the variable names.

## Study programme

**Needs manual work** in the function `getCombinedProgrammeId` in `services/frontend/src/common/index.js` if new programmes is added. For showing the both programme data correctly, the filtering mechanism is changed to add both programmes and it is not caring for which programme user has acual rights or IAMrights. However, the links for the class stats level are hidden in studytrack tables, if the user has no rights for the programme.

- Search by class
  - **Needs manual work** Combine programmes here
- Overview
  - **Needs manual work**

**Redis nightly study programme update**

- Updates automatically combined programme stats. **Needs manual work** here `services/backend/src/services/studyprogrammeHelpers.js` in the constant `combinedStudyprogrammes`. This might needs refactoring if bachelor programme can have many separate master programmes. Then remember to change function `refreshNewOverview` in `services/backend/src/events.js` accordingly to handle lists.

**NOTE:** `combinedStudyprogrammes` is also used to fetch course modules (mandatory courses). If the logic of this constant is changed in `studyProgrammeHelpers.js` -> the needed changes must be done also here `services/backend/src/services/programmeModules.js`. While writing this, the cleverer idea of doing this might have been to send `code` in form `KHxx_xxx+MHxx_xxx` and do the splitting into two codes in the backend as done in Study guidance groups logic. Changes were done here 'services/backend/src/routes/population.js', acual place is near `getFilteredAssociations` function.

**Basic information**

All things listed below should work automatically, if new combinations are done.

- Credits produced byt the studyprogramme
  - credits are computed for both programmes separately
- Average graduation times
  - For bachelor + master/licentiate studyright the time is the whole study time starting from bachelor
- _Students of the programme_ and _Graduated and thesis writers of the programme_
  - separate fields for started, graduated and thesis writers

**Studytracks and class statistics**

- _Students of the studyprogramme by starting year_
  - Graduated field separated for both programmes
  - All = currently enrolled + absent + inactive + graduated licentiate
- _Progress of students of the studyprogramme by starting year_
  - computed for whole bachelor + master/licentiate studyright period
- _Average graduation times_
  - bachelor + master/licentiate graph: start is bachelor studyright start

**Programme courses**

- Fetch all courses for both programmes and show them in one table.

**Degree courses**

- Possibility to add criteria for whole bachelor-master study time
- For eläinlääkis this criteria is saved by bachelor programme code. Other cases may need other approaches.
  In eläinklääkis this done by adding the criteria for 6 years -> the whole study time criteria is saved with the bachelor programme code. That is, same criteria is found, if bachelor or combined programme view is shown. This approach might need extra thinking for different programmes.
- Show own tables for both programmes
  - To fetch data **needs manual work** here `services/backend/src/services/studyprogrammeHelpers.js` in the constant `combinedStudyprogrammes`.

**Tags**

- Possibility to add tags for combined programme.

## Class statistics view

**Credit accumulation**

- Show graduations for both programmes

**Credit statistics**

- Bachelor and bachelor+master combo have own graphs.

**Courses of class**

- Show courses for both programmes

**Students**

- **General tab** - Additional fields for graduation and hops
- **Courses tab** - show all courses for both programmes. The courses are fetched with same logic as for Degree programmes.
- **Tags tab** - show tabs related to this combination.
- **Progress tab** - possibility to have progress for whole bachelor-master study time. **See Degree courses approach** to add criteria. **May need future manual work**, depending on the programme id with which the data is saved on the database.

## Filters

- **Hops (study plan)** - possibility filter out credits separate for both programmes or for both at the same time

- **Graduated from programme** - possibility to filter out students based on graduation either in bachelor's or master's.

- **Studyright status** - active or inactive based on the chosen degree

- **Studytrack filter** (needs programme code) is not touched at the moment, thus **may need future manual work**.

## Study guidance groups

- Backend: student data is fetched by bachelor study programme code in `/v3/populationstatisticsbystudentnumbers`. Separation from code 'KHxx_xxx+MHxx_xxx' is done in backend.
- Frontend: things are done in the same way as with class stats.
- **Need manual work**: `./oodikone/services/frontend/src/redux/elementdetails.js` add combined programme codes (both bachelor and master) to `combinedProgrammeCodes` and modify `combinedOptions` list accordinly in `useFilterAndFormattedElementDetails()` function.
