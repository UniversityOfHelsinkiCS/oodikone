visit "localhost:8081"

require_relative "./components/query_population_statistics"
require_relative "./components/filters_population_statistics"
require_relative "./components/navigate_population_statistics"

navigation = NavigationPanel.new
population_query = PopulationQuery.new
population_query.query("2017", "Tietojenkäsittelytieteen kandiohjelma")


tablebody = find("th", text: /Credits gained during first [0-9]+ months/).find(:xpath, '../../..')
value_start = tablebody.all("td")[1].text.to_i

navigation.open
navigation.navigate(/Filters/)
wait 60 do
    has_text? "Add filters"	     
  end
click_button "add"

atLeastCreditsFilter = Filter.new("Show only students with credits at least")
startedThisSemesterFilter = Filter.new("started this semester")
genderFilter = Filter.new("Filter by gender")

atLeastCreditsFilter.fill(true, "30")
atLeastCreditsFilter.set_filter

startedThisSemesterFilter.set_filter

genderFilter.fill(false, "Male")
genderFilter.set_filter

value_end = tablebody.all("td")[1].text.to_i

navigation.navigate(/Course/)

wait 60 do
    has_text? /Credits at least/
    value_start > value_end
    find("th", text: "Course")
end

click_button("clear all filters")

navigation.navigate(/Student/)
click_button("show")
navigation.navigate(/Student/)

table = find("th", text: "student number").find(:xpath, "../../..")
student = table.all("td", text: /01/).random
student_number = student.text
student.click
wait 30 do
    has_text? /Started/
    has_text? "Student names hidden"
    has_text? student_number
    has_text? "Degree"
end
