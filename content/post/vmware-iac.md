---
title: "Quick Note: Combining IaC, cloud-init, and vCenter"
date: 2020-04-17T16:35:06.000Z
#images: ["evolution.jpg"]
draft: false
tags: ["homelab"]
summary: "Or: Trying to get Infrastructure as Code, Configuration Management, cloud-init, vCenter, Debian, Packer and Terraform to work together."
---

Since we are all in quarantine anyways, I have decided try out immutable infrastructure without using some big cloud provider. This article is more of a mental note for me, since I definitely will forget how I got this to work.

My homelab mainly consists of VMware boxes, and while they are great, there do not seem to be any simple guides on how to make infrastructure as code and configuation management work in an homelab. The ones I could find leveraged tools like Ansible, Salt, Puppet, etc., but we can do without them.

## Immutable Infrastructure

I will not describe the concept of immutable infrastructure on here, there are plenty of great articles on its advantages:

> The benefits of an immutable infrastructure include more consistency and reliability in your infrastructure and a simpler, more predictable deployment process. It mitigates or entirely prevents issues that are common in mutable infrastructures, like configuration drift and snowflake servers. However, using it efficiently often includes comprehensive deployment automation, fast server provisioning in a cloud computing environment, and solutions for handling stateful or ephemeral data like logs.

[Source](https://www.digitalocean.com/community/tutorials/what-is-immutable-infrastructure)

## Infrastructure as Code

Infrastructure as code describes the process of deploying VMs, networking, storage, containers, etc. through simple code files.

It is absolutely great:
* You do not have to remember every little thing you have to change while setting up a server again.
* No updates, just delete the VM and deploy it again from a new template.
* Something breaks? You do not have to find the issue immediately, just deploy the last working commit from your git repo.

There are of course a lot of ways to do IaC, but I have chosen [Hashicorp Packer](packer.io) to create templates and [Terraform](https://www.terraform.io/) to deploy those onto my vSphere cluster. They are simple, modern, and have a great community.

## Configuration Management

One could "simply" use Ansible, Puppet, Salt, ...

But: [Provisioners are a Last Resort](https://www.terraform.io/docs/provisioners/index.html). They add unnecessary complexity to an otherwise relatively simple workflow. Also, we just do not need them. There's already [cloud-init](https://cloudinit.readthedocs.io/en/latest/#) for that. At least for my use case it offers solutions for pretty much everything I have to set up. Granted, you cannot easily change the configuration afterwards, but that is the point: You can always just redeploy the VM in a few seconds.

## Combining everything

Combining everything can be tricky.

### Template creation

The template creation is the easiest part. Just create a ```.json``` file using the [official guide](https://www.packer.io/intro/getting-started/build-image.html):

Mine looks like this:
{{< gist merlinscholz 1ca3a61594a1741ef15507acbc778f41 >}}


This script leads to the Debian VM trying to load a ```preseed.cfg``` file. Here is a fairly simple example, the important bit is, that it installs cloud-init:

{{< gist merlinscholz e300a7607621bb5391a566a449e38066>}}

For this to work, you will have to set your environment variables, and have ```debian-10.3.0-amd64-netinst.iso``` on your vCenter server:

{{< gist merlinscholz 47b6521d86cba85af221a2e639871515 >}}

At the end of the installation, Packer will download and run the script from the [vmware/cloud-init-vmware-guestinfo](https://github.com/vmware/cloud-init-vmware-guestinfo) repo. This is necessary to get the cloud-init files into our VM in the next step.

Also when using Debian, we have to install [nextplan.io](https://nextplan.io), because the default Debian networking configuration (```/etc/networking/interfaces```, ENI) is [not properly supported by cloud-init](https://cloudinit.readthedocs.io/en/latest/topics/network-config-format-eni.html). We have to delete the ENI because otherwise we end up with a DHCP address in addition to the static address we want.

You can now build the template using ```packer build debian-10.json``` and get a coffee. This will take a few minutes.

### VM Deployment

For this example, we are going to install a name server using PowerDNS and PowerDNS Recusor.

A simple Terraform definition file to achieve this looks like this:

{{< gist merlinscholz 69de29b29a6e0ee4d389b97d30c47920>}}

There is not much to say about this file, the provider variables are set through the environment variables, there is a file called ```env.sh.sample``` in the repo, to facilitate that process.
Except for that, it just copies the template we created beforehand. Also, one could separate the provider initialization into a different file, if creating multiple machines at the same time.

In the ```extra-config``` section, we are encoding the cloud-init files into base64 and passing them into the VM.

## Cloud-Init

Let's take a look at ```metadata.yaml```:

{{< gist merlinscholz 131a010ef66ef5960bf344a218dc2830>}}

Yes, nothing special, just defining networking and hostname. What about ```userdata.yaml```?

{{< gist merlinscholz 2f447086689fc1f666345eef02dbda91 >}}

So, this is where the interesing stuff happens: Installing packages, setting up users, configuring our services, all in one file. Isn't it great? We do not even have to invoke this manually, it all happens through the magic of cloud-init!

Also, be careful when doing DNS. You _will_ shoot yourself in the foot at some point, especially when you need DNS to provision a DNS server. Never again.

## Conclusion

The HashiCorp tools are great. They enable me to just take this infrastructure, change a few environment variables and move it into the cloud. One thing I am missing from Terraform is official libvirt or Hyper-V support. I understand, Terraform is mainly made for cloud providers, but a few alternatives would be nice.

So far this whole has been working pretty good (except for some DNS mishaps), although it is just one of many ways to get started with immutable infrastructure. One of my next goals is setting ub NixOS, since it promises to deliver a similar experience with less external tooling.

One last but annoying thing is the networking setup: I just could not get cloud-init to configure the VM without a dynamic address, there is always one defined in ```/etc/network/interfaces.d/50-cloud-init.cfg```. If you know a way to fix this, I'm open for suggestions!