---
date: "2022-09-02"
title: "IPv6, FRITZ!Box, and MikroTik"
---

Today I took the time to finally configure IPv6 in my lab network. Sounds easy, right? Wrong. Very wrong. 

See, my lab network uses a MikroTik RB4011 behind a FRTZ!Box 7490. The FRITZ!Box is used as modem and for the "normal" home networking stuff like Smartphones, Smart TVs, ...

Thanks to the default settings, the normal home network already uses IPv6, but I wanted to enanle it in my lab (which has its own WiFi, and which my workstation is connected to) too.

After *a lot* of trial and error, here are some of the most important puzzle pieces; you'll have to put the puzzle together yourself:

1. (Almost) every German ISP assigns you only a dynamic prefix, in my case a /56 prefix. This will be a problem later on. I wanted to leave the first /57 for the "normal" network and delegate the second /57 to the MikroTik.
2. MikroTik has IPv6 disabled by default. Uncheck IPv6 > Settings > Disable IPv6
3. The FRITZ!Box only uses a /64 subnet (usually the first) for the home network. We cannot get our desired /57 out of a /64. To circumvent this, AVM has created an option for other routers to exist in the network. On your FRITZ!Box' web interface, navigate to Heimnetz > Netzwerk > Netzwerkeinstellungen > IP-Adressen > IPv6-Einstellungen. There should be an option called "Auch IPv6-Präfixe zulassen, die andere IPv6-Router im Heimnetz bekanntgeben". Enable that and save your settings.
4. In theory we should be able to assign a new /64 on the MikroTik and use that now. But we've already decided that a /64 is too small and we much rather want a /57. MikroTik cannot advertise those (to the FRITZ!Box), so how do we tell the FRITZ!Box about the /57 we want to use? Let the MikroTik act as a DHCPv6 client. On the lab router, we create a DHCPv6-client and make it request a /57 subnet from our FRITZ!Box.
5. Routes. You may have to set up routes in case the MikroTik DHCP client doesn't do it itself. The destination address is 2000::/3 and you can get the gateway from your IPv6 neighbourhood list. That menu was somewhat broken on my RB4011, so I had to configure it from the terminal.
6. Don't forget to add some DHCPv6-Servers for your clients. You should now be able to connect and visit some test sites like https://ipv6-test.com/ or https://ipv6test.google.com/ to verify everything's working.

## Caveats
* If we want to expose some services over IPv6, we will have to enable the FRITZ!Box' "Exposed Host" option. Otherwise, the addresses in our new /57 subnet are not routable from the outside.
* ~~If you set up your lab devices with somewhat static IPv6 address prefixes (even over the MikroTik DHCP), those will break as soon as your ISP changes your prefix. Mine doesn't do that (UPDATE: Mine did do that, it just took a while), but I don't know about yours. One solution to that problems is for the MikroTik to hand out IPv6-prefixes from the /57 pool is got from the FRITZ!Box (like described here: https://www.sidorenko.io/post/2016/12/ipv6-with-prefix-delegation-routeros-and-fritzbox/), but then you won't have purely static addresses for your clients and DNS will be a living hell (it is). One other solution would be to only assign private (as in fd00::/8) addresses to all clients and let the router route them, which isn't as pretty either. So, unless your ISP gives you a completely static prefix, and you switch away from FRITZ!Boxes (which are the best consumer router/modems on the market), a nested lab network with IPv6 is far from perfect. I will probably make some NAT and fd00::/8 magic to get things working in the future.~~

## Update

Ignore the above, I was dumb and fixed everything the proper way, the update is here: [IPv6, dynamic prefixes, and MikroTik: The proper way](https://scholz.ruhr/blog/ipv6-dynamix-prefixes-and-mikrotik-the-proper-way/).
