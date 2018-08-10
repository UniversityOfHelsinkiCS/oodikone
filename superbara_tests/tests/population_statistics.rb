focus
visit "oodikone.cs.helsinki.fi/testing"

require_relative "./components/query_population_statistics"
require_relative "./components/filters_population_statistics"
require_relative "./components/navigate_population_statistics"

navigation = NavigationPanel.new
population_query = PopulationQuery.new
population_query.query("2014", "Bachelors Degree on Witchcraft and Wizardry", "Defence Against the Dark Arts")


tablebody = find("th", text: /Credits gained during first [0-9]+ months/).find(:xpath, '../../..')
value_start = tablebody.all("td")[10].text.to_i
amount_of_students = tablebody.find(:xpath, '..').find("tr", text:/^n/).all("td")[1].text.to_i
navigation.open
navigation.navigate(/Filters/)
wait 60 do
    has_text? "Add filters"
    has_text? "add"
    amount_of_students == 25
  end
click_button "add"
wait do
    has_text? "cancel"
end
click_text "Advanced filters"

atLeastCreditsFilter = Filter.new("Show only students with credits at least")
startedThisSemesterFilter = Filter.new("started this semester")

atLeastCreditsFilter.fill(true, "30")
atLeastCreditsFilter.set_filter
startedThisSemesterFilter.set_filter

amount_of_students = tablebody.find(:xpath, '..').find("tr", text:/^n/).all("td")[1].text.to_i

min_credits = tablebody.find(:xpath, '..').find("tr", text:"min").all("td")[1].text.to_i
wait do
    (amount_of_students == 17 and
    min_credits > 29)
end

navigation.navigate(/Course/)
find("tr",text:("B2B morph communities")).all("td")[0].click
find("tr", text: "robust unleash e-services").all("td")[0].click
value_end = tablebody.all("td")[10].text.to_i
amount_of_students = tablebody.find(:xpath, '..').find("tr", text:/^n/).all("td")[1].text.to_i
puts(value_start)
puts(value_end)
puts(amount_of_students)
wait 10 do
    (has_text? /Credits at least/ and
    value_start > value_end and
    amount_of_students == 7)
end

save_button = find("button", text: "Save filters as preset")
filter_name = "test " + rand(1...9999999).to_s
save_button.click
fill_in "Name...", with: filter_name
fill_in "Description...", with: "Description for " + filter_name
find("button", text: /^Save$/).click
set_filters = save_button.find(:xpath, "..")
saved = set_filters.all("label", text: filter_name).length == 1
amount_of_students = tablebody.find(:xpath, '..').find("tr", text:/^n/).all("td")[1].text.to_i

wait do
    set_filters == true
    saved == true
    amount_of_students == 7
end
set_filters.find("label", text: filter_name).find(:xpath, "../../../..").all("i")[1].click
wait do
    set_filters != true
    has_text? filter_name
end
preset_filter = Filter.new(filter_name)
preset_filter.set_filter
wait do
    set_filters.all("label", text: filter_name).length == 1
end
set_filters.find("label", text: filter_name).find(:xpath, "../../../..").all("i")[0].click
click_button("Just remove from use")
wait do
    set_filters != true
    has_text? filter_name
end
preset_filter.set_filter
set_filters.find("label", text: filter_name).find(:xpath, "../../../..").all("i")[0].click
click_button("Delete for good")

assert do
    !(has_text? filter_name)
end

creditsAtLeast2 = Filter.new("Show only students with credits less than")
creditsAtLeast2.fill(true, "50")
creditsAtLeast2.set_filter
Filter.new("started this semester").set_filter
save_button = find("button", text: "Save filters as preset")
set_filters = save_button.find(:xpath, "../..")
wait 10 do
    set_filters.all("div",class: "segment").length == 2
    tablebody.find(:xpath, '..').find("tr", text:"max").all("td")[1].text.to_i < 51
end
find("button", text:"clear all filters").click
amount_of_students = tablebody.find(:xpath, '..').find("tr", text:/^n/).all("td")[1].text.to_i

wait do
    set_filters != true
    amount_of_students == 25
end
student_number = ""
wait do
    has_text? "show"
end

wait 15 do
    find("button", text:"show").click
    table = find("th", text: "student number").find(:xpath, "../../..")
    student = table.all("td", text: /01/).random
    student_number = student.text
    student.click
end

wait 30 do
    has_text? /Started/
    has_text? "Student names hidden"
    has_text? student_number
    has_text? "Degree"
end
