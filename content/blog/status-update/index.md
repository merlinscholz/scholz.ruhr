---
date: "2023-01-03"
title: "Homelab v4.3: Status Update"
---

New year, new post, this is a quick status update of what has been going in the lab in the past few months. But first of all...

# Mastodon

Since Twitter went downhill pretty quick pretty fast, I've [moved to Mastodon](https://toot.kif.rocks/@ruhrscholz). This was a fantastic idea. Even though people say discovery over there is limited, I've found (and have been found by) great people, there is way more interaction over there than on Twitter, and the replies are always so nice, helpful and insightful. Choosing a server wasn't hard at all, since (almost) all of the German computer science faculties together run the [KIF](https://kif.rocks/) (Konferenz der Informatik Fachschaften), which in turn hosts its own Mastodon instance (incidentally even hosted at my university). This has the advantage that there are no funding issues, a clear management hierarchy, and it won't disappear anytime soon.

Back to the Homelab:

## Old School Unix Administration

If you remember one of my earlier posts, [Old School Unix Administration](https://scholz.ruhr/blog/old-school-unix-administration/), you may know that I used to run all my services on a single Linux (RHEL) installation. This went fine at first, and I learned a couple of things about Linux administration in general, but there were downsides. As the number of services grew, so did the number of packages which needed to be installed, leading to conflicting package versions (think one Postgres 13 and one 15 installation in parallel, different PHP versions, etc.). Maybe society was right and containers weren't such a bad idea after all... Remember that I also ran my "personal" tasks on the same machine, like programming and compiling stuff, working on my master's thesis...

## Moving to Containers

Moving to containers seems easy, but in this Homelab I tend to not do things the "normal", boring way. I started off by evaluating a lot of different methods for workload orchestration, (even thought about writing some management tool myself for a little while). But some tools or methods that stood out were:

### Systemd-Nspawn

This was a very intriguing find. I initially stumbled upon it while reading up on NixOS containers (which are based on systemd-nspawn). I really wanted to use NixOS, but the last time I used them there were some difficulties with installing and updating packages which are only distributed as binaries (think Plex). I also noticed that while Nix is a great package manager, NixOS just feels like config generation utilities bolted on top of normal Linux. For my use case that's nothing I can't achieve with other IaC solutions. 

But back to systemd-nspawn. The idea is interesting. Stateful containers, like chroots on steroids, but more lightweight and easier to manage than LXC/LXD. Very good integration with systemd itself (who would've guessed), you can just add systemd unit files to run a containerized service at boot. But there still were some difficulties. First of all, SELinux support is not there yet, you are either forced to set every file permission yourself, or just disable SELinux. You also have to get the OS somewhere, either via debootstrap, via DNF, or via something else. That can be a problem depending on the distros you want to run. Systemd crated a tool to fix this problem: [mkosi](https://github.com/systemd/mkosi). Highly recommended, as it combines multiple the distro-specific bootstrapping methods and can even be used outside of systemd containers.

Back to nspawn, while the backend is nice, the frontend tools don't seem to be quite there yet, but I'm excited to see what systemd-nspawn holds for the future. One last thing that bothered me is that there weren't that great ways to combine nspawn with IaC, one of my primary goals in this Homelab iteration.

### Systemd Portable Services

A notable mention goes out to the fairly new [Systemd Portable Services](https://systemd.io/PORTABLE_SERVICES/). While not technically containers, a nice solution to run packaged services without too much isolation from the host OS (for example you can start systemd tasks in the container from the host OS' systemd installation).

### Containers and Ansible

This is the point in this rant when I started to look more into Ansible. Great tool. Initially my plan was to use "normal" Docker containers, deployed with Ansible (remember that IaC was the ultimate goal), but Docker is far from my favourite. The Docker service, the Docker Hub, the security issues, it being "too normal", all that pushed me away from it. I ended up evaluating two alternatives:

### Containerd/Nerdctl

The first one was containerd (the backend Docker usually uses internally) and nerdctl (a nice frontentd for containerd). They eliminated some of the Docker issues, but the problems with a containerd service existing persisted. I'd much rather have my services manages by my init system, to have logs etc. in one place. Also, installation was a pain, since there are no repos or anything, just 5-10 tar.gz files to extract into your / directory. (That's when I had the idea of whether one could build and serve deb/rpm packages from GitHub Actions and GitHub Pages... We'll see...)

### Podman

Podman is a perfect. A drop-in replacement for Docker, without service, perfect rootless support, it can even generate systemd unit files from running containers. And the best feature? Pods. The Pod concept we all love, taken from Kubernetes, made lightweight, and integrated into a normal container management tool. To make this even better, Podman can read (most) Kubernetes YAML files. And since both Podman and Ansible are heavily influenced by RedHat, the Podman support in Ansible is surprisingly usable. That is what my current tech stack is running on right now, Podman on Ansible, based on Kubernetes YAML files. You can see the configuration to deploy my server [in this repo](https://github.com/merlinscholz/homelab/tree/880af120cfdce32a5e4e5528da10f52eed674566).

## New Base OS

The last Homelab iteration used to use RHEL9 as base OS for the server. I quickly got bored of the RedHat integration and wanted to switch things up. Since the /home directory and all important data is on the ZFS array, replacing the OS on the SSD isn't such a big deal, especially since I moved all the setup steps into the Ansible repo. Choosing an OS however is hard. My main requirement was BTRFS support in the Kernel, so I could run the boot disk on BTRFS and easily create snapshots. I don't like to use ZFS for that simply because I've had the support for it as boot disk break one too many times in the past, leaving me with an unbootable system. My second requirement was something rpm-based, simply because I grew quite fond of it (and some of my master thesis stuff requires it).

Turns out, the Linux Kernel easily supports BTRFS as root file system, but RHEL and CentOS (and all other RHEL forks) do *not* include the necessary modules in their Kernels. Damn. That lead me to move to Fedora Server. You may think that the support window is way too short, or that it is way to unstable, but let's be real: I switch the server OS way too often for the first to be a problem, and for the latter - I regularly take down services by accident myself. Also a good exercise to fix stuff when it breaks.

## Plans for the Future

Right now everything is running smoothly, and I get bored quickly. So let's talk future tasks.

On the service side, I would like to slowly implement SAML into the web-based stuff I run (right now most importantly Nextcloud, Jellyfin and Paperless). No real reason, just seems like a nice learning opportunity and would be nice to have a unified login flow. This is probably gonna end with Keycloak, but I'm excited to see what Authentik has to offer.

I'm also experimenting with openSuse again, to check whether it is suitable as server OS for my use cases. So far it seems good, but a big dealbreaker is the missing support for the Cockpit Project. I really like it and use it as my main interface to manage VMs, network interfaces, check server usage, and similar.

The third and obligatory Homelab thing is deploying Kubernetes. So far I've set up some testing VMs and am evaluation different installation methods for K8S, probing different networking layers, just experimenting with it. The penultimate goal would be to either run K8S bare metal on the server (to replace the Podman Pods), or much rather have 3 to 5 VMs on the server which represent a Kubernetes cluster. This approach would allow me mirror the usual Kubernetes deployments from big companies (and learn from them), and would allow me to separate the production and staging clusters, and to add a completely separate "workstation VM". In this scenario, I would just use the server itself as a storage layer/hypervisor. I will definitely keep you updated on the K8S endeavour.

The last plan for the future is to host my own ActivityPub instance. I really like the Mastodon UI/UX and app support (shoutout to Toot! and Ivory), but it being quite resource-heavy (and being written in Ruby which is like witchcraft) made me stay away from it with regards to self-hosting. A nice alternative seems to be GoToSocial, a Mastodon app-compatible, lightweight server written in Go. I *could* use that, but at that point I decided it would be fun to try and write my own Mastodon app-compatible server - when I find the time to do it. The documentation on Mastodon's site is quite good, and with two working open source implementations, this seems doable. This also lead to the idea to run this blog as ActivityPub service (to enable comments, boosts, etc), but first things first.

## Christmas

Since the last post, Christmas happened. And with Christmas came a new patch panel (by FS.com), to tidy up the rack, and an ESP32, just to toy around with. I'll post some pictures of the tidy rack on Mastodon once I'm finished rewiring everything. As for the ESP32: I already have a list of things to try out - once again, when I find the time.
