---
title: "Using the Hashistack for QEMU-VMs"
date: 2020-03-31T02:56:06.000Z
draft: true
tags: ["homelab", "hashistack"]
summary: "Originally I wanted to write about replacing some Docker setup with Hashicorp Nomad/Consul/etc. Turns out, there are thousands of great articles about that, so it's time to do something different."
---

Originally I wanted to write about replacing some Docker setup with Hashicorp Nomad/Consul/etc. Turns out, there are thousands of great articles about that, so it's time to do something different. So instead of using containers, let's go a little bit more bare metal and use full blown VMs. This shouldn't be a problem since Nomad offers QEMU as a driver and due to the recently updated [Hashicorp Packer](https://packer.io/) we should be able to create the corresponding VM images on the fly.

In an "usual" setup you'll see Packer being used to create Nomad Servers/Clients, but not here, we'll turn things upside down!

## The environment

Let's start small. This is only a proof-of-concept so we shouldn't need high availability, redundancy, load balancing, or even Consul (yet). I'll use:
* Management PC (Pop!_OS 19.10)
* Main VM Host (ESXi 6.7 with vCenter)
    * Nomad Master (Ubuntu 18.04)
    * Nomad Client (Uubntu 18.04, enabled nested virtualization)

## Preparation

The preparation should be fairly simple, [install Packer](https://packer.io/downloads.html) on the Management PC and get both VMs up and running (with DNS).

