# Combined programmes

At the moment onöy programmes KH90_001 and MH90_001 have a combined view.

The made changes do not have any effects to faculty or trends views.

## Study programme

- Search by class
- Overview

**Redis nightly study programme update**

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

- Fetch all courses for both programmes and show them in one table

**Degree courses**

- Possibility to add criteria for whole bachelor-master study time
- For eläinlääkis this criteria is saved by bachelor programme code. Other cases may need other approaches.
  In eläinklääkis this done by adding the criteria for 6 years -> the whole study time criteria is saved with the bachelor programme code. That is, same criteria is found, if bachelor or combined programme view is shown. This approach might need extra thinking for different programmes.
  - **Needs manual work** where?
- Show own tables for both programmes

**Tags**

- Added possibility to add tags for combined programme.

## Class statistics view

**Students**

- **General tab** - Additional fields for graduation and hops
- **Courses tab** - show all courses for both programmes
- **Tags tab** - show tabs related to this combination.
- **Progress tab** - possibility to have progress for whole bachelor-master study time. **See Degree courses approach** to add criteria. **May need future manual work**, depending on the programme id with which the data is saved on the database.

## Filters

**Hops (study plan)**

**Graduated from programme**

**Studyright status**

## Study guidance groups

- Backend: student data is fetched by bachelor study programme code in `/v3/populationstatisticsbystudentnumbers`. Separation from code 'KHxx_xxx+MHxx_xxx' is done in backend.
- Frontend: things are done in the same way as with class stats.
- **Need manual work**: `./oodikone/services/frontend/src/redux/elementdetails.js` add combined programme codes (both bachelor and master) to `combinedProgrammeCodes` and modify `combinedOptions` list accordinly in `useFilterAndFormattedElementDetails()` function.
