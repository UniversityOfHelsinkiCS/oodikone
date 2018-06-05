visit $basepath

male_radio_label = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(6) > form > div > div:nth-child(2) > div:nth-child(1) > label"
sex_filter_add_button = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(6) > form > div > div:nth-child(3) > button"

wait do
    find "a", text: "Population statistics"
end.click

run "./helpers/population_statistics"

click_text "add"

(find male_radio_label).click
(find sex_filter_add_button).click

assert do
    has_text? "Showing only male students."
end

scroll 1.5