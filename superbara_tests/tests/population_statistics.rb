visit $basepath

male_radio_label = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(6) > form > div > div:nth-child(2) > div:nth-child(1) > label"
sex_filter_add_button = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(6) > form > div > div:nth-child(3) > button"
population_td = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(2) > table > tbody > tr:nth-child(1) > td:nth-child(2)"

wait do
    find "a", text: "Population statistics"	     
end.click

run "./helpers/population_statistics"

click_text "add"
value_start = (find population_td).text.to_i
(find male_radio_label).click
(find sex_filter_add_button).click

value_end = (find population_td).text.to_i

assert "Filter is on and is filtering population" do
    has_text? "Showing only male students."
    value_start > value_end
    highcharts = find("#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > div")
end
