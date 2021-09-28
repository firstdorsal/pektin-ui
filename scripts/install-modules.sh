#!/bin/bash
yarn
cat ./modified-modules/react-virtualized/detectElementResize.js > ./node_modules/react-virtualized/dist/es/vendor/detectElementResize.js
sed -i "s|container.cssRules.length|container?.cssRules?.length|g" node_modules/jss/dist/jss.esm.js
sed -i "s|attach() {|attach() {return;|g" node_modules/jss/dist/jss.esm.js