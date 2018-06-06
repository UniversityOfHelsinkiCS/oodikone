enrollment_year_select = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div > form > div.fields.populationSearchForm__enrollmentSelectorGroup___2l8ON > div.field.populationSearchForm__yearSelect___OLVSL > div > input"
study_rights_select = "#rightGroup > div > div"

wait 15 do
    (find enrollment_year_select).click
end
2.times do
    type :backspace
end

type "15"

(find study_rights_select).click

click_text "Bachelor of Science, Computer Science"
click_text "See population"

wait 60 do
    find("#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(2)")
end
