#! /bin/bash

chmod +x ./bin/openring
mkdir -p layouts/partials

./netlify/openring \
    -n 5 \
    -s https://kevq.uk/feed/ \
    -s https://thehftguy.com/feed/ \
    -s https://www.leadedsolder.com/feed.xml \
    -s https://chrisdown.name/feed.xml \
    -s https://lord.io/feed.xml \
    -s https://tech.trivago.com/index.xml \
    -s https://blog.alexellis.io/rss/ \
    -s https://sobolevn.me/feed.xml \
    -s https://cmacr.ae/index.xml \
    -s https://rachelbythebay.com/w/atom.xml \
    -s https://virtuallyfun.com/wordpress/feed/ \
    -s https://chrisshort.net/index.xml \
    -s https://drewdevault.com/feed.xml \
    -s https://tarynpivots.com/index.xml \
    -s https://blog.pizzabox.computer/index.xml \
    -s https://chrisdown.name/feed.xml \
    -s https://blog.monstermuffin.org/feed/ \
    -s https://www.jessesquires.com/feed.xml \
    < themes/merlinscholz.name-theme/openring.html \
    > layouts/partials/openring.html 

hugo --minify
