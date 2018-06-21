
visit "localhost:8081"

wait do
    find "a", text: "Population statistics"	     
end.click

run 'helpers/population_statistics'

click_text "show"

assert do
    has_text? "Student names hidden"
end

(find first_student_selector).click

wait 15 do
    has_css? credit_accumulation_graph
end
