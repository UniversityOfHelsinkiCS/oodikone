run 'common'

tests = Dir.entries("./tests").select { |file| file.end_with?(".rb") }
failed_tests = Array.new

for test in tests
  begin
    test_filepath = File.join(".", "tests", test)
    load test_filepath
  rescue
    failed_tests.push(test)
    next
  end
end

if !failed_tests.empty?
  raise 'Some tests failed.'
end

puts failed_tests