if [[ -n $CI_COMMIT_SHORT_SHA ]]; then

sed -i "s|CI_COMMIT_SHORT_SHA|${CI_COMMIT_SHORT_SHA }|g" ./public/index.html

fi