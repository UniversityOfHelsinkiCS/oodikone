visit "oodikone.cs.helsinki.fi/testing"
require_relative "./components/query_course_statistics"

course_statistics = CourseQuery.new
start_year = rand(2011...Time.now.year - 1)
end_year = rand(start_year + 1 ... Time.now.year)

course_statistics.query(start_year.to_s, end_year.to_s, "end-to-end revolutionize solutions")

wait do
  barchart = all("div", class:"recharts-wrapper")[0]
  bar = barchart.all("path", class:"recharts-rectangle").random
  bar.hover
end

wait do
  has_text? "all"
  has_text? "passed"
  has_text? "failed"
end

click_text "switch to student level view"

wait do 
  barchart = all("div", class:"recharts-wrapper")[0]
  bar = barchart.all("path", class:"recharts-rectangle").random
  bar.hover
end

wait do
  has_text? "all"
  has_text? "students that passed on their first try"
  has_text? "students that passed re-examination"
  has_text? "students that failed on their first try"
  has_text? "students that failed their re-examination"
end
wait do
  barchart = all("div", class:"recharts-wrapper")[1]
  bar = barchart.all("path", class:"recharts-rectangle").random
  bar.hover
end

wait do
  has_text? "1"
  has_text? "2"
  has_text? "3"
  has_text? "4"
  has_text? "5"
  has_text? "failed"

end

click_button "Remove"