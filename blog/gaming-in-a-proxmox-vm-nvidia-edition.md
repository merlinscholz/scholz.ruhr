# Gaming in a Proxmox VM - Nvidia Edition

> Published on Jun 2, 2022

I recently got a spare Nvidia GPU, a wonderful GTX 1650. Not very powerful, but it doesn't need any additional power connectors - perfect for throwing it into a server. In this case, into my trusty Dell PowerEdge T440. What to use it for? I've considered as a hardware transcode device for Jellyfin, but all of my media already is in a nice format so I rarely do any transcoding. Then it dawned on me: Gaming VM.

The T440 is (currently) running Proxmox 7.2-4. The plan is to create a Windows 11 VM to be able to stream games via Steam Link or Nvidia/[Moonlight](https://moonlight-stream.org/) streaming.

The steps to get this working consist of:

0. Preparations
1. Physically install the GPU
2. Prepare PCIe passthrough
3. Install Windows
4. Configuration changes
5. Streaming

## Preparations

The first step is to prepare the whole ordeal. That involves downloading a Windows 11 installation ISO and ordering a dummy HDMI/DisplayPort adapter. The latter one is needed, as most GPUs (at least all that I have ever encountered) can only play games on them if there actually is a screen connected to them. So unless you have a spare screen laying around, you will want a dummy adapter that acts like there is a screen connected to the GPU. One of those will set you back around $4 from eBay, AliExpress, you name it.

## Physically installing the GPU

This is the most straight-forward part. Pull the server out of the rack, open it up, install the GPU, put the server back. I still encountered two issues though:

1. There is zero airflow. My tower/rack-hybrid server is not really made for PCIe cards, so there is not a single fan near the slots. I already had the same issue with the RAID/HBA card, and now that they're sitting right next to each other, I will have to monitor the temps a little closer. As I'm writing this, there have been ~2 hours of stress-testing, all temps seem to be under 65°C so far.

2. The GPU did not show up in Linux, the BIOS, or anything really. This was my own fault. My T440 is a dual-socket system with only one CPU installed. The PCIe slots are labelled accordingly. I didn't see that and installed the GPU to the missing CPU2 as that slot has the highest bandwidth. Right now it is sitting in the correct slot, but not with the full PCIe bandwidth, as the slot is too short. At least Dell made the PCIe slots open at the end so that I did not have to dremel them up (again).

## Prepare PCIe passthrough

This part is described really nicely in the official Proxmox wiki, so I'll just leave the link here: [https://pve.proxmox.com/wiki/Pci_passthrough](https://pve.proxmox.com/wiki/Pci_passthrough)

## Install Windows

Grab your favorite Windows installation ISO and install Windows like you would do with any other EFI VM. The only thing to note is to use EFI and the "q35" machine type. No other special setup, do not forward the GPU to the VM. Just install it. We'll have to change some things later anyway. Set a static IP and install your favorite VNC server. I [highly recommend TightVNC](https://www.tightvnc.com/). It installs as system service and allows us to see Windows even starting up/shutting down and is reasonably performant. Why VNC at all? As soon as we actually use the GPU, the Proxmox console will not work anymore, since the display data is not routed to the Proxmox virtual GPU. Microsoft RDP does not work since it logs you out of the "normal" desktop session. Also, remember to set a static IP while you're at it so you don't need to hunt for DHCP leases.

The last thing to remember is to enable auto-login. Now it's time to shut down the VM again and make some changes under the hood.

## Configuration changes

If you were to try adding the GPU to the VM and installing the Nvidia drivers, you were to encounter the wonderful "Error 43". This is because Nvidia prevents their (non-enterprise) drivers from working in virtualized environments. Luckily, they don't check too many things, so this is an easy fix. There are tons of flags you'll find online regarding this, and believe me I've tried every permutation of them. The following ones seem to be the minimally intrusive set and work perfectly as of June 2022.

Log in to your Proxmox installation (SSH or the web terminal) and edit the config file for your VM, in my case VM ID 104. You'll want to add/replace the following lines:

```
# /etc/pve/qemu-server/104.conf

agent: 0
args: -cpu 'host,hv_vendor_id=PLSWORK,kvm=off,-hypervisor'
cpu: host,hidden=1,flags=+pcid
kvm: 1
```

Put those lines at the top of the file, Proxmox will rearrange them anyway. The CPU vendor ID can basically be every string. You may see my desperation trying to figure that out. Afterwards, add the GPU for forwarding through the web interface. Set it there as primary GPU.

At this point you should be able to boot the VM again and install the Nvidia drivers through their official website (if the Windows Update Drivers aren't faster than you).

## Streaming

To actually stream games there are two options, Steam Link and Nvidia Experience/Moonlight. Some time ago, Moonlight used to be better than Steam because it could capture the GPU output directly, but Steam has added that option in their client. In the Steam settings, under Remote Play, Advanced Host Options, set "Use NVFBC capture on NVIDIA GPU". While you're at it, you can check "Change desktop resolution to match streaming client" as well, as it won't mess up our physical monitor as there isn't one connected.

You should now be able to stream games from your Phone, media player, whatever. If you are on a limited network connectivity with fast clients (like a modern iPhone), you can enable HEVC video in the Steam Link app settings.

My main use case consists of the Steam Link VM (on a Xeon Silver 4208) with the Nvidia GTX 1650, routed (not switched) through a MikroTik RB4011 to an Apple TV 4k, with an Xbox One Controller connected via Bluetooth to the Apple TV. The Steam stats overlay shows a <1ms input latency, <1ms ping, and around 30ms display latency, which is not only usable but actually really performant. Maybe not something to play competitive games, but for casual gaming it seems perfect.
