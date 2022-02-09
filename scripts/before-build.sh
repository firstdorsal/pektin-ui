if [ ! -v ${1} ]; then
echo $1
sed -i "s|CI_COMMIT_SHORT_SHA|${1}|g" ./public/index.html

fi

# TODO add CI_COMMIT_SHORT_SHA replacer in CI