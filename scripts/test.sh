
#!/bin/bash

# stop on first error
set -e

npm run test_services && npm run cypress:run