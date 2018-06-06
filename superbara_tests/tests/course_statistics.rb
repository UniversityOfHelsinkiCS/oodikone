visit $basepath + "/coursestatistics"

wait do
  add_years = find("#root > div > main > div.courseStatistics__container___3xGv2 > form > div > div:nth-child(2) > div > button:nth-child(2)")
  add_years.click
  add_years.click
end

wait do
  input_field = find("#root > div > main > div.courseStatistics__container___3xGv2 > div.ui.search.courseSearch__courseSearch___3itB0 > div.ui.fluid.icon.input > input")
  input_field.click
end


type "tietorakenteet"


wait do
  tira_course = find("#root > div > main > div.courseStatistics__container___3xGv2 > div.ui.search.courseSearch__courseSearch___3itB0 > div.results.transition > div:nth-child(2)")
  tira_course.click
end

wait do
  barchart = find("#root > div > main > div.courseStatistics__container___3xGv2 > div:nth-child(4) > div.coursePassRateChart__chartContainer___2eFPn")
  barchart.hover
  has_text? "2016-2017"
end

wait 10 do
  remove_button = find("#root > div > main > div.courseStatistics__container___3xGv2 > div:nth-child(4) > div.coursePassRateChart__chartContainer___2eFPn > button")
  remove_button.click
end
assert do
  not has_css? "#root > div > main > div.courseStatistics__container___3xGv2 > div:nth-child(4) > div.coursePassRateChart__chartContainer___2eFPn"
end