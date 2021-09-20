#!/bin/bash
docker build ./scripts/jss/ -t pektin/ui-jss-error
docker run -p 4002:80 -it pektin/ui-jss-error