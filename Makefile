default:
	@echo "Run \"make all\" to start everything from scratch"

get_file_lists:
	s=1   e=50  node filelist.js  > ./tmp/part1.txt
	s=51  e=100 node filelist.js  > ./tmp/part2.txt
	s=101 e=150 node filelist.js  > ./tmp/part3.txt
	s=151 e=200 node filelist.js  > ./tmp/part4.txt
	s=201 e=250 node filelist.js  > ./tmp/part5.txt
	s=251 e=300 node filelist.js  > ./tmp/part6.txt
	s=301 e=350 node filelist.js  > ./tmp/part7.txt
	s=351 e=400 node filelist.js  > ./tmp/part8.txt
	s=401 e=450 node filelist.js  > ./tmp/part9.txt
	s=451 e=500 node filelist.js  > ./tmp/part10.txt
	s=501 e=550 node filelist.js  > ./tmp/part11.txt
	s=551 e=600 node filelist.js  > ./tmp/part12.txt
	s=601 e=650 node filelist.js  > ./tmp/part13.txt

download:
	cd ./tmp/ ;\
	aria2c -j 1 -x 2 -i part1.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part2.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part3.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part4.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part5.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part6.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part7.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part8.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part9.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part10.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part11.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part12.txt  -d htmls/ ; sleep 5 ;\
	aria2c -j 1 -x 2 -i part13.txt  -d htmls/ ; sleep 5 ;\
	cd ..

replace:
	echo "Remember to replace special char in some files because the html is encoded with BIG5-eten extension."
	echo "For example, the file \"index.466.htm\" contains special characters."

convert:
	# big5 -> utf8
	# The "Find command" is for MacOS only. If running in linux, the find part
	# and iconv might need to be updated.
	mkdir -p tmp/converted_htmls ;\
	cd ./tmp/htmls/ ; \
	pwd ;\
	find . -type f -exec bash -c 'iconv -f BIG5-2003 -t utf-8 "{}" > ../converted_htmls/"{}"' \; ; \
	cd ../../

parse:
	npm run main

clean:
	rm ./tmp/part*.txt
	rm -r ./htmls/ ./converted_htmls/
	echo "Cleaned."


all: get_file_lists download replace convert parse
	echo "Done!"
