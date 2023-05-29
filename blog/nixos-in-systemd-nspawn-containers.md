# NixOS in systemd-nspawn containers

> Published on Dec 11, 2022

Why

Docker is boring, abstractions, Nix is the hot new thing

Systemd-nspawn used by NixOS, can’t use nixos due to workstation needs, ability to move containers

nixos-generator -f lxc or download tarball from [https://hydra.nixos.org/build/198074577/download/1/nixos-system-x86_64-linux.tar.xz](https://hydra.nixos.org/job/nixos/release-22.05/nixos.containerTarball.x86_64-linux)

machinectl import-tar path helloworld (selinux)

# fuck cgroups

that debian manual said something that doesn’t work

# networking

only non-trivial part

ip forwarding

create bridge

host/private

path arch wiki wrong /etc/systemd/system/machines.target.wants/systemd-nspawn\@helloworld.service

`sysctl -w user.max_user_namespaces=1`

# mounting

# shared nix cache

[https://github.com/NixOS/nixpkgs/blob/master/nixos/modules/virtualisation/nixos-containers.nix](https://github.com/NixOS/nixpkgs/blob/master/nixos/modules/virtualisation/nixos-containers.nix)

# migration

create containers on running host, replace services under different port
