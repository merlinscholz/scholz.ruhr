---
date: "2022-05-05"
title: "Using Mullvad VPN as a second WAN on MikroTik's RouterOS"
---

Today I spent a few hours getting a VLAN to work that routes via Mullvad to the Internet. My use case are a special guest WiFi for clients I don't trust as much, but also services like Radarr.

There are some guides to do this online, but they all seem overly complicated, using VRFs, or unnecessary many firewall rules.

In theory this should work with all VPN providers that allow you to connect via WireGuard, which seem to be most of them. Beware that this article contains some custom Mullvad magic though.

Please read, understand and if necessary modify these commands before blindly copy-pasting them into your terminal.

All of these settings are also manageable through the web/WinBox interface and should have the same names.

## Create the VLAN

The first step consists of creating the VLAN that should access the internet via the VPN. In my case this VLAN is called `mullvad` and the router has the address 10.0.60.1/24 for that VLAN.

```
/interface/vlan/add vlan-id=60 interface=bridge1 name=mullvad
/ip/address/add address=10.0.60.1/24 network=10.0.60.0 interface=mullvad
```

## Create the WireGuard interface

For this step you'll have to access [https://mullvad.net/en/account/#/wireguard-config/](https://mullvad.net/en/account/#/wireguard-config/) to generate a WireGuard key pair. Just generate it in the web interface and download the appropriate config file for your preferred server. My example (for `nl1`) looks like this:

```
[Interface]
PrivateKey = ####privkey####
Address = 10.67.7.126/32,fc00:bbbb:bbbb:bb01::4:77d/128
DNS = 193.138.218.74

[Peer]
PublicKey = UrQiI9ISdPPzd4ARw1NHOPKKvKvxUhjwRjaI0JpJFgM=
AllowedIPs = 0.0.0.0/0,::0/0
Endpoint = 193.32.249.66:51820
```

We'll transform this into MikroTik commands:

```
/interface/wireguard/add private-key="####privkey####" name=mullvad-upstream
/interface/wireguard/peers/add allowed-address=0.0.0.0/0,::/0 endpoint-address=193.32.249.66 endpoint-port=51820 interface=mullvad-upstream public-key="UrQiI9ISdPPzd4ARw1NHOPKKvKvxUhjwRjaI0JpJFgM="
```

Remember to quote your keys, otherwise the `=` sign messes up the command. Also, remember to exchange the server's public key for the appropriate one. The provided one is only valid for `nl1`.

At this point there was the biggest difficulty: To set the address of the router's `mullvad-upstream` correctly, you need to find out which network Mullvad uses internally. Luckily, their SOCKS5 addresses are available, and seem to match the WireGuard ones. We head to [https://mullvad.net/en/servers/](https://mullvad.net/en/servers/), select our server, and take a note of the "SOCKS5 Proxy Address", in our example `nl1-wg.socks5.mullvad.net:1080`. This (currently) resolves to `10.124.0.4` using any public resolver:

```
/ip/address/add address=10.67.7.126 network=10.124.0.4 interface=mullvad-upstream
```

## Routing

While this seemed difficult at first, it really wasn't. Some other posts suggest using VRF, but this isn't even necessary. Instead, all packets coming from our special VLAN will use a custom routing table called `mullvad`:

```
/routing/table/add name=mullvad fib
/ip/firewall/mangle/add chain=prerouting in-interface=mullvad action=mark-routing new-routing-mark=mullvad
```

Then, we'll create a routing rule so that all packages coming from the specified VLAN will only be handled by the custom routing table:

```
/routing/rule/add routing-mark=mullvad action=lookup-only-in-table table=mullvad
```

Beware: For some godforsaken reason, the RouterOS web interface does not show this rule. You can see it however in the terminal or via WinBox.

Afterwards, we'll add a route in this new table that routes everything through the Mullvad server:

```
/ip/route/add dst-address=0.0.0.0/0 gateway=10.124.0.4 routing-table=mullvad
```

Important: Do not forget that you need to NAT the traffic from the special VLAN:

```
/ip/firewall/nat/add chain=srcnat out-interface=mullvad-upstream action=masquerade
```

## DNS

Sadly, as of RouterOS v7, MikroTik does not allow DNS server on a per-interface basis. So to get DNS working you'll have to use the public Mullvad DNS servers in your DHCP config and do not have access to thei ad-blocking ones.

## Testing

From this point on, we connect a device to our new VLAN and test the connection:

```
merlin@test:~$ curl icanhazip.com
193.32.249.136
```

This matches the public IP of our WireGuard server, so our setup seems to work perfectly.
