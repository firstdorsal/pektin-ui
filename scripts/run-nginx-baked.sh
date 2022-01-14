#!/bin/bash
docker build . -t pektin/ui
xdg-open "http://localhost:4002"
docker run -p 4002:80 -it pektin/ui
