# IPv6, dynamic prefixes, and MikroTik: The proper way

> Published on Feb 1, 2023

This is an update to [IPv6, FRITZ!Box, and MikroTik](https://scholz.ruhr/blog/ipv6-fritzbox-and-mikrotik/).

I finally figured everything[^1] out.

[^1]: Not quite everything, DNS advertisement on RouterOS is still wonky

TL;DR: SLAAC.

Long version:

A quick flashback to the last post where I was annoyed that I "couldn't" use static IPv6 addresses for my homelab, since a new IPv6 prefix from my ISP would break all DNS records. Not anymore! I finally managed to read enough IPv6 documentation to figure out the proper way.

A reminder as to what the initial setup is: German ISP[^2], connected to FRITZ!Box, connected to RouterOS device (MikroTik RB4011 in my case), connected the rest of the homelab, including multiple subnets. The temporary setup I used in the past months abused Unique Local Addressing (ULA) (starting with fd35:... in the following paragraphs) in the lab to keep devices accessible with DNS and NATted them in such a way that any requests would appear as if they were coming from the MikroTik router itself. So basically your typical IPv4 setup. I implemented IPv4 in IPv6. Bad.

[^2]: This is important as they change their IPv6 prefixes every few days

The goal however was to assign the ISP-given prefix (/56 given, /57 forwarded to the MikroTik router, see last post) to the devices while having them use a ULA at the same time.

All of this works without the FRITZ!Box router in the middle.

Let's skip the few months of me reading every possible RFC under the sun, ranting on Mastodon, and breaking stuff. Things that didn't work were:
- NPTv6 (RouterOS doesn't support it and it would not have been pretty anyway)
- NAT66 (same as NPTv6)

I knew that IPv6 was made to use multiple addresses on any given interface (at least the link-local fe80:... and the Global Unicast Address from 2000::/3). So my next idea was to assign both of them via DHCPv6. Spoiler: This didn't work either, firstly because it just isn't meant to do that, secondly because RouterOS DHCPv6 can only hand out prefixes anyway.

The moment that changed everything was when I finally figured out what SLAAC is or does thanks to [this article by study-ccna.com](https://study-ccna.com/ipv6-slaac-stateless-address-autoconfiguration/). I highly recommend you read it if you don't know about how exactly SLAAC works. But the gist of it is that a newly-connected device asks any routers on it's network (via Router Solicitation over the link local address) for Router Advertisements. These advertisements in turn contain the prefixes that the client can and will use from that point on. Note that I wrote "prefixes": Plural!

And where to those prefixes come from? (At least on RouterOS) they're just the addresses configured on the interface the client connects to.[^3]

[^3]: You can configure more manually, but we don't need to do that

The solution to all of our problems: Give every LAN-side interface on the MikroTik router two addresses: One out of the prefix pool you get from upstream (the 2000::/3 address), and one out of your ULA (fd35::...). On RouterOS, remember to check the "Advertise" checkbox to add them to the Router Advertisements, and "EUI64" so that they're generated in the same way in which they would if you were using SLAAC.

Here is how it looks on my machine (albeit redacted):

```
[admin@router.infra.scholzserv.de] > /ipv6/dhcp-client/print
Columns: INTERFACE, STATUS, REQUEST, PREFIX, ADDRESS
# INTERFACE  STATUS  REQUEST  PREFIX                          ADDRESS
0 wan1       bound   address  2001:reda:cted:d80::/57, 1h49m5s  2001:reda:cted:d00:4a8f:5aff:fe82:a87d, 1h49m5s
                     prefix
[admin@router.infra.scholzserv.de] > /ipv6/address/print
Flags: I, D - DYNAMIC; G, L - LINK-LOCAL
Columns: ADDRESS, FROM-POOL, INTERFACE, ADVERTISE
 #    ADDRESS                                   FROM-POOL  INTERFACE      ADVERTISE
 2 DL fe80::4a8f:5aff:fe82:a886/64                         dmz            no
 3 DL fe80::4a8f:5aff:fe82:a886/64                         network        no
 4 DL fe80::4a8f:5aff:fe82:a886/64                         oobm           no
 5 DL fe80::4a8f:5aff:fe82:a886/64                         server         no
 6 DL fe80::4a8f:5aff:fe82:a886/64                         bridge         no
 7 DL fe80::4a8f:5aff:fe82:a886/64                         client         no
 8 DL fe80::4a8f:5aff:fe82:a87d/64                         wan1           no
 9  G fd35:f965:28de:1:4a8f:5aff:fe82:a886/64              client         yes
10  G fd35:f965:28de:0:4a8f:5aff:fe82:a886/64              network        yes
11  G fd35:f965:28de:4:4a8f:5aff:fe82:a886/64              dmz            yes
12  G fd35:f965:28de:3:4a8f:5aff:fe82:a886/64              oobm           yes
13  G fd35:f965:28de:2:4a8f:5aff:fe82:a886/64              server         yes
14  G 2001:reda:cted:d86:4a8f:5aff:fe82:a886/64   wan1       client         yes
15  G 2001:reda:cted:d87:4a8f:5aff:fe82:a886/64   wan1       server         yes
16  G 2001:reda:cted:d82:4a8f:5aff:fe82:a886/64   wan1       dmz            yes
17  G 2001:reda:cted:d83:4a8f:5aff:fe82:a886/64   wan1       network        yes
18  G 2001:reda:cted:d84:4a8f:5aff:fe82:a886/64   wan1       oobm           yes
21 DG 2001:reda:cted:d00:4a8f:5aff:fe82:a87d/128             wan1           no
[admin@router.infra.scholzserv.de] > /ipv6/nd/prefix/print
Flags: X - disabled, I - invalid; D - dynamic
 0  D prefix=fd35:f965:28de:1::/64 6to4-interface=none interface=client on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 1  D prefix=fd35:f965:28de::/64 6to4-interface=none interface=network on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 2  D prefix=fd35:f965:28de:4::/64 6to4-interface=none interface=dmz on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 3  D prefix=fd35:f965:28de:3::/64 6to4-interface=none interface=oobm on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 4  D prefix=fd35:f965:28de:2::/64 6to4-interface=none interface=server on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 5  D prefix=2001:reda:cted:d86::/64 6to4-interface=none interface=client on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 6  D prefix=2001:reda:cted:d87::/64 6to4-interface=none interface=server on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 7  D prefix=2001:reda:cted:d82::/64 6to4-interface=none interface=dmz on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 8  D prefix=2001:reda:cted:d83::/64 6to4-interface=none interface=network on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w

 9  D prefix=2001:reda:cted:d84::/64 6to4-interface=none interface=oobm on-link=yes autonomous=yes valid-lifetime=4w2d preferred-lifetime=1w
```

## DNS

The great thing about this setup is that everything is stateless. This includes the ULA addresses, so we can even set up DNS: Every host's IPv6 address is a combination of the ULA prefix for that given subnet and its MAC address. You can simply read it out and throw it in your DNS server.

But: MikroTik has a terrible implementation for Router Advertisements with DNS. While it is possible to have them hand out DNS addresses (`/ipv6/nd`, field `advertise-dns`), you cannot configure those. It will always use the upstream DNS addresses configured in `/ip/dns`. This is the *worst* possible implementation as it essentially works fine, but skips everything you manually configures in your router's DNS server. It also skips caching. Some forum posts suggest creating a DHCPv6 server that only advertises DNS servers, but I couldn't get this to work on modern RouterOS. My solution is that I'm running a separate local DNS server anyways, which is configured in the MikroTik router, so it actually hands out the proper DNS server (even without DHCPv6). Another solution would be configuring the DNS manually in every client (which it seems isn't possible with some devices like Apple TVs, at least not for IPv6), but that's a lot of work.

Well, apart from strange DNS everything seems to work for now, I even disabled IPv4 completely to test if everything works fine and it did. For now.
