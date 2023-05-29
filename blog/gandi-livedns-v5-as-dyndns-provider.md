# Gandi LiveDNS v5 as DynDNS provider

> Published on Apr 3, 2022

This is just a simple `curl` command to put in your crontab that updates some domain managed by [Gandi LiveDNS v5](https://api.gandi.net/docs/livedns/). The reason behind this is that while [DDclient](https://github.com/ddclient/ddclient) has a PR that enables Gandi support, the project itself doesn't seem to be actively maintained anymore (see recent issues).

Replace the domain and API key with your own ones and put the following into your cron file:

```shell-session
curl -d "{\"items\":[{\"rrset_type\": \"A\", \"rrset_values\": [\"$(dig +short myip.opendns.com @resolver1.opendns.com)\"]}]}" -X PUT -H "Authorization: Apikey REDACTEDAPIKEY" -H "Content-Type: application/json" https://api.gandi.net/v5/livedns/domains/example.com/records/foobar > /root/last_dyndns_out.txt 
```

The current configuration uses `REDACTEDAPIKEY` to change `foobar.example.com` to the IP address obtained by a DNS request to `myip.opendns.com`. Make sure you have dig installed!

Optionally, pipe the output into some file you check regularily, into a logging system, or Email it automatically.
