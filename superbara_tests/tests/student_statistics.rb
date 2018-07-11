visit $basepath

wait do
    has_text? "Student statistics"
end

find("a", text:"Student statistics").click
student_search_input = find "input"
student_search_input.type "Madie"
wait do
    has_text? "01282090"
end
click_text "Student names hidden"
wait do
    has_text? "Madie"
end

click_text "01282090"

wait do
    has_text? "Care of Magical Creatures"
    has_text? "Credits: 240"
    has_text? "Dayton.Hoeger37@hotmail.com"
end
