TAP ?= ../../node_modules/.bin/tap

all: $(patsubst %.test.js,%.tap,$(wildcard *.js))

%.tap: %.test.js
	-$(TAP) --no-coverage -R tap --timeout=1 $*.test.js > $*.tap
