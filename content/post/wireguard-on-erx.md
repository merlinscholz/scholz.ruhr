---
title: "Installing and configuring WireGuard on an EdgeRouter X"
date: 2020-02-22T22:43:54+01:00
draft: false
images: ["wg_erx.jpg"]
tags: ["networking", "vpn"]
summary: "In this guide I will show you how I configured a wireguard road-warrior setup on an EdgeRouter X."
---

## Why?

Today I finally came around to replace my OPNsense VM with an old EdgeRouter X. Don't misunderstand me, OPNsense is absolutely great, but I reboot or rebuild my VM host way too often for it to be feasible anymore.

Anyways, back to Wireguard: On OPNsense I ran OpenVPN which, while it worked great, was annoying to configure, especially with certificates and different clients like Android and iOS. Also, openVPN isn't that easy on the CPU, which the relatively inexpensive EdgeRouter does not excel at.

In this guide I will show you how I configured a road-warrior setup.

## Installation

The EdgeRouter-series is `.deb`-based, which makes the installation pretty straightforward:

1. Enable SSH (Web UI > System > SSH Server > Enable) and log in into your EdgeRouter.
2. Download the installation package from https://github.com/Lochnair/vyatta-wireguard/releases [^1] and either transfer it to the router (via SCP) or just download it directly onto it. If you are using an ERX you will need the E50-package, also the new v2.0 version has worked fine for me. Remember to check for newer versions!

```bash
ubnt@erx: wget https://github.com/Lochnair/vyatta-wireguard/releases/download/0.0.20191219-2/wireguard-v2.0-e50-0.0.20191219-2.deb
```

3. Install it:
```bash
ubnt@erx: sudo dpkg -i /path/to/wireguard-v2.0-e50-0.0.20191219-2.deb
```

## Key generation

On your workstation, create public and private keys for your server:

```bash
merlin@desktop: wg genkey | tee server_priv | wg server_pub > server_pub
```

Also, create key pairs for every client you want to connect with:
```bash
merlin@desktop: wg genkey | tee phone_priv | wg pubkey > phone_pub

merlin@desktop: wg genkey | tee notebook_priv | wg pubkey > notebook_pub

merlin@desktop: wg genkey | tee tablet_priv | wg pubkey > tablet_pub
```

## Server configuration

On the ERX, edit the config tree:
- `interfaces > wireguard`:
    - Add wg0 (or any other device name)
- `interfaces > wireguard > wg0`:
    - `address`: Enter an address on an unused subnet. We will use `192.168.21.1/24`
    - `private_key`: Copy/Pase the generated private key for the server.
    - `listen-port`: The port to listen on for connections. Default: `51820`
- `interfaces > wireguard > wg0 > peer`:
    - Add the public key of every client you want to connect with.
- `interfaces > wireguard > wg0 > peer > $CLIENT1PUBLICKEY`:
    - `allowed-ips`: Add an _unique_ IP address from the wg0 subnet. Following our example: `192.168.21.2/32`
    - `description`: Add a description if you don't want to remember which public key is which.
    - `persistent-keepalive`: Enter a value like `25` if you want to routinely send "still-alive" packages.

## Network configuration

Also on the ERX, under Firewall/NAT > Firewall Policies, add a new ruleset for allowing incoming wireguard connections:

- Interfaces:
    - Interface: wg0; Direction: local
-Configuration:
    - Drop
- Rules:
    1. Allow UDP, Port `51820` on interface wan

After that you may want to configure routing so that connections coming from the wg0-interface may or may not access other subnets/vlans/hosts/... on your network. Also, remember to unblock the wireguard port in any other routers/firewalls you may have.

## Client configuration

On your host, create a config file for each client:

```apacheconf
# cat phone.conf
[Interface]
PrivateKey = $CLIENT1PRIVATEKEY
Address = 192.168.21.2/24

# Optional:
DNS = 192.168.21.1
# If you are using an internal DNS server, remember to allow it from the new interface

[Peer]
PublicKey = $SERVERPUBLICKEY

# Remember to change the port if using a custom one
Endpoint = your.domain.tld:51820

# If you want to route all traffic through the VPN, use this:
AllowedIPs = 0.0.0.0/0, ::/0
# Otherwise, enter only the IP ranges inside your target network
```

If you quickly and securely want to move the config to your Android/iOS device you can run ```bash qrencode -t ansiutf8 < phone.conf``` and scan the code with the wireguard app on your phone.

If all worked well, you now should be able to connect to your home network from anywhere!

[^1]: The official forum post by the wireguard creator _zx2c4_ can be found at https://community.ui.com/questions/Release-WireGuard-for-EdgeRouter/3765d2a4-1952-4629-948a-3ac9d9c22311. This is just to verify that the EdgeRouter packages are more-or-less official.
