---
date: "2023-07-23"
title: "Homelab v5: Going Down The Stack"
draft: true
---

<iframe src="https://toot.kif.rocks/@ruhrscholz/110748487026100881/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://toot.kif.rocks/embed.js" async="async"></script>

## The Old Setup

To properly appreciate the upcoming network shenanigans I'll have to give you a bit of context on my current setup first. You see, there is a server VLAN at home where everything is hosted, using normal, local IPv4 addresses. Traffic comes in via a Hetzner VPS which runs a reverse Proxy (Caddy), that reverse proxy talks to the local network via a WireGuard VPN between VPs and my router. The reasoning behind an ingress VPS was 1. so I don't have to deal with dynDNS and 2. so I don't leak my private IPs that easily. So far so good.

## Why

My network annoyed me. As it always does.

At first I wanted to access my Nextcloud from my home network. That required me to set up an additional ingress node in my local network, because otherwise all the traffic would go to the Hetzner DC and back. Which is definetly slower than my in-home Gigabit. So I did that. Then I rememberd that that local ingress node needed certificates to function. Caddy supports the ACME HTTP-01 without issues, *but* that requires the ingress to be publicly reachable which - given that it sits in my local network only -- it is not. Thus I had to set up API access for my domains, which required me to move to a better DNS hoster, it was a whole ordeal.

Also, to make all of this locally reachable I had to set up local DNS as well, so that the requests actually arrive at the local ingress.

After that, I wanted to add a service. I believe it was Tautulli. So I had to go through the whole setup again, public DNS, local DNS, public ingress, local ingress, a pain overall.

So I decided to move all problems down the OSI stack which actually solves a lot of things. After all, why use DNS to handle different routing when there is, well, routing.

But where do I get all the IPv4 addresses for that? Do I need a HTTP reverse proxy again? No. Just use IPv6. I wanted to lean on IPv6 more after all, and that felt like the perfect opportunity.

## The Plan

Re-Do the network. Completely. Again. But with publicly routebale IPv6 addresses for each and every service. I sadly only get assigned a dynamic IPv6 prefix from my ISP (because Germany), but I got another place where I can get IPv6 from: Hetzner (or any other VPS provider but I already have an account there). An additional advantage of that option was that I 1. don't leak my local addresses (as before), and 2. that I have full control over reverse DNS entries. I already used the VPS as ingress proxy, and it already had a WireGuard connection to my local network. The ideal starting point. Apart from that, I stumbled upon a really great blog article related to all of that, I'll link it later. That was enough of a plan for me to start tearing down the old setup and to get to work. 

I'll spare you some parts of the journey but rather explain the end result and the decisions behind it.

### Example - IPv6

Let's build a mental image of how a requests to one of my services (say Nextcloud) would actually reach my Nextcloud server. $USER1 types `nextcloud.merlins.domain` into their browser. In a perfect world this resolves via `AAAA` record to `2a01:4f8:xxxx:xxxx:1::7`, where `2a01:4f8::/32` is Hetzner's prefix and `2a01:4f8:xxxx:xxxx::/64` is the prefix Hetzner assigned to my VPS. Now for the fun part. While the whole `/64` gets forwarded to my VPS, it actually listens only on `2a01:4f8:xxxx:xxxx::1/128`. For all other packets that arrive, it just acts as a router (simple enable routing in Linux via `sysctl -w net.ipv4.ip_forward=1` and/or `sysctl -w net.ipv6.conf.all.forwarding=1`).

Flashback to the WireGuard tunnel between VPS and my home network. In WireGuard, you can specify which IP ranges shall be routed through the interface. My config looks like this:

```ini
[Interface]
PrivateKey = HAHALOLNO1
Address = 169.254.1.1/32, fe80::1/128
ListenPort = 51820

[Peer]
PublicKey = HAHALOLNO2
AllowedIPs = 10.255.0.0/16, 2a01:4f8:xxxx:xxxx:1::/80
```

Ignore the IPv4 stuff, we'll get to that later. For the connection between the two WireGuard instances we just use lonk-local addresses, because that's what they're there for. Not however the IPv6 addresses, `2a01:4f8:xxxx:xxxx:1::/80` is the subnet I chose to use for my servers at home. That leaves me with a maximum of `2^(128-80) = 281 474 976 710 656` servers (per location) -- should be enough for now. Also, this way I can use `2a01:4f8:xxxx:xxxx:2::/80`, `2a01:4f8:xxxx:xxxx:3::/80` and so on for other "DCs", i.e. a friend's house or something.

Back to the packet, Linux sees it arriving, and just pushes it into the WireGuard tunnel, to eventually reach my local Router. From there on it get routed as normal to the Nextcloud VPS which has `2a01:4f8:xxxx:xxxx:1::7` as its IP address. Nextcloud does whatever slow PHP and bad decisions do and eventually produces a new IP packet with the IPv6 address of $USER1 as its destination. The local router (MikroTik RouteOS in my case) has a firewall rule, that marks any packets coming from the server VLAN (and not desitined for my private home VLAN) with a special routing mark. 

```console
[admin@cr1.merlins.domain] > /ipv6/firewall/mangle/print 
Flags: X - disabled, I - invalid; D - dynamic 
 0    chain=prerouting action=mark-routing new-routing-mark=extip1_rt passthrough=no src-address=2a01:4f8:xxxx:xxxx:1::/80 dst-address=!2001:14f4::/32 log=no log-prefix="" 
```

From there on, a different routing table is being used that routes any packets with that specific routing mark back through the VPS.

```console
[admin@cr1.merlins.domain] > /ipv6/route/print detail where dst-address=::/0 
Flags: D - dynamic; X - disabled, I - inactive, A - active; 
c - connect, s - static, r - rip, b - bgp, o - ospf, d - dhcp, v - vpn, m - modem, g - slaac, y - bgp-mpls-vpn; H - hw-offloaded; + - ecmp 
   DAd + dst-address=::/0 routing-table=main gateway=fe80::3a10:d5ff:feb2:71b8%wan1 immediate-gw=fe80::3a10:d5ff:feb2:71b8%wan1 distance=1 scope=30 target-scope=10 
         vrf-interface=wan1 

 0  As   dst-address=::/0 routing-table=extip1_rt gateway=fe80::1%extip1_wg immediate-gw=fe80::1%extip1_wg distance=20 scope=30 target-scope=10
```

Note the different routing tables, and the `fe80::1` link-local address (the VPS).

The packet goes the whole way back through the tunnel, through Hetzner, adding about 30-35ms of RTT overall, and eventually ends up at whoever wanted to visit Nextcloud. Happy end. 

### Example - IPv4

The world, however, isn't perfect, and thus there are people who only have IPv4 addresses. For example me when I have to use eduroam. This imaginary $USER2 now tries to get some cat photos off of Nextcloud. The DNS A record resolves to the public IPv4 address of my VPS.

This is where the magic happens. I don't know what I searched back then but I stumbled upon a great blog, through a great article: [How I'm Using SNI Proxying and IPv6 to Share Port 443 Between Webapps](https://www.agwa.name/blog/post/using_sni_proxying_and_ipv6_to_share_port_443) by Andrew Ayer. In there, he presents his great tool [snid](https://github.com/AGWA/snid). I couldn't believe it when I read the article and the tool description, but it solves all my problems in the most elegant way. You can read his whole article, I highly recommend it, but in short, the tool listens on IPv4 on ports you specify (443 for example), checks the TLS SNI extension, does a AAAA DNS request and forwards the whole TLS stream to its new destination.

## Advantages

### ACME

### DNS

### Adding services

### Security

### Tunnel everything TLS

## Pitfall 1: Need For IPv4

## Pitfall 2: Local Routing

## Hardware updates