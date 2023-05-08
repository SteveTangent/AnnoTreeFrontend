cd public
for name in *.md; do
	../node_modules/markdown-to-html/bin/github-markdown $name --title ${name%.md} -s ./markdown.css > ${name%.md}.html
done
cd ..
NODE_ENV=production node_modules/.bin/webpack -p --progress --colors