visit "localhost:8081"

enrollment_year_select = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div > form > div.fields.populationSearchForm__enrollmentSelectorGroup___2l8ON > div.field.populationSearchForm__yearSelect___OLVSL > div > input"
study_rights_select = "#rightGroup > div > div"
male_radio_label = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(6) > form > div > div:nth-child(2) > div:nth-child(1) > label"
sex_filter_add_button = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(6) > form > div > div:nth-child(3) > button"

wait do
    find "a", text: "Population statistics"
end.click

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

click_text "add"

(find male_radio_label).click
(find sex_filter_add_button).click

assert do
    has_text? "Showing only male students."
end

scroll 1.5