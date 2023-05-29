# Homelab v4.1: Old School Unix Administration

> Published on Sep 8, 2022

This will be a rant and/or raw stream of thoughts.

## The story so far

I'm returning to old school Unix administration (for now). Over the years I've tried various methods to manage my home server(s). It started with a basic Debian installation in 2016, with a simple Plex server, Nextcloud installation, and reverse proxy. But over there have been:

* Multiple hypervisors: Proxmox, ESXi, Hyper-V, libvirtd, XenServer/XCP-NG
* Multiple container management tools: Podman, Docker, LXC/LXD, contianerd
* Multiple container orchestrators: HashiCorp Nomad/Consul, Kubernetes, its various forks and deployment methods like k0s, k3s and Rancher
* Different server appliances like Rancher Harvester, TrueNAS Scale or TrueNAS core (which I'm running right now, using jails for my services)

## The edge

The one thing that pushed me over the final edge was TrueNAS 13 (CORE). I "just" wanted to run a VM. Nothing much. Just some VM I can access remotely and use as a build server for some projects. The web UI regularly got out of sync with the actual hypervisor, VNC worked sometimes (good luck installing Windows without a display), it just wasn't as usable as I hoped. TrueNAS' VM support was terrible enough for me to look for alternatives.

I wanted to put a NVMe in my PowerEdge and install ESXi. No luck. While the NVMe can be used fine from the OS, you cannot boot from it. This is a known issue with 13rd/14th gen Dell PowerEdge servers.

## All of this stops now

Through some work work for my masters degree I've had to read more about NetBSD, and stumbled upon their "[donations](https://www.netbsd.org/donations/)" page. There it listed [sdf.org](https://sdf.org/) as one of their sponsors. One important part of SDF is access to a Unix system. This doesn't sound special at a first glance, but SDF offers Unix access to basically everybody, for decades now. No fancy web interface, no IaaS/PaaS/WhateveraaS, just an account on a Unix (NetBSD) machine/cluster. This intrigued me. I've worked on larger multi-user Linux systems before at university. I've seen plenty (old) websites using the classic home tilde dir as their personal website, which SDF also offers (I wish my university would offer those to students). If such large organisations run just fine on "simple" Linux/NetBSD servers, then why can't I? After all, scaling vertically should be the first step before scaling horizontally. To top it all off, I recently stumbled upon "[chiark’s skip-skip-cross-up-grade](https://diziet.dreamwidth.org/11840.html)" when I realised: I miss it.

## Pets instead of cattle

Maybe it is because everywhere you look you read about how to treat your datacenter as cattle, aka "just replace something if it fails", the user data and configs are stored somewhere else anyway, probably in some KV store or git repo.. This may be great for MAANG, but may be overkill for a three-server-homelab. Yes, I've only noticed that after half a decade. Do I really need five different containers for five websites? Apache has VHosts for a reason after all. Also, configuring everything for high availability has brought me more downtime than an actual host/service going down.

An other big inspiration has been Stack Exchange: They are pretty open regarding the technology they run. No fancy containers or the likes, just a few physical web server, a few physical database servers, and physical load balancers. Simple, yet extremely strong.

## Returning to simpler times
The new iteration of my Homelab (I need to make a list some time) will be a single Linux (RHEL9) server. No VMs (except for my current Linux Kernel experiments), no containers, just a plain old Linux system. Installing packages, configuring files in /etc/ by hand, keeping backups (instead of GitOps). I noticed I do not know as many things about Linux as I want to. This changes now.

I got myself access to RedHat's Developer Portal, with their nice guides on how to properly manage a Linux system. Starting with disk layout planning, over considerations for multi-user environments, and more. No more complicated schedulers or fancy GUI tools, finally learning every detail about cron, rclone, and friends. Fine tune Postgres and Apache variables instead of just using the cloud or the weekly new web UI. Manage file access permissions and ACLs if I want others to access files, don't just `sudo cp` everything. Learn about process niceness and apply it fittingly. Package management? Different repositories? Manually installing stuff into /opt/? More of that, and less container networking, less over-engineered stuff in general.

## More advantages
One thing I thought of is giving friends access to the system. May it be for access to Linux in general, compiling something when they only have a 10 year old Intel Pentium at home, or just explore the system. Also I could offer a few hundred Gigabytes of /home/ storage. Enable the good old tilde directory web server for them. We'll see. If I take this far enough, I could learn about LDAP (and integrate it with my hosted services), maybe write some web interfaces for SSH key management, a pretty motd for other users (who actually modifies their motd these days?), the possibilities are endless.

The other thing I hope to achieve from this is a proper networking setup, as described in my last post. Getting IPv6 to work with Docker and friends is hell, and since there are enough difficulties, I will just start simple. Also, DNS: My current naming scheme is great - if you have around 1k server. Last I checked, I didn't have those. This migration gives me the chance to move from `srv-5dff.phy.home.scholzserv.de` (no it doesn't resolve publicly), to something normal like `mars.scholz.ruhr` (or whatever naming system I end up using). If my University can do it, why can't I? Hopefully this also makes me use DNS more instead of remembering IPs in many subnets.

## Risks
Obviously, modern alternatives to this scenario weren't invented for nothing. One thing I fear is a single error or due update bringing down the entire system instead of just one service. But this is home-production, not MAANG. It's okay. Just keep backups. Even if everything fails, nothing is stopping me from changing back to a normal hypervisor. I will be able to keep my ZFS pool, and even if I didn't, there are enough backups laying around somewhere.

An other problem I've thought about was exploring new technologies, cluster management, etc. But that's the nice thing: Since we've got one server for everything, we can simple use it as VM host too and explore more technologies in there.

## A concrete Plan
The plan for now is to install Linux, and import my ZFS pool. I've already have a /home/ dir on my ZFS pool, and plan on using that for the new Linux installation. That step is easier said than done, first I gotta read through access.redhat.com for the optimal storage layout. One primary objective was the ability to use Snapshots, in case I (or a failed update) end up rendering things unusable. But what to use? Ext4? XFS? LVM? ZFS? I have given up on Root on ZFS for RHEL9, it's way too much effort and only properly works with the open source clones. Also I have given up on XFS - its inability to shrink partitions has ruined my day before. LVM with Ext4 it is. So much details to plan, and this is just the start.

Then I'm just gonna install the services you need on a Linux server. BIND (to actually have working DNS at home), Apache, PHP, Postgres, MariaDB, Plex, SSHd, SMB, cron, Xorg for SSH forwarding, maybe even some CGI action ... I will write config files, fine tune things, manage backups, classic Linux sysadmin stuff.

For my own personal tasks I plan on avoiding sudo at all. I've often found myself using it as shortcut to achieve things.

The possibilities seem endless. I'm excited.

## Post Script
I also thought about going the NetBSD way, like SDF does. Truth is, I may still go that way. But I wanted to start simple.
