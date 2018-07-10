visit "localhost:8081"

wait do
    has_text? "Student statistics"
end

find("a", text:"Student statistics").click
student_search_input = find "input"
student_search_input.type "Paksula"
wait do
    has_text? "012843501"
end
click_text "Student names hidden"
click_text "012843501"

wait do
    has_text? "Filosofian maisteri"
end
assert do
    has_text? "Filosofian maisteri"
end