visit $basepath

wait do
    has_text? "Student statistics"
end

click_text "Student statistics"
student_search_input = find "input"
student_search_input.type "Paksula Matti"
click_text "Student names hidden"
click_text "012843501"

wait do
    has_text? "Filosofian maisteri"
end
assert do
    has_text? "Filosofian maisteri"
end