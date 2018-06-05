run 'common'

tests = Dir.entries("./tests").select { |file| file.end_with?(".rb") }

for test in tests
  test_filepath = File.join(".", "tests", test)
  run test_filepath
end