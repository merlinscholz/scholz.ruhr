---
date: "2020-02-07T15:01:06.000Z"
draft: true
summary: In the beginning, there was... well, nothing. After playing around with desktop computers, servers, and many, many VMs as long as I can think, I never really managed to permanently self-host something myself. This is its evolution.
title: The Evolution of the Homelab
---

In the beginning, there was... well, nothing. After playing around with desktop computers, servers, and many, many VMs as long as I can think, I never really managed to permanently self-host something myself. This is its evolution.

## Homelab v0

This all started to change back in 2015 when I heard of a wonderful software called Plex, and decided that I want to host it for me and close friends. At that point I had multiple servers laying around, and while they were some of the more quiet ones (Fujitsu RX100/RX200/RX300), they were still too loud to leave them running a few meters next to my bed. So, what was the most quiet computer I owned at that time? A Raspberry PI 2b with some ARM Plex distriution that's normally intended to be integrated into NAS systems. Running Plex on a RPI2B may sound like a terrible idea, but it worked... somehow. I only had to remember to convert all video files to h264 before I put them onto the 1Tb external hard drive connected to it. It was not great... but it was my Homelab v0. The starting point of many future expenses.

## Homelab v1

At one point, I came to the conclusion, that a single RPI wouldn't cut it, although its form factor wasn't that bad. So after searching for more-powerful, x86-based SBCs online, I decided to go with the [Lattepanda Alpha 864](https://www.lattepanda.com/products/lattepanda-alpha-864s.html). (The product in this link is the updated version 864s with a different CPU, mine has the Intel M3-7y30 as used in some MacBook models.) It features a good-enough Intel Dual-Core/Quad-Thread CPU with virtualization capabilities, 8Gb of RAM, and 64GB eMMC storage. One quick Plex migration later and I had a working, powerful media server.

I also used it for VPN access to my home network (although there weren't many devices on it back then). Since I am on a residential network with a DHCP-assigned WAN IP address, I had to get a domain name. As a poor student I couldn't/didn't want to afford a proper domain name, so a DDNS-service had to do. After years of trying out different providers I came to the conclusion that [Dynu](https://www.dynu.com/) has by far the best free tier and supports all standard IP-update protocols without having to run some extra VM.

![Homelab v1](/images/homelabv1.jpg)

## Homelab v2

I would say things really started to take off with Homelab v2. Initially I wanted a platform for experimenting with "bigger" VM setups like the VMware ecosystem (vCenter, Horizon View, vSAN, ...), the Microsoft ecosystem (Hyper-V, Active Directory, ...) and the like. Also, the 1Tb external HDD started getting full. The trusty Lattepanda Alpha with its 8GB of RAM just wasn't enough for all of this, and after years of saving I finally pulled the trigger on my own whitebox build. My requirements were, as always, cheap and quiet. I ended up with this:

|              | Part                              | Price [^1] | Amount |
| ------------ | --------------------------------- | ----------- | ------ |
| CPU          | AMD Ryzen 5 2400G                 | 124.90€     | 1      |
| RAM          | G.Skill Aegis DDR4-3000 CL16 16Gb | 61.90€      | 2      |
| Motherboard  | Gigabyte B450 Aorus M             | 78.99€      | 1      |
| Power Supply | Thermaltake Berlin 630W           | \-          | 1      |
| Case         | CoolerMaster Silenctio S400       | 85.90€      | 1      |
| SSD          | WD Black SN750 500GB              | 69.90€      | 1      |
| HDD          | Seagate IronWolf 4Tb              | 109.40€     | 2      |
|              | HGST Travelstar 5K1000 1Tb        | \-          | 2      |
| RAID/HBA     | Dell PERC H310                    | 33.90€[^2] | 1      |
| Boot USB     | SanDisk Ultra 32Gb                | \-          | 1      |
| Total        |                                   | 736.19€     |        |

[^1]: As of time of buying
[^2]: Used, from ebay

Some parts I had already laying around, like some old 1Tb (now used in RAID0 as scratch storage) and the power supply from an old gaming PC.

This whitebox is running for about a year now, and I am most impressed by the case: It look good, the build quality is absolutely perfect, it was cheap (compared to the Fractal Design cases I looked at first), it has pretty dust filtes and it is extremely quiet: The side panels are insulated with about 1cm of foam, and the CoolerMaster standard fans are inaudible compared to the Thermaltake ones in my desktop.

The ESXi installation was almost seamless, except for the NIC drivers: The B450 Aorus M only has a Realtek onboard-NIC, but this wasn't a big problem thanks to the [ESXi image customization script](https://www.v-front.de/p/esxi-customizer-ps.html) and [this guide](https://www.v-front.de/2014/12/how-to-make-your-unsupported-nic-work.html).

The Dell PERC H310 has been flashed to IT mode. I would like to post a more detailed guide on how this is done, but it has been too long ago and there are multiple [great guides out there](https://tylermade.net/2017/06/27/how-to-crossflash-perc-h310-to-it-mode-lsi-9211-8i-firmware-hba-for-freenas-unraid/), even for [dealing with EFI](https://www.vladan.fr/flash-dell-perc-h310-with-it-firmware/). The 2+2 disks were forwarded to a FreeNAS VM and shared via NFS to a Debian-Plex-VM.

The whitebox also replaced my router through an OPNsense VM.

### Homelab v2

This setup ran perfectly for over a year, but it did not offer very much flexibility: The 2+2 disks were assigned to FreeNAS only, and ZFS really was not that necessary since I could not use deduplication.

So a at that time I scrapped everything, flashed the RAID controller back to its original firmware, reinstalled ESXi (this time with vCenter) and installed Plex to a CentOS VM, directly connected to a 2.5TB VMDK file on the RAID-1 backed VMFS datastore.

Around that time I also segmentated my networks more, having seperate VLANs for WAN, internal, DMZ, VPN, and a few "test"-networks. This gives me enough flexibility to try out new technologies, learn for certifications, and hopefully write about them in this blog.

This was the time that I really started to invest money into my homelab. I got myself a [12u open frame rack](https://www.startech.com/de/en/Server-Management/Racks/12u-4-post-server-rack~4POSTRACK12U) from StarTech (which offers amazing build quality) and got to work mounting everything:

![Homelab v2](/images/homelabv2.jpg)

### Homelab v3

Homelab v3 consists of me buying way too much extra stuff, including some proper network gear (Ubiquiti Dream Machine Pro)[^3], storage gear (Synology DSM218+, in which I threw the IronWolfs) and a few domains.

Update: Homelab v3 also consists of me selling my Dream Machine Pro, and getting some proper network gear, namely a MikroTik RB4011 and a MikroTik CRS326. Couldn't be happier with them.

[^3]: At least I thought at the time it would be proper gear. In hindsight I should have picked a different firewall/router/switch.

Currently, my old blog domain mscholz.dev is being used for testing purposes and internal domains, while the main blog and other public projects are being hosted on merlinscholz.name.