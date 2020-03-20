TAP ?= ../../node_modules/.bin/tap

all: $(patsubst %.js,%.tap,$(wildcard *.js))

%.tap: %.js
	-$(TAP) --no-coverage -R tap --timeout=1 $*.js > $*.tap
