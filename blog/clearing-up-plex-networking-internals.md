# Clearing up Plex networking internals

> Published on Feb 2, 2023

Plex annoys me. Yet I have to admit it is by far the easiest thing to use for the end user.  If it weren't for that I would've switched to Jellyfin long ago.

One thing that has bugged me for years it how they manage their networking setups, and the bugs that lay within it. After I've been fighting against this for about half a decade, I feel confident enough writing a blog article on how to set up Plex behind a reverse proxy while avoiding all bugs. This includes their definition of "secure" connection, the often-ignored `X-Forwarded-For` header, proper IPv6, proper LetsEncrypt certificates and everything else I could think of.

## Reverse proxy

The first thing I install with every Plex server I set up is a reverse proxy. There are many options like Apache Httpd, Nginx, HAproxy, Traefik, ...

Personally, I use Caddy simply because I'm too lazy to set up certificates manually.

Setting up an SSL-terminating reverse proxy in front of Plex is a common practice, but rarely done right. In this example we'll use `plex.example.com` as the domain through which we want to access Plex and for which we get our certificates.

To set up a reverse proxy the proper way (and for the automatic certificate requests to work), you'll probably want to use the plain HTTP/HTTPS ports on your reverse proxy, and forward them to 32400 on the Plex host.

This is a supported configuration if, and only if, you configure Plex' "Custom server access URLs" to point to `https://plex.example.com:443`. Simply writing `plex.example.com` is *not* enough, since Plex will assume everything is still at port 32400, which it is not.

![Screenshot 2023-02-02 at 00.07.42.png](https://ruhrscholz.mataroa.blog/images/07e6259c.png)

Where does this address end up though? When an end user loads up `app.plex.tv`, the Plex Inc.-owned servers send a list of all possible locations at which the client can maybe access your Plex instance. This includes the "Custom server access URLs", but also the mystic `plex.direct`-URLs.

While you can easily check your browsers network request panel for those, I've cleaned up mine and pasted them below so you can get a feeling for that request:

```bash
curl 'https://plex.tv/api/v2/resources?X-Plex-Client-Identifier=REDACTED&X-Plex-Token=REDACTED' \
  -H 'accept: application/json' \
  | jq '.[] | select(.product=="Plex Media Server")'
```

```json
{
  "name": "☁️",
  "product": "Plex Media Server",
  "productVersion": "1.30.2.6563-3d4dc0cce",
  "platform": "Linux",
  "platformVersion": "9.1 (Lime Lynx)",
  "device": "PC",
  "clientIdentifier": "REDACTED",
  "createdAt": "2022-04-28T01:23:13Z",
  "lastSeenAt": "2023-02-01T17:28:02Z",
  "provides": "server",
  "ownerId": null,
  "sourceTitle": null,
  "publicAddress": "REDACTED",
  "accessToken": "REDACTED",
  "owned": true,
  "home": false,
  "synced": false,
  "relay": false,
  "presence": true,
  "httpsRequired": true,
  "publicAddressMatches": true,
  "dnsRebindingProtection": false,
  "natLoopbackSupported": false,
  "connections": [
    {
      "protocol": "https",
      "address": "plex.services.scholzserv.de",
      "port": 443,
      "uri": "https://plex.example.com:443",
      "local": false,
      "relay": false,
      "IPv6": false
    },
    {
      "protocol": "https",
      "address": "10.0.20.107",
      "port": 32400,
      "uri": "https://10-0-20-107.35aad435765REDACTED.plex.direct:32400",
      "local": true,
      "relay": false,
      "IPv6": false
    }
  ]
}
```


## plex.direct

What are those? Those are a clever measure taken by the Plex team to implement certificates for local IP addresses.

The domains are made up through combining the local IP (both IPv4 and IPv6 are supported) with your server ID and the Plex Inc.-owned `plex.direct` domain.

Fun fact: Their DNS server does not check the server ID (as long as it's 32 characters long, it doesn't even check for hex characters), it simply ignores it and resolves the local IP part:

```sh
dig A +short "123-123-123-123.YouCanWriteAnythingInHere1234567.plex.direct"

123.123.123.123
```

Those direct connections to the `plex.direct` domains are used even if your reverse proxy is set up correctly, since "secure" connections are preferred by the clients.

## "Secure" connections

You may say "But my reverse proxy uses HTTPS, isn't this a secure connection?". You would be right, if Plex made a sensible choice and honored the `X-Forwarded-Proto` HTTP header. But Plex being Plex doesn't to that. Instead, it just checks if the connection to the server itself is encrypted. Which it is not when you just write `http://10.1.2.3:32000` in your reverse proxy and call it a day.

Spoiler: `https://10.1.2.3:32400` won't work either since the server does not provide a certificate for that. The solution, while obvious to some, took me ages to figure out: You can simply put `10-1-2-3.insertyourserveridhere.plex.direct` in your reverse proxy. Of course, you'll have to insert your server ID this time, since your server only has a valid certificate for that specific subdomain. You can find that URL in your browser's network panel when loading Plex. In theory, this works with IPv6, however...

## IPv6 and X-Forwarded-For (X-Real-Ip)

...as soon as you do that, you won't be able to view the client's public IPs in the dashboard - everything will show up as the IPv6 address of your reverse proxy. Why? Bugs. The solution is to keep using IPv4 between the reverse proxy and the Plex host. Everything else can (and should be) IPv6, but the reverse proxy accessing the Plex host from an IPv6 address is a known bug in the forums, but of course nobody wants to fix it. The `X-Forwarded-For` header is only honored when the request comes from an [RFC1918](https://www.rfc-editor.org/rfc/rfc1918) IP range. Those are `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`, so if you have a "normal" internal network, you should be fine.

The good news is: Even though that connection is being sent over IPv4, the `X-Forwarded-For` header still contains the proper IPv6-value. This means all IPv6 clients work as they should and display the proper remote IP in your dashboard.

## Content-Security-Policy

If you want to go all the way, you may want to add Content-Security-Policy headers in your reverse proxy. Luckily there is a [post in the Plex forums](https://forums.plex.tv/t/guide-howto-reverse-proxy-header-hardening-csp-security-headers/676189) that explains the topic better than I ever could. Note however that those instructions are for Nginx, but if you've read up to this point you're probably able to apply this to the reverse proxy of your choice.

## Putting it all together

This has been a long post for two simple rules. The most important things seem to be:

- Set up the "Custom server access URLs" properly (including scheme and port)
- Make sure your reverse proxy connects to `https://10-1-2-3.insertyourserveridhere.plex.direct:32400` instead of just the IP

If there are any questions or things you would like to have clarified, check the list of my [socials](https://scholz.ruhr/socials/) on how to contact me and I may end up updating this article to clarify things!
