---
date: "2024-08-18"
title: "Embracing the e.V."
---

This post is not about electric vehicles.

Big providers are going downhill. At first they started to sell your data (duh), then there was cramming blockchain into everything, after that it was NFTs and now AI, and even worse, using your data to train it.

Of course I don't like this. Luckily, I do have my own domain name and paid attention to not get too locked in into any big provider. That's why, this year, I changed my tactics and moved a lot of stuff from Big Tech™ to smaller, locally hosted providers. Apart of them having to follow Germany's data protection rules, there is another nice benefit: A lot of them are registered as an e.V.
An e.V., short for *eingetragener Verein*, are a special, German (although similar equivalents exist in other countries) type of non-profit organization. Next to some legal stuff, they also have to provide a set of bylaws that describe who they are, what they do, in whose interest they act, and so on. As it turns out, there are a lot hosting providers running as an e.V.

## Codeberg

The probably most common known e.V. may be the [Codeberg e.V.](https://docs.codeberg.org/getting-started/what-is-codeberg/#what-is-codeberg-e.v.%3F). [Codeberg](https://codeberg.org/) is a hosted alternative to GitHub and GitLab, powered by their open-source Gitea fork called [Forgejo](https://forgejo.org/). I've recently mirrored all my repositories there (thanks to the really great migration feature they provide) and have to say, I'm more than pleased. They offer all the stuff you know from GitHub (okay maybe not all of it but everything you'd actually use), without the AI stuff and without selling your data. I really recommend giving them a try if you haven't already. They also offer an equivalent to GitHub Pages, aptly called [Codeberg Pages](https://docs.codeberg.org/codeberg-pages/).

## Uberspace

My email used to be hosted on Fastmail. At least it was for a year after moving between Proton, Mailbox, StartMail, and a bunch of others. Fastmail never really sat right with me, them being a big corporation based in Australia, paying no regards to privacy, etc.

Then I found [Uberspace](https://uberspace.de/en/). Uberspace, while not an e.V., is a smaller German hosting providers that offers you a Linux shell. Not a VPS, not a dedicated host or any services, just a Linux shell on a big server. And I love it. They have Nginx and an SMTP server set up in front of your (shared) host, so you can host websites there, static *and* dynamic ones. In fact this website is hosted there right now. You can also host your mail there, shoot me an email and it will land on the exact same host this site is running on. They also have MariaDB running on every host so you have access to a database as well, very handy for hosting [WordPress](https://lab.uberspace.de/guide_wordpress/) or [Forgejo](https://lab.uberspace.de/guide_forgejo/) for example. It feels like a new-old spin on the concept of hosting providers that I've only seen with [SDF](https://sdf.org) so far, but I really like it. Their [blog](https://blog.uberspace.de) (German) is interesting too, recently they have started to straight-up [block AI scraping bots](https://blog.uberspace.de/2024/08/bad-robots/), they post details about their [CentOS to Arch migration](https://blog.uberspace.de/2024/07/ein-mirror-fuer-u8/), and their [docs on network namespaces](https://manual.uberspace.de/background-network/) have given me a lot of new ideas for my own servers.

## deSEC

Back to the e.V.: I was hosting my DNS with Hetzner so far. Why? Simple reason, they did offer a nice API, they had no rate limits, they were free and reliable enough. They also are German, but they are not a non-profit and not exactly small. Also, big problem, no DNSSEC support. [At all](https://docs.hetzner.com/dns-console/dns/general/dnssec/#dnssec-and-hetzner-online). I wanted to host my DNS with Uberspace, but sadly they do not offer DNS hosting. So I was looking around for some alternatives and found [deSEC](https://desec.io). They also [are an e.V.](https://desec.io/about) *and* offer DNSSEC. The only issue is them offering only to host one (1) zone per default, but you can get that number increased if you ask nicely.

<blockquote class="mastodon-embed" data-embed-url="https://toot.kif.rocks/@ruhrscholz/112982934926687929/embed" style="background: #FCF8FF; border-radius: 8px; border: 1px solid #C9C4DA; margin: 0; max-width: 540px; min-width: 270px; overflow: hidden; padding: 0;"> <a href="https://toot.kif.rocks/@ruhrscholz/112982934926687929" target="_blank" style="align-items: center; color: #1C1A25; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Roboto, sans-serif; font-size: 14px; justify-content: center; letter-spacing: 0.25px; line-height: 20px; padding: 24px; text-decoration: none;"> <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" viewBox="0 0 79 75"><path d="M74.7135 16.6043C73.6199 8.54587 66.5351 2.19527 58.1366 0.964691C56.7196 0.756754 51.351 0 38.9148 0H38.822C26.3824 0 23.7135 0.756754 22.2966 0.964691C14.1319 2.16118 6.67571 7.86752 4.86669 16.0214C3.99657 20.0369 3.90371 24.4888 4.06535 28.5726C4.29578 34.4289 4.34049 40.275 4.877 46.1075C5.24791 49.9817 5.89495 53.8251 6.81328 57.6088C8.53288 64.5968 15.4938 70.4122 22.3138 72.7848C29.6155 75.259 37.468 75.6697 44.9919 73.971C45.8196 73.7801 46.6381 73.5586 47.4475 73.3063C49.2737 72.7302 51.4164 72.086 52.9915 70.9542C53.0131 70.9384 53.0308 70.9178 53.0433 70.8942C53.0558 70.8706 53.0628 70.8445 53.0637 70.8179V65.1661C53.0634 65.1412 53.0574 65.1167 53.0462 65.0944C53.035 65.0721 53.0189 65.0525 52.9992 65.0371C52.9794 65.0218 52.9564 65.011 52.9318 65.0056C52.9073 65.0002 52.8819 65.0003 52.8574 65.0059C48.0369 66.1472 43.0971 66.7193 38.141 66.7103C29.6118 66.7103 27.3178 62.6981 26.6609 61.0278C26.1329 59.5842 25.7976 58.0784 25.6636 56.5486C25.6622 56.5229 25.667 56.4973 25.6775 56.4738C25.688 56.4502 25.7039 56.4295 25.724 56.4132C25.7441 56.397 25.7678 56.3856 25.7931 56.3801C25.8185 56.3746 25.8448 56.3751 25.8699 56.3816C30.6101 57.5151 35.4693 58.0873 40.3455 58.086C41.5183 58.086 42.6876 58.086 43.8604 58.0553C48.7647 57.919 53.9339 57.6701 58.7591 56.7361C58.8794 56.7123 58.9998 56.6918 59.103 56.6611C66.7139 55.2124 73.9569 50.665 74.6929 39.1501C74.7204 38.6967 74.7892 34.4016 74.7892 33.9312C74.7926 32.3325 75.3085 22.5901 74.7135 16.6043ZM62.9996 45.3371H54.9966V25.9069C54.9966 21.8163 53.277 19.7302 49.7793 19.7302C45.9343 19.7302 44.0083 22.1981 44.0083 27.0727V37.7082H36.0534V27.0727C36.0534 22.1981 34.124 19.7302 30.279 19.7302C26.8019 19.7302 25.0651 21.8163 25.0617 25.9069V45.3371H17.0656V25.3172C17.0656 21.2266 18.1191 17.9769 20.2262 15.568C22.3998 13.1648 25.2509 11.9308 28.7898 11.9308C32.8859 11.9308 35.9812 13.492 38.0447 16.6111L40.036 19.9245L42.0308 16.6111C44.0943 13.492 47.1896 11.9308 51.2788 11.9308C54.8143 11.9308 57.6654 13.1648 59.8459 15.568C61.9529 17.9746 63.0065 21.2243 63.0065 25.3172L62.9996 45.3371Z" fill="currentColor"/></svg> <div style="color: #787588; margin-top: 16px;">Post by @ruhrscholz@kif.rocks</div> <div style="font-weight: 500;">View on Mastodon</div> </a> </blockquote> <script data-allowed-prefixes="https://toot.kif.rocks/" async src="https://toot.kif.rocks/embed.js"></script>

I was just in the process of migrating there when we started [Project Servfail](https://beta.servfail.network), but more on that in another post.

## Not limited to Germany

Of course the concept of an e.V., or a non-profit organization is not limited to Germany. There are many providers out there, and if you are interested in moving away from Big Tech (you should), I recommend you check out [European alternatives](https://european-alternatives.eu), as this is where I found most of them.

Have you had any experience, good or bad, with moving to a smaller, more local hosting provider? If so, tell me in the replies to this post:

<blockquote class="mastodon-embed" data-embed-url="https://toot.kif.rocks/@ruhrscholz/112983462540568791/embed" style="background: #FCF8FF; border-radius: 8px; border: 1px solid #C9C4DA; margin: 0; max-width: 540px; min-width: 270px; overflow: hidden; padding: 0;"> <a href="https://toot.kif.rocks/@ruhrscholz/112983462540568791" target="_blank" style="align-items: center; color: #1C1A25; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Roboto, sans-serif; font-size: 14px; justify-content: center; letter-spacing: 0.25px; line-height: 20px; padding: 24px; text-decoration: none;"> <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" viewBox="0 0 79 75"><path d="M74.7135 16.6043C73.6199 8.54587 66.5351 2.19527 58.1366 0.964691C56.7196 0.756754 51.351 0 38.9148 0H38.822C26.3824 0 23.7135 0.756754 22.2966 0.964691C14.1319 2.16118 6.67571 7.86752 4.86669 16.0214C3.99657 20.0369 3.90371 24.4888 4.06535 28.5726C4.29578 34.4289 4.34049 40.275 4.877 46.1075C5.24791 49.9817 5.89495 53.8251 6.81328 57.6088C8.53288 64.5968 15.4938 70.4122 22.3138 72.7848C29.6155 75.259 37.468 75.6697 44.9919 73.971C45.8196 73.7801 46.6381 73.5586 47.4475 73.3063C49.2737 72.7302 51.4164 72.086 52.9915 70.9542C53.0131 70.9384 53.0308 70.9178 53.0433 70.8942C53.0558 70.8706 53.0628 70.8445 53.0637 70.8179V65.1661C53.0634 65.1412 53.0574 65.1167 53.0462 65.0944C53.035 65.0721 53.0189 65.0525 52.9992 65.0371C52.9794 65.0218 52.9564 65.011 52.9318 65.0056C52.9073 65.0002 52.8819 65.0003 52.8574 65.0059C48.0369 66.1472 43.0971 66.7193 38.141 66.7103C29.6118 66.7103 27.3178 62.6981 26.6609 61.0278C26.1329 59.5842 25.7976 58.0784 25.6636 56.5486C25.6622 56.5229 25.667 56.4973 25.6775 56.4738C25.688 56.4502 25.7039 56.4295 25.724 56.4132C25.7441 56.397 25.7678 56.3856 25.7931 56.3801C25.8185 56.3746 25.8448 56.3751 25.8699 56.3816C30.6101 57.5151 35.4693 58.0873 40.3455 58.086C41.5183 58.086 42.6876 58.086 43.8604 58.0553C48.7647 57.919 53.9339 57.6701 58.7591 56.7361C58.8794 56.7123 58.9998 56.6918 59.103 56.6611C66.7139 55.2124 73.9569 50.665 74.6929 39.1501C74.7204 38.6967 74.7892 34.4016 74.7892 33.9312C74.7926 32.3325 75.3085 22.5901 74.7135 16.6043ZM62.9996 45.3371H54.9966V25.9069C54.9966 21.8163 53.277 19.7302 49.7793 19.7302C45.9343 19.7302 44.0083 22.1981 44.0083 27.0727V37.7082H36.0534V27.0727C36.0534 22.1981 34.124 19.7302 30.279 19.7302C26.8019 19.7302 25.0651 21.8163 25.0617 25.9069V45.3371H17.0656V25.3172C17.0656 21.2266 18.1191 17.9769 20.2262 15.568C22.3998 13.1648 25.2509 11.9308 28.7898 11.9308C32.8859 11.9308 35.9812 13.492 38.0447 16.6111L40.036 19.9245L42.0308 16.6111C44.0943 13.492 47.1896 11.9308 51.2788 11.9308C54.8143 11.9308 57.6654 13.1648 59.8459 15.568C61.9529 17.9746 63.0065 21.2243 63.0065 25.3172L62.9996 45.3371Z" fill="currentColor"/></svg> <div style="color: #787588; margin-top: 16px;">Post by @ruhrscholz@kif.rocks</div> <div style="font-weight: 500;">View on Mastodon</div> </a> </blockquote> <script data-allowed-prefixes="https://toot.kif.rocks/" async src="https://toot.kif.rocks/embed.js"></script>

PS: I forgot an e.V. I'm using for a long time: The [Förderverein der KIF e.V.](https://wiki.kif.rocks/wiki/Verein:Hauptseite) that I use for my Mastodon and Matrix accounts on [kif.rocks](http://kif.rocks). I guess past me was on the right track all those years ago.