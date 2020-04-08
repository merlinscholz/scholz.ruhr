---
title: "How I do logging"
date: 2020-04-07T17:43:54+01:00
draft: true
#images: ["signpost.jpg"]
tags: ["privacy", "webdev"]
summary: "Switching away from Google Analytics and keeping the users privacy intact."
---

Today marks the day I disabled Google Analytics for my site and deleted my Analytics account.

## Why?
Privacy.

## But what if I still want to know how many readers I get?
Server-side analytics.

## I don't run my own web server, what to do now?
I don't either, this blog is currently being build and served through [Netlify](https://www.netlify.com/). While they offer server-side log analytics, it'd cost $9/month, which seems to be a fair price, I don't really want to spend that much on a hobby website. So I rolled my own analytics.

## How?

This blog runs on Hugo. I adapted the theme to be able to include custom logging code:

```go-html-template
<!-- ./themes/mscholz.dev-theme/layouts/_default/baseof.html -->
	{{ if templates.Exists "partials/customAnalytics.html" }}
		{{ partial "customAnalytics" }}
	{{ end }}
</body>
</html>
```

Through the ```if templates.Exists```, whoever uses the theme can decide for himself if he wants to include analytics code.

The analytics itself consists of just a single tracking pixel, and will only be enabled if the Do-Not-Track flag isn't set:

```go-html-template
<!-- ./layouts/partials/customAnalytics.html -->
<script>
    if(navigator.doNotTrack != 1) {
        if (window.location.hostname == 'mscholz.dev') {
            var _pixel = new Image(1, 1);
            _pixel.src = "https://example.com/pxl.gif?u=" +
            encodeURIComponent(window.location.pathname) +
            (document.referrer ? "&r=" + encodeURIComponent(document.referrer) : "");
        }
    }
</script>
```

Also, we do not make use of the ```<noscript>``` tag, again, to protect the users privacy in case they have disable JavaScript.

This code has been adapted from [Tim Nash](https://timnash.co.uk/pixel-tracking-with-nginx-a-tiny-bit-of-javascript/) and thus, [Ben Hyot](https://benhoyt.com/writings/replacing-google-analytics/).

## But using Cloudfront still costs money, doesn't it?

That's right, but we won't be using Cloudfont. We will use our trusty Homelab (although a Raspberry Pi should do too).

I set up a CNAME record on pxl.mscholz.dev, which does not, like mscholz.dev, point to Netlify, but to the IP address of a webserver I have control over. In this case, I am running Nginx:

```nginx
# /etc/nginx/sites-enabled/pxl.mscholz.dev.conf

server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;

        server_name pxl.mscholz.dev;

        ssl_certificate /etc/letsencrypt/live/mscholz.dev/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/mscholz.dev/privkey.pem;
        ssl_trusted_certificate /etc/letsencrypt/live/mscholz.dev/chain.pem;

        include nginxconfig.io/security.conf;

        location / {
                return 301 https://mscholz.dev;
        }

        location /pxl.gif {
            set $referrer $arg_r;
                set $rurl $arg_u;
                empty_gif;
                access_log /var/log/nginx/pxl.mscholz.dev/pixel.log pixel;
        }

        include nginxconfig.io/general.conf;
}

server {
        listen 80;
        listen [::]:80;

        server_name .pxl.mscholz.dev;

        include nginxconfig.io/letsencrypt.conf;

        location / {
                return 301 https://mscholz.dev;
        }
}
```

Appearantly, nginx even contains [a directive to serve an empty 1x1px GIF](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html).

The above code assumes a custom Nginx [log format called "pixel"](https://timnash.co.uk/pixel-tracking-with-nginx-a-tiny-bit-of-javascript/) has been loaded:

```nginx
# /etc/nginx/conf.d/log_pixel.conf
log_format  pixel  '$remote_addr - $remote_user [$time_local] "$rurl" '
            '$status $body_bytes_sent "$referrer" '
            '"$http_user_agent" "$http_x_forwarded_for" ';
```

## Now I've got the logs. What to do now?

Analyze them! The most popular software for this purpose seems to be [GoAccess](https://goaccess.io/), so let's try it out: