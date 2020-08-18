---
title: "Bring back the old web"
date: 2020-08-18T18:32:54+01:00
draft: false
summary: "I miss the old web. Maybe it's just nostalgia, maybe it's may anti-monopoly attitude or just my desire for privacy."
---

I miss the old web. Maybe it's just nostalgia, maybe it's may anti-monopoly attitude or just my desire for privacy.

## Blogging Platforms

### Medium

Back then everybody used to host stuff themselves or use one of the many available hosting providers... Nowadays, I get the feeling that 90% of blog posts are being hosted on medium.com. I wouldn't really care, but if I have to read "Pardon the Interruption" one more time, I'll just go mad. Other than that, Medium pages are way too slow and bloated for what they are. [A test via Pingdom Tools](https://tools.pingdom.com/#5d00a9ee1a800000) on a random Medium-hosted article reveals that for what could have been a single HTML file and a few images, there are 107 requests being made. The page load takes 2.40 seconds from one of Pindom's faster-than-average browsers. On my residential broadband connection it is way worse, after finishing reading the first paragraph there is still stuff being loaded in the background.

### Competition

Luckily, there seems to be competition - at least for tech-blogs. As of lately I have notices way more articles being hosted on [substack.com](https://substack.com/). While not as desireable as different self-hosted solutions, it definitely is a step in the right direction.

### Self hosting

The subjectively best option is, as always, to do it yourself. If you host your own blog, you can do with it whatever you want, you help decentralizing the web, you (probably) increase your readers privacy, and the most important argument: You own your content.

At this point, I'll have to admit that my blog is not perfectly self-hosted either, to handle bursts and outages it is currently hosted on [Netlify](https://www.netlify.com/) - a service I can definitely recommend. Through this solution I still can do whatever I want with this site (as long as it is static), while still being able to move to another platform in minutes.

## Discovery

To get back to the main point of this article, outside of discovering similar articles on the (centralized) blogging platform of your choice, there sadly aren't many ways to discover new blogs. While my main sources for discovering new people and their blogs are Hacker News and lobste.rs, there could (and should) be easier ways. Something like those Medium recommendations, but lighter, faster, and more privacy-oriented.

### Webrings

That's when I remembered that webrings used to exist:

> A webring (or web ring) is a collection of websites linked together in a circular structure, and usually organized around a specific theme, often educational or social. They were popular in the 1990s and early 2000s, particularly among amateur websites.
>
> [Source](https://en.wikipedia.org/wiki/Webring)

TL:DR; Webrings are a decentralized, highly customizable solution for providing your readers with the content you enjoy.

Over the years I have accumulated a number of blogs I like. And no way to recommend them to other people enjoying the same topics as me. I could just link them on a custom page on my blog, but that would not lead to many organic page views. That's when I found out about [Drev DeVault's openring](https://sr.ht/~sircmpwn/openring/).

Openring is a great little tool that integrates perfectly into any CMS, static page generator, etc.

For example, this blog in its current form is being built by Hugo. And now features a webring at the bottom of every article. How? Every time I redeploy (after updating articles, fixing layouts, etc.), I run ```openring``` with the RSS feeds of blogs that I like before I run ```hugo build```. My Hugo theme is configured in such a way that it integrates the small HTML file openring generates. To simplify it even further, there is a *very* simple bash script that deploys my blog:

```bash
#! /bin/bash

chmod +x ./netlify/openring
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
    < themes/merlinscholz.name-theme/openring.html \
    > layouts/partials/openring.html 

hugo --minify
```

Please note that I regularily add new blogs to the feed list as I find them.

## Do the same

At this point, I can only urge you to help your readers discovery new authors, blogs, etc. Maybe add a list of blogs you enjoy to your "About me"-page, maybe even implement a webring. Chances are, your readers find your own blog through some random webring on some random blog.