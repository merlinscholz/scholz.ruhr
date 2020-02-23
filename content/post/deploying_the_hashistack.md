---
title: "Deploying the Hashistack (Part 1)"

date: 2020-02-23T15:59:14+01:00
draft: true
tags: ["containers", "homelab", "hashistack"]
image: "/containers.jpg"
summary: "Or: How to deploy Hashicorp Nomad and Consul onto a 3+3 cluster."
---

> Cover image by [distelAPPArath](https://pixabay.com/users/distelapparath-2726923/) from [Pixabay](https://pixabay.com/)

This is just a quick writeup on how I deployed two thirds of the Hashistack, consisting of Hashicorp [Nomad](https://nomadproject.io/) and [Consul](https://www.consul.io/). In Part 2 I'll hopefully get some edge routing software like traefik or nginx to work.

## Overview

Since this was only to test a Hashistack cluster, everything runs as a VM on a single host. On this host, six VMs are being deployed: Three Nomad/Consul master VMs plus three Nomad/Consul clients. This does not necessarily follow the best practices, but it works well enough.

## Hosts and Networking

The six VMs are deployed as follows:

| Hostname | IP | Role |
| :-- | :-- | :-- |
| `hashi-m01.example.tld` | `192.168.10.20` | Nomad Server; Consul Server |
| `hashi-m02.example.tld` | `192.168.10.21` | Nomad Server; Consul Server |
| `hashi-m03.example.tld` | `192.168.10.22` | Nomad Server; Consul Server |
| `hashi-c01.example.tld` | `192.168.10.30` | Nomad Client; Consul Client |
| `hashi-c02.example.tld` | `192.168.10.31` | Nomad Client; Consul Client |
| `hashi-c03.example.tld` | `192.168.10.32` | Nomad Client; Consul Client |

Also, there is a router and a DNS server on `192.168.10.1` with all those hosts added to it.