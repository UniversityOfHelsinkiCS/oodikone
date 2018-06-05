enrollment_year_select = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div > form > div.fields.populationSearchForm__enrollmentSelectorGroup___2l8ON > div.field.populationSearchForm__yearSelect___OLVSL > div > input"
study_rights_select = "#rightGroup > div > div"

(find enrollment_year_select).click

4.times do
    type :backspace
end

type "2015"

(find study_rights_select).click

click_text "Bachelor of Science, Computer Science"
click_text "See population"

wait 15 do
    has_text? "Credit statistics"
end