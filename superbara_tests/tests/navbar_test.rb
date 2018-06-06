visit $basepath

wait do
    has_text? "oodikone"
    has_text? "Department success"
    has_text? "Population statistics"
    has_text? "Course Instances"
    has_text? "Student statistics"
    has_text? "Course statistics"
end

department_button = find("#root > div > main > header > div.ui.fluid.stackable.nine.item.navigationBar__navBar___ub1xb.menu > a.item.active")
department_button.click

wait do
  has_text? "Average credit"
end

population_button = find("#root > div > main > header > div.ui.fluid.stackable.nine.item.navigationBar__navBar___ub1xb.menu > a:nth-child(3)")
population_button.click

wait do 
  find("#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div")
  has_text? "Search for population"
  has_text? "Enrollment year"
  has_text? "Semester"
  has_text? "End of search"
  has_text? "Study rights"
end

instances_button = find("#root > div > main > header > div.ui.fluid.stackable.nine.item.navigationBar__navBar___ub1xb.menu > a:nth-child(4)")
instances_button.click

wait do
    has_text? "Course Statistics"
    has_text? "No course selected"
    input1 = find("#root > div > main > div.courses__container___3I4-R > div.ui.search.courseSearch__courseSearch___3itB0 > div.ui.fluid.icon.input > input")
    input2 = find("#root > div > main > div.courses__container___3I4-R > div.ui.fluid.selection.dropdown.courses__courseSearch___F-VoQ")
end

studentstats_button = find("#root > div > main > header > div.ui.fluid.stackable.nine.item.navigationBar__navBar___ub1xb.menu > a:nth-child(5)")
studentstats_button.click

wait do
  switch = find("#root > div > main > div:nth-child(3) > div:nth-child(2) > div > label")
  input = find("#root > div > main > div:nth-child(3) > div.ui.segment.layout__contentSegment___M-cZG > div > div.ui.search.studentSearch__studentSearch___1OUOc > div > input")
end

coursestats_button = find("#root > div > main > header > div.ui.fluid.stackable.nine.item.navigationBar__navBar___ub1xb.menu > a:nth-child(6)")
coursestats_button.click

wait do
  input_field = find("#root > div > main > div.courseStatistics__container___3xGv2 > div.ui.search.courseSearch__courseSearch___3itB0 > div.ui.fluid.icon.input > input")
  start_year_input = find("#root > div > main > div.courseStatistics__container___3xGv2 > form > div > div:nth-child(1) > div > input")
  ending_year_input = find("#root > div > main > div.courseStatistics__container___3xGv2 > form > div > div:nth-child(3) > div > input")
  course_search_input = find("#root > div > main > div.courseStatistics__container___3xGv2 > div.ui.search.courseSearch__courseSearch___3itB0 > div.ui.fluid.icon.input > input")
  separate_springfall_checkbox = find("#root > div > main > div.courseStatistics__container___3xGv2 > form > div > div:nth-child(5) > div > label")
end

oodikone_home_button = find("#root > div > main > header > div.ui.fluid.stackable.nine.item.navigationBar__navBar___ub1xb.menu > a:nth-child(1)")
oodikone_home_button.click

wait do
  has_text? "Average credit"
end
