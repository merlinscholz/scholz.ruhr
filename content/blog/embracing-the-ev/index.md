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

<iframe src="https://toot.kif.rocks/@ruhrscholz/112982934926687929/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://toot.kif.rocks/embed.js" async="async"></script>

I was just in the process of migrating there when we started [Project Servfail](https://beta.servfail.network), but more on that in another post.

## Not limited to Germany

Of course the concept of an e.V., or a non-profit organization is not limited to Germany. There are many providers out there, and if you are interested in moving away from Big Tech (you should), I recommend you check out [European alternatives](https://european-alternatives.eu), as this is where I found most of them.

Have you had any experience, good or bad, with moving to a smaller, more local hosting provider? If so, tell me in the replies to this post:

<iframe src="https://toot.kif.rocks/@ruhrscholz/112983462540568791/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://toot.kif.rocks/embed.js" async="async"></script>