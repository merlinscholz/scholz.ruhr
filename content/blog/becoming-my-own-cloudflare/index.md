---
date: "2022-10-31"
title: "Homelab v4.2: Becoming My Own Cloudflare"
---

Yes, I know, the title is clickbait, but that's okay.

I have always hosted some things trough my own internet connection, like Nextcloud, Plex, you get the gist. In the back of my head I always wanted to use something like Cloudflare Tunnels to hide my private IP (and thus my approximate location), and be protected from DDOS attacks. A few things convinced me not to use Cloudflare, like that they want full access to my domains (rather than accept a subdomain), and more recently, all that Kiwifarms drama. 

Another goal is to offload/cache more things outside of my network, as not to peg my home internet connection as much. Everything that needs the ZFS array at home (Nextcloud, Plex) still will be served from there, but smaller things like websites (or Mastodon) can easily be offloaded to the VPS. 

There are alternatives to Cloudflare out there, but that wouldn't be the homelab way. The homelab way is to just build everything from scratch, so lets get started.


## Current situation

The current situation is simple, and I'd say the default homelab setup for a lot of people: Home internet connection, home server, port forwarding 80/443 through the NAT in the router, and a [script that updates the A records for the domain to account for dynamic IPs](https://scholz.ruhr/blog/gandi-livedns-v5-as-dyndns-provider/). This works fine in practice, but the idea of regularly updating the IP (and revealing your IP to the public) is not perfect. Also, in some consumer routers, the NAT/port forwarding is terrible to set up (looking at you AVM/Fritz!Box).

## The proposed setup

The goal here is to hide this IP, get rid of the port forwarding and DynDNS altogether, and maybe add some caching as a treat. We will implement that by removing the ability of the home network to receive incoming connections, and instead let the home network connect to a VPS via WireGuard. This way, there is no need for updating or revealing IPs, as as soon as the home IP changes, the WireGuard client just reconnects to the VPS with its static IP. From the POV of the VPS, the IP addresses stay the same, as it has a direct look into the home network. From the home network side, we'll add two other networks to our router - which in my case is running RouterOS - one DMZ network for the services that we are hosting (you may already have that one), and one WireGuard connection to the VPS. There are some things you can tweak, like using Tailscale instead of raw WireGuard, but even though I like their services, why involve a third party for such a simple setup?

## Getting to work

The first step is acquiring the VPS. I went with the cheapest VPS on Hetzner, costing me around 4€/month. As operating system I use CentOS Stream 9 (yes, don't hate me), but it shouldn't make a big difference as the tools we're using are working on almost every OS. If you're still reading this, I trust you to be able to install Linux and configure your user account. After this, you want to [install WireGuard](https://www.wireguard.com/install/). You'll want to generate your keypairs (as usual, `wg genkey | tee priv | wg pubkey > pub`), and create a `wg0.conf` file that accepts incoming connections and allows routing through the VPN:

```ini
[Interface]
PrivateKey = [REDACTED]
Address = 10.0.60.1
ListenPort = 51820

[Peer]
PublicKey = [REDACTED]
AllowedIPs = 10.0.40.0/24, 10.0.60.2/32
```

In this example (which is just my actual setup), 10.0.40.0/24 is the DMZ in the home network in which out services (Nextcloud, Plex, ...) are located and 10.0.60.0/24 is the WireGuard tunnel (with .1 being the VPS and .2 being the endpoint at home). This configuration enables the VPS to access both 10.0.60.2 and the whole DMZ network.

On the home network side, we do the inverse, we configure our router to establish a WireGuard connection to the VPS. This depends on what router you have (or whether you want to run the tunnel exit directly on the service host, as with the Tailscale setup), but for MikroTik involves setting up a new WG interface and adding the VPS as peer on that interface. As mentioned, the router has the IP 10.0.60.2/24 on that interface. When that's done you can copy the generated WG keys back to the VPS and try to connect to it. Doesn't work? Remember to set up the firewalls on the VPS accordingly. Afterwards, I also added both the WG and the DMZ interface to the same interface list and set up the firewall so that everything coming from those interfaces may only end up on those interfaces. Better safe than sorry. 

Preparing the main host is almost straight-forward. Before I started this project I used [SNI](https://en.wikipedia.org/wiki/Server_Name_Indication) (the domain being requested) on a (Apache httpd) reverse proxy to differentiate which service to forward a request to.

> Edit: Turns out, I was wrong. As [u/othugmuffin](https://www.reddit.com/user/othugmuffin/) on Reddit [commented](https://www.reddit.com/r/homelab/comments/yif7cb/homelab_v42_becoming_my_own_cloudflare/iuiehzp/?context=3):
>
> Just a clarification, SNI field is used to determine what certificate is presented to the client, but the host header is what is used to actually route the request. In the case you use a wildcard certificate (*.domain.com) and SNI field indicates its for something under that domain it will present the wildcard, but then the host header, eg someapp.domain.com host header shows up and is then routed based on the configuration.
> This is actually how in some of the more restrictive countries people were getting around things, it's called domain fronting: https://en.wikipedia.org/wiki/Domain_fronting
> The SNI field is not encrypted because it's passed before the certificate is selected, so governments can capture that traffic and block it if they seen an SNI value they don't want to allow. If you set a value in the SNI field that's allowed, but then the host header is something else they wouldn't be able to tell because the actual request is encrypted already.



We disable this SSL-terminating remote proxy altogether and take note of the ports the individual services are running on (8000, 8001, 8002). This has the advantage that we don't have to deal with nested SNI, while also making it easier to migrate services to different machines in the future. We also disable SSL, but more on that later.

Now, the reverse proxy. Many different options, I've always used Apache httpd, Nginx and HAproxy in the past, but I've heard good things about [Caddy](https://caddyserver.com/) in the past and am too lazy to set up ACME certs by hand. I have a simple config that looks like this:

```caddyfile
# /etc/caddy/Caddyfile

example.com {
	root * /usr/share/caddy
	file_server
}

service1.example.com {
	reverse_proxy	http://10.0.40.2:8000
}

service2.example.com {
	reverse_proxy	http://10.0.40.2:8001
}

service3.example.com {
	reverse_proxy	http://10.0.40.2:8002
}

```

Remember to set up the DNS records to point to your VPS instead of the home network and restart Caddy. Give it a minute to get all SSL certs (and remember opening any firewalls). At this point you should have first results. If you get a connection timeout or something similar, what stopped me for an hour at this point was that I did not correctly configure the routes on the home server: It must be able to route to 10.0.60.0/24 via 10.0.40.1 (or your equivalent).

## SSL/TLS

I mentioned earlier that I disabled SSL on the home network side of things. Why? Initially I wanted to keep SSL on, but that would
1. Require me to keep another SSL-terminating reverse proxy on the home server running (just another layer of abstraction)
2. Or, set up all the individual services with SSL certs manually, which, depending on the service, is hell. Especially combined with ACME certs.
3. Or, use self-signed certificates. Which, yes, you learn a lot by doing that, but still, it's a good amount of work. Maybe later.

In the end, it's up to your own paranoia, but as I see it, the unencrypted traffic only ever crosses an encrypted WireGuard tunnel. When attackers are in there, there are far worse things they could do. And when the VPS is compromised, the SSL to the services doesn't help either, since the SSL connection is terminated and re-encrypted anyways on there.

One other solution would be to just tunnel the whole HTTPs connection without any SSL termination from the VPS (and only use it for SNI), but that is a not-very-well supported setup in most web servers.

If everything works, you are ready to disable every port forwarding at home and stop the DynDNS/delete your private DNS records. Remember what our goal was with this whole ordeal?

## Bonus 1: Accessing services from home

In the current setup, when you're sitting at home and want to, for example, check the Nextcloud app, the request will first go to the VPS, then back into your house. This reduces bandwidth massively and increases latency. What I have done against this is set up another Caddy server at home, with (almost) the same Caddyfile, then, configure the local DNS resolver to route everything under your domain to that home Caddy. You may have to tweak the config a little to use DNS-based cert generation, since the public-resolvable domain names will never reach your internal Caddy server. Now, when you request Nextcloud, the request will not leave your house and there are no bandwidth constraints.

## Bonus 2: Nested WireGuard

Up until now, next to 80/443 I also had 51820 open in my home network for being able to connect into my home network from everywhere. For this I also needed an IP address, so in turn a publicly resolving domain, to connect to. Since a big part of this article is getting rid of exactly this, I wondered if I could replace the normal WireGuard setup with a nested one, so that I connect to some port on the VPS and the connection gets forwarded to the same WireGuard server as before.

This was shockingly easy, I didn't even have to change any WireGuard configs apart from the port on the clients (which I could have left the same in hindsight).

The previous setup listened on 51820 on the home network. We will now simply connect to 51821 on the VPS (since 51820 is already being used on there), which forwards to 10.0.60.2:51820 (the router from the point of view of our VPS). To enable this on the server we will need to:

1. Enable IP forwarding: `echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf && sysctl -p`
2. Enable masquerading: `firewall-cmd --zone=public --add-masquerade --permanent`
3. Enable the actual forwarding: `firewall-cmd --add-forward-port=port=51821:proto=udp:toport=51820:toaddr=10.0.60.2 --permanent`
4. Restart firewalld: `firewall-cmd --reload`

I'm sure this is possible with iptables rather than firewalld, but I have learned my lesson in fighting with iptables. If you've configured this on non-firewalld systems, I'd be happy to post the commands here.

Remember to change the port on your client devices (and change according the DNS records to point to the VPS), and it should work. One additional thing to improve performance it to reduce the MTU, since WireGuard headers take a few bytes off. The normal MTU is 1500, for a WireGuard connection it's 1420, so for a nested WireGuard we'll subtract another 80 and end up with 1340. Add `MTU = 1340` to your clients and the WireGuard server at home, and you are good to go!

## Bonus 3: Caching

Another advantage of this setup is, that it allows us to cache static content at the VPS, as not to use our home internet connection as much. I have to admit, I haven't looked into it too much yet, and there are many options, and this article is getting long, but I will revisit it in the future.
