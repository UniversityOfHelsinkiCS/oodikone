visit "localhost:8081"

wait do
    find "a", text: "Population statistics"	     
end.click

run "./helpers/population_statistics"

click_text "add"
tablebody = find("th", text: /Credits gained during first [0-9]+ months/).find(:xpath, '..').find(:xpath, '..').find(:xpath, '..')
value_start = tablebody.all("td")[1].text.to_i

filter = find("label", text:"Show only students with credits at least").find(:xpath, '..').find(:xpath, '..')
filter.find("input").click
type "200"
filter.click_button("set filter")

value_end = tablebody.all("td")[1].text.to_i

wait 60 do
    has_text? "Credits at least 200"
    value_start > value_end
    find("th", text: "Course")
end
