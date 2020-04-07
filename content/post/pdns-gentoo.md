---
title: "A proper DNS setup (on Gentoo)"
date: 2020-04-07T17:43:54+01:00
draft: true
images: ["signpost.jpg"]
tags: ["networking", "linux"]
summary: "It's time to redo the mess that I call my DNS setup."
---

Since we all are quarantined and all of my deadlines have finally passed, I took some time to redo my DNS setup. Up until now it consisted of a few static host mappings on an Edgerouter X, which used the OpenDNS servers as a recursor. This worked, but it wasn't pretty, so let's start over! My main requirements are:
* Stable (duh)
* Small footprint (limited memory on my VM host)
* Web interface

## DNS Server Software

For a normal authorative DNS server and recursor there are a couple of Unix solutions out there, mainly BIND, PowerDNS and dnsmasq... So, which one to pick?

The only one with a (healty web interface)[https://github.com/PowerDNS/pdns/wiki/WebFrontends] ecosystem seems to be PowerDNS, so let's use that.

## Why Gentoo?

Why not? One of the goals of this blog is to combine software that usually isn't used together: Like Gentoo and PowerDNS. A normal person would just run a DNS server on Debian, CentOS or something similar, but there are enough writeups about this setup out there already. Also, Gentoo uses openrc and comes with only the packages you install, so it has a tiny memory footprint (although at installation time it's pretty CPU hungry).

## Getting Started