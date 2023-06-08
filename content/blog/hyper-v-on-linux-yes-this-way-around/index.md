---
date: "2022-03-15"
title: "Hyper-V on Linux (yes, this way around)"
---

Almost two years ago while browsing Linux-related news I stumbled upon a Phoronix article: [*"Microsoft Wants To Create A Complete Virtualization Stack With Linux"*](https://www.phoronix.com/scan.php?page=news_item&px=Microsoft-Linux-Root-Partition). Yesterday I remembered that article, and read up on a few follow-ups like [*Linux 5.12 Should Be Able To Boot As The Root Partition On Microsoft's Hypervisor*](https://www.phoronix.com/scan.php?page=news_item&px=Linux-5.12-Hyper-V) and [*Microsoft Prepping Linux For Running As 64-bit ARM Hyper-V Guest*](https://www.phoronix.com/scan.php?page=news_item&px=Linux-5.13-ARM64-Hyper-V-Guest).

I also browsed the Linux Kernel mailing lists, and it seems like there hasn't been much (public) activity since mid-2021. A lot of merge requests, some approved, some not yet. The 5.12 goal has not been achieved.

A quick summary of what I could gather/understand: Microsoft wants Hyper-V with Linux as the root partition ("dom0" in the Xen world). This should operate through some kernel patches, a `/dev/mshv` (Microsoft Hypervisor) file, and an updated version of [Intel's cloud-hypervisor](https://github.com/cloud-hypervisor/cloud-hypervisor).

This is a lot of very vague information, of course there is no (public) documentation about any of this apart from some Kernel mailing lists and some cloud-hypervisor commits. Nothing to work with really, so let's start anyway. I figured after almost 2 years something has to work.

The "new" virtualization stack consists of three elements:
1. The Microsoft Hypervisor microkernel
2. A custom Linux Kernel as the root/parent partition
3. A patched cloud-hypervisor as the Virtual Machine Monitor (VMM)

## Custom Linux Kernel

### Finding sources

At this point my first goal is to get the mysterious `/dev/mshv` file working, since it seems to be the main portal to the MSHV world, similar to `/dev/kvm`.

As I mentioned, a good number of those patches is not in the Kernel yet. While I could have merged all the patches manually into the "vanilla" Kernel source, I searched for some "official" Microsoft repo. Maybe they have merged those into a custom Kernel for [CBL-Mariner](https://github.com/microsoft/CBL-Mariner)? No luck, but after a good two hours of searching various Kernel repos, I stumbled upon [a GitHub repository by Wei Liu](https://github.com/liuw/linux/tree/msft/mshv-stable), one of the main contributors for this whole affair. The repo, especially the `msft/mshv-stable` branch, seems to be the main working branch from which the LKML merge request originate. It is forked from Linux 5.13.

### Build system

I wanted to use a "real" machine for testing, as nested virtualization creates more problems than it solves. My build/test system is a Dell PowerEdge R330.

I also opted for Debian 11, as it is pretty simple and barebones, features a close-to-stock Kernel and doesn't get in the way.

After cloning the repo, starting the build project and waiting an hour, I noticed I was on the wrong branch. Yay. Quickly moving to the right branch, I remembered I didn't even configure the Kernel. The cloned repo contains some Mariner-optimized config files, I opted for `config-mariner-mshv-builtin`. One thing to note is that is sets `CONFIG_HYPERV_ROOT_API=y`, which looks promising. I was mislead by that at first since it is mentioned under "Hyper-V guest support" - but after all, Linux would run as a guest under the Hyper-V microkernel.

It seems like the team uses the CBL-Mariner distro as base for their development. This Kernel config is referenced in [`Documentation/virt/mshv/api.rst`](https://github.com/liuw/linux/blob/msft/mshv-stable/Documentation/virt/mshv/api.rst), which also specifies some other details about how to use `/dev/mshv`.

The build finished in a "normal" time (<30 minutes on a Xeon 1270 v5 and a cheap consumer SSD), the Kernel package installed successfully, and thus upgraded the system from Debian 11's 5.10 Kernel to the custom 5.13 one. A quick reboot, and `/dev/mshv` exists. Now, let's test if it actually does something, I'll just do this through the [`cloud-hypervisor/mshv`](https://github.com/cloud-hypervisor/mshv) crate:

```shell-session
$ cargo build
$ sudo -E ~/.cargo/bin/cargo test
```

This crashes the system. Maybe because it doesn't yet run on a hypervisor basis and some syscalls get translated incorrectly? I really don't know, but at least it does *something*.

## cloud-hypervisor

This seems to be the easiest part, as cloud-hypervisor is a simple rust program. AFAIK the "normal" releases are not built with MSHV support so we'll just compile it ourselves:

```shell-session
$ git clone https://github.com/cloud-hypervisor/cloud-hypervisor.git
$ cd cloud-hypervisor
$ cargo build --all --no-default-features --features "mshv,common"
```

## Microsoft Hypervisor microkernel

I'm afraid this is where the journey has to end:

> The licensing part of Microsoft Hypervisor is still in progress and that is the reason for creating the CI at Microsoft.

This is a line in a [GitHub issue](https://github.com/rust-vmm/mshv/issues/16#issue-1001375200) from Muminul Islam Russell, one of the core contributors in the whole project.

I've tried to get my hands on the bare hypervisor through various ways. I couldn't "separate" it from a Hyper-V Server Core installation, there is *very* little information on how it is connected with a normal Windows installation at all. My initial assumption was that there either is a special EFI file that loads the hypervisor and bootstraps the root partition, but I couldn't find that. References to the actual code base are sparse as well, only a few (old) research articles like [Verifying the Microsoft Hyper-V Hypervisor with VCC
](https://link.springer.com/chapter/10.1007/978-3-642-05089-3_51), where the researches have access to the code base through Microsoft directly. 

Other methods I've attempted are enabling/disabling the Hyper-V stack in a VM and diffing the hard disk image before and after. Maybe there were hints on which boot steps are skipped in order to enable/disable virtualization? I've had no luck there. My next attempt will be to analyze the EFI files to find out how they work internally and where the hypervisor microkernel even is located.

It seems like the only way to get this project to work - other than Microsoft releasing the Hyper-V microkernel in any way - is to "inject" the custom Linux installation with the new Kernel into the root partition of a Windows installation at boot time. I'll try my best to achieve this, but I'd be very thankful for any pointers in the right direction.

I'll update this post when I find out anything new, but I'm pessimistic that this is achievable without Microsoft's help/sources.
