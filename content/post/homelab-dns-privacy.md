---
title: "Just block port 53 in your firewall"
date: 2020-08-07T00:57:54+01:00
draft: false
summary: "I recently just blocked port 53 in my firewall to improve the privacy in my home network"
asciinema: true
---

- After a long time postponing various projects and not doing anything proper with my homelab, I decided that most things I would want to do depend on a proper DNS setup.
- I, probably caring way too much about privacy, have read some superficial articles about DNS-over-TLS or DNS-over-HTTPS in the past, but never really used it.

So, let's combine those two thoughts and do it right (hopefully).

{{< tweet 1291515805293858817 >}}

Since DNS is old [citation needed], and nobody really cared about security back in those dark ages, it can easily be read by third parties. Those third parties do not have to have bad intentions, one of the more common example would be your ISP checking up on what websites you are visiting.

There have been many attempts to solve this problem, but it seems like DNS-over-HTTPS (DOH for short) is being used the most. If you want a short introduction on why it is useful, and DNS in general, check out [Mozilla's blogs/comics](https://hacks.mozilla.org/2018/05/a-cartoon-intro-to-dns-over-https/) on this topic.

## How to get your devices to use DOH

Not every device you are using necessarily supports DOH. By default, there are very few operating systems, embedded systems, browsers, etc. that actually use it, most of them cannot even be reconfigured to use DOH.

The solution? Just run your own internal DNS server that forwards your request to a "proper" DOH server. That way, the only raw DNS requests never leave your home network and can not be intercepted.

Bonus point: You can deploy DNS-level ad-blocking and add custom DNS overrides.

## Running a local DNS server

There are many ways to run your own DNS servers. From raw servers like PowerDNS, Bind9, to more accessible ones like [Pi-Hole](https://github.com/pi-hole/pi-hole) or [Adguard Home](https://github.com/AdguardTeam/AdGuardHome). I've chosen the latter since it offers very easy installation and a very sleek web interface.

All you have to do is to spin up a virtual machine (or server, or Raspberry Pi, ...), assign a static IP address to it, and run the Adguard binary:

```bash
wget https://static.adguard.com/adguardhome/release/AdGuardHome_linux_amd64.tar.gz
tar xvf AdGuardHome_linux_amd64.tar.gz
sudo ./AdGuardHome -s install
```

That's it! Now you can access the web UI with your browser, and configure the more nuanced settings, maybe even enable ad blocking. 

![Adguard Home Dashboard](/images/adguard.png)

## Getting the devices to use this resolver

But how do we actually enforce devices to use this newly-created, internal DNS server?

Most clients only require you to change the DNS server addresses in your DHCP server's settings. If you manually assign IP adresses to your clients, you will have to change the resolver on every single one of them.

## Rogue devices

There will always be clients that can ignore your DNS settings, or maybe you just forgot to change a single device? Why not just block port 53 in your firewall? I did this recently, and shot myself in the foot, because I forgot that the internal DNS resolver needs a non-DOH upstream resolver to get the actual IP addresses of the DOH servers.

{{<tweet 1291516736924266498 >}}

In theory you could hardcode those into the ```hosts```-file, I just opted to allow outgoing port 53-requests coming from my internal resolver.

## Annoyances

Not everything works perfectly. I've encountered two things, that are not really problems, but annoyances.

Firstly, this setup does not block the default Google DOH server which are set up in some Android phones. The DHCP-issued DNS resolver should, in theory, override that settings, but with Googles addiction to tracking you can never be sure.

Secondly, while Adguard Home is a great project, I wish it would offer more granular DNS overrides. At this moment you can deploy ```A```, ```AAAA``` and ```CNAME```-records. This is more than enough for the average user, but I would like to have fun with ```ALIAS```, ```TXT```, ```NS``` and such things. I could add another layer of DNS server in front of this, maybe running PowerDNS, but this is a story for a different day.

___

Any notes, additions, experiences? Leave a comment on the HN post: https://news.ycombinator.com/item?id=24076988