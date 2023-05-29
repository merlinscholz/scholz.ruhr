# Recovering from a broken MikroTik configuration

> Published on Feb 26, 2022

Imagine you're laying in bed, watching Netflix, scrolling through Twitter at 3 am, when you see someone tweet about a new MikroTik update, 7.1.3 just came out. The changelogs say nothing major or relevant to you changed so you quickly pull up your routers web interface on your phone and press the "Download & Install button", expecting the update from 7.1.2 to 7.1.3 to go smoothly. You wait a minute for Netflix to work again, but it still is buffering. You get nervous and notice your phone is not connected to any WiFi, is just says "Connection attempt failed". Netflix still doesn't load. **Time to panic.**

Half asleep you walk over to your desk, boot up your computer, just to notice that wired internet does not work either. It is not 3:20 am and you can't go to sleep because your Philips Hue lights require WiFi to turn off. Also, you just want to fix this. After all, it is your network and you are the only one allowed to break it, not some firmware update.

You get your ThinkPad and connect to every port of the router, using all possible IP addresses for every port. No luck. In the corner of your eye you notice the serial cable dangling from the switch above the misbehaving router. Does the RB4011 even have a serial port? Not on the front. You fumble in between some cables in the back and notice an RJ45-sized hole next to the power cord. After trying all of the Baud setting you settle on 152000 and some quick status checks yield the following (excuse the photo):

![5hQZ3uKRP.jpg](https://mataroa.blog/images/417c793d.jpeg)

The log doesn't say anything interesting as the device has been rebooted, neither does the interface list. The IP addresses however reveal an issue: 192.168.0.130 should be the WAN network on ether1, everything else should be VLANs. Instead, some addresses don't even have an interface assigned. However, you got lucky. The WAN interface somehow got the IP of your internal network. You plug in the ThinkPad into ether1, open WinBox and hope for the best. WinBox' MAC mode has not worked so far, so this is your only chance to get a GUI.

It successfully connects! Checking all of your setting, interfaces, bridges, VLANs, firewall rules, you come to the conclusion that the update somehow deleted the main bridge0, and thus the attached VLANs (except for home somehow?) and reassigned everything else, seemingly randomly. 

Painstakingly, at now almost 4 am you recreate all the VLANs, bridges, interfaces, since the last backup you have it slightly too old to be useful. You learn from your mistake. After all interfaces are set up again (except for the one you are working on), you connect your phone and try to access a server IDRAC just to check the routing. It does not work. Damn.

You decide it is better to first fix the interface you are working on to actually be the WAN interface again and switch the LAN ports on the router back so that ether1 is WAN and you are working from ether10 assigned to home.

The issue persists, you can access the router from all networks, you can ping all devices from your router, you just cannot cross the router to access other networks (or the internet for that matter).

After consulting via some friends over your phones network you go through all possible faults: 

Firewall? An "allow all" rule does not fix it. Bummer.

Routing? All routes are set correctly.

NAT? No, since NAT is only enabled for connections going out of WAN.

4:30 am and you seriously consider starting from scratch. You try to ping some more when you finally notice it: "Error from 10.0.10.10: No route from host". Did you spot it? If it really was the router blocking things it would say "Error from 10.0.10.1: No route from host". But it doesn't. It specifically says ".10". It hits you like a truck. You check the routes on your host: No default gateway. You specify it manually and suddenly you can hear the Discord notification sounds from your computer. Jackpot. 

Instinctively you go back to the DHCP settings just to see that the update also borked some of those settings, specifically the gateway announcement. All hosts in your network rely on DHCP announcements, even for static IPs. You enter the default gateway into every single DHCP server, wait a single lease time, and everything starts to work again. Even Netflix on the TV starts to play again.

WireGuard and inbound NAT still need to be configured, but you are too tired.

It is now 5 am, you are finally able to control the lights again and go to sleep, mentally hating yourself for not having backups. Let's just do those tomorrow, you think, drifting away into a deep sleep.
