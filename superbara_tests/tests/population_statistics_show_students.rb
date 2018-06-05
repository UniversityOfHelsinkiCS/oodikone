first_student_selector = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div:nth-child(2) > div:nth-child(4) > div:nth-child(3) > table > tbody > tr:nth-child(1) > td:nth-child(1)" 
credit_accumulation_graph = "#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div > div.creditAccumulationGraph__graphContainer___2cC5j"

visit $basepath
wait do
    has_text? "Population statistics"
end
click_text "Population statistics"

run 'helpers/population_statistics'

click_text "show"

assert do
    has_text? "Student names hidden"
end

(find first_student_selector).click

wait 15 do
    has_css? credit_accumulation_graph
end
