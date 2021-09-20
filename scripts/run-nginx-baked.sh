#!/bin/bash
docker build . -t pektin/ui
docker run -p 4002:80 -it pektin/ui