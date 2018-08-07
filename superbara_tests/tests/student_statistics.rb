visit $basepath

wait do
    has_text? "Student statistics"
end

find("a", text:"Student statistics").click
student_search_input = find "input"
student_search_input.type "Kemmer"
wait do
    has_text? "01079230"
end
click_text "Student names hidden"
wait do
    has_text? "Kemmer"
end

click_text "01079230"

wait do
    has_text? "Alchemy"
    has_text? "Credits: 321"
    has_text? "Delbert.Johnson@gmail.com"
end
