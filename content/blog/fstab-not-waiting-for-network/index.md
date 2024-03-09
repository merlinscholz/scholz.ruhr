---
title: "/etc/fstab not waiting for network"
date: "2024-03-03"
draft: true
---

Imagine this: You set up a Linux server with some services. Let's say Jellyfin for example. And this service has its data residing on a network share via NFS. You want to make sure that the network share is mounted before the service starts. So you add an entry to `/etc/fstab` and you're done, right? Wrong! That's the situation I was in until a few minutes ago.

The problem is that the network might not be available when the system tries to mount the network share. This is especially true for systems that boot quickly.

Usually, NFS should automatically wait for the network to be available. But sometimes it doesn't. There are some things to look out for when troubleshooting this issue.

First, check if the `_netdev` option is set in `/etc/fstab`. This option should make sure that the network is available before the share is mounted. If it's not set, add it and see if that fixes the issue.
