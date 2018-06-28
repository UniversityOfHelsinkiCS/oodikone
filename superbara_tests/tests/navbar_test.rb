visit $basepath

wait do
    has_text? "oodikone"
    has_text? "Population statistics"
    has_text? "Student statistics"
    has_text? "Course statistics"
end


population_button = find("a", text: "Population statistics")
population_button.click

wait do 
  has_text? "Search for population"
  has_text? "Enrollment year"
  has_text? "Semester"
  has_text? "End of search"
  has_text? "Degree"
  has_text? "Study programme"
end

studentstats_button = find("a", text: "Student statistics")
studentstats_button.click

wait do
  switch = find("label", text: "Student names hidden")
  input = find("input")
end

coursestats_button = find("a", text: "Course statistics")
coursestats_button.click

wait do
  all("input").length >= 3
end

oodikone_home_button = find("a", text: "oodikone")
oodikone_home_button.click

wait do
  has_text? "a tool for explorative research on student data"
end
