run 'common'

tests = Dir.glob("./tests/*.rb")

for test in tests
  run test
end