---
date: "2022-12-11"
title: "Nextcloud on IIS"
draft: true
---

Does Nextcloud work on IIS? I recently googled that and only found results for XAMPP and friends installations on Windows server with maybe IIS as a reverse proxy. This wasn't a satisfying answer so I'm out trying it myself.

[https://docs.microsoft.com/en-us/iis/application-frameworks/install-and-configure-php-on-iis/install-and-configure-php](https://docs.microsoft.com/en-us/iis/application-frameworks/install-and-configure-php-on-iis/install-and-configure-php)

## Downloading PHP

8.0 not supported

## Configuring IIS

Don't forget to tick the checkbox for CGI

Random 500 - VCRUNTIME140.dll

PHP Error log

Extensions

Default page

tmp dir (both)

permissions IUSR

iisreset

errors only on localhost

username and permissions

url rewrite and htaccess import

## Installing Postgres

## Installing Nextcloud

## What works?

## Why would you want to do this?
