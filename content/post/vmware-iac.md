---
date: "2020-04-17T16:35:06.000Z"
draft: true
title: 'Quick Note: Combining IaC, cloud-init, and vCenter'
---

Since we are all in quarantine anyways, I have decided try out immutable infrastructure without using some big cloud provider. This article is more of a mental note for me, since I definitely will forget how I got this to work.

My homelab mainly consists of VMware boxes, and while they are great, there do not seem to be any simple guides on how to make infrastructure as code and configuation management work in an homelab. The ones I could find leveraged tools like Ansible, Salt, Puppet, etc., but we can do without them.

<!--more-->

## Immutable Infrastructure

I will not describe the concept of immutable infrastructure on here, there are plenty of great articles on its advantages:

> The benefits of an immutable infrastructure include more consistency and reliability in your infrastructure and a simpler, more predictable deployment process. It mitigates or entirely prevents issues that are common in mutable infrastructures, like configuration drift and snowflake servers. However, using it efficiently often includes comprehensive deployment automation, fast server provisioning in a cloud computing environment, and solutions for handling stateful or ephemeral data like logs. 
>
> [Source](https://www.digitalocean.com/community/tutorials/what-is-immutable-infrastructure)

## Infrastructure as Code

Infrastructure as code describes the process of deploying VMs, networking, storage, containers, etc. through simple code files.

It is absolutely great:
* You do not have to remember every little thing you have to change while setting up a server again.
* No updates, just delete the VM and deploy it again from a new template.
* Something breaks? You do not have to find the issue immediately, just deploy the last working commit from your git repo.

There are of course a lot of ways to do IaC, but I have chosen [Hashicorp Packer](packer.io) to create templates and [Terraform](https://www.terraform.io/) to deploy those onto my vSphere cluster. They are simple, modern, and have a great community.

## Configuration Management

One could "simply" use Ansible, Puppet, Salt, ...

But: [Provisioners are a Last Resort](https://www.terraform.io/docs/provisioners/index.html). They add unnecessary complexity to an otherwise relatively simple workflow. Also, we just do not need them. There's already [cloud-init](https://cloudinit.readthedocs.io/en/latest/#) for that. At least for my use case it offers solutions for pretty much everything I have to set up. Granted, you cannot easily change the configuration afterwards, but that is the point: You can always just redeploy the VM in a few seconds.

## Combining everything

Combining everything can be tricky.

### Template creation

The template creation is the easiest part. Just create a ```.json``` file using the [official guide](https://www.packer.io/intro/getting-started/build-image.html):

Mine looks like this:
```json {linenos=table}
{
  "variables": {
    "vcenter_server": "{{ env `vcenter_server` }}",
    "vcenter_username": "{{ env `vcenter_username` }}",
    "vcenter_password": "{{ env `vcenter_password` }}",
    "vcenter_insecure_connection": "true",
    "vm_name": "ci_debian-10",
    "cluster": "{{ env `vcenter_cluster` }}",
    "host": "{{ env `vcenter_host` }}",
    "datastore": "{{ env `vcenter_datastore` }}",
    "network": "{{ env `vcenter_network` }}",
    "guest_os_type": "debian10_64Guest",
    "iso_paths": "{{ env `vcenter_isopath` }} debian-10.3.0-amd64-netinst.iso"
  },
  "builders": [
    {
      "type": "vsphere-iso",
      "vcenter_server": "{{ user `vcenter_server` }}",
      "username": "{{ user `vcenter_username` }}",
      "password": "{{ user `vcenter_password` }}",
      "insecure_connection": "{{ user `vcenter_insecure_connection` }}",
      "vm_name": "{{ user `vm_name` }}",
      "cluster": "{{ user `cluster` }}",
      "host": "{{ user `host` }}",
      "datastore": "{{ user `datastore` }}",
      "network": "{{ user `network` }}",
      "ssh_username": "ci",
      "ssh_password": "Hashi123!",
      "ssh_pty": "true",
      "guest_os_type": "{{ user `guest_os_type` }}",
      "CPUs": 1,
      "RAM": 1024,
      "RAM_reserve_all": false,
      "disk_controller_type": "pvscsi",
      "disk_size": 32768,
      "disk_thin_provisioned": true,
      "network_card": "vmxnet3",
      "iso_paths": [
        "{{ user `iso_paths` }}"
      ],
      "boot_command": [
        "<esc><wait>",
        "install <wait>",
        "preseed/url=http://{{ .HTTPIP }}:{{ .HTTPPort }}/preseed.cfg <wait>",
        "debian-installer=en_US.UTF-8 <wait>",
        "auto <wait>",
        "locale=en_US.UTF-8 <wait>",
        "kbd-chooser/method=us <wait>",
        "keyboard-configuration/xkb-keymap=us <wait>",
        "netcfg/get_hostname=debian <wait>",
        "netcfg/get_domain=local <wait>",
        "fb=false <wait>",
        "debconf/frontend=noninteractive <wait>",
        "console-setup/ask_detect=false <wait>",
        "console-keymaps-at/keymap=us <wait>",
        "grub-installer/bootdev=/dev/sda <wait>",
        "<enter><wait>"
      ],
      "http_directory": "."
    }
  ],
  "provisioners": [
    {
      "type": "shell",
      "inline": [
        "curl -sSL https://raw.githubusercontent.com/vmware/cloud-init-vmware-guestinfo/master/install.sh | sudo sh -",
        "echo 'source /etc/network/interfaces.d/*' | sudo tee /etc/network/interfaces",
        "rm -rf /etc/network/interfaces.d/*"
      ]
    }
  ]
}
```


This script leads to the Debian VM trying to load a ```preseed.cfg``` file. Here is a fairly simple example, the important bit is, that it installs cloud-init:

```go-text-template {linenos=table}
d-i passwd/user-fullname string ci
d-i passwd/username string ci
d-i passwd/user-password password Hashi123!
d-i passwd/user-password-again password Hashi123!
d-i user-setup/allow-password-weak boolean true

choose-mirror-bin mirror/http/proxy string
d-i base-installer/kernel/override-image string linux-server
d-i clock-setup/utc boolean true
d-i clock-setup/utc-auto boolean true
d-i finish-install/reboot_in_progress note
d-i grub-installer/only_debian boolean true
d-i grub-installer/with_other_os boolean true
d-i mirror/country string manual
d-i mirror/http/directory string /debian
d-i mirror/http/hostname string httpredir.debian.org
d-i mirror/http/proxy string
d-i apt-setup/cdrom/set-first boolean false
d-i apt-setup/cdrom/set-next boolean false   
d-i apt-setup/cdrom/set-failed boolean false

d-i partman-auto/init_automatically_partition select biggest_free
d-i partman-auto/method string regular
d-i partman-auto/choose_recipe select atomic
d-i partman-partitioning/confirm_write_new_label boolean true
d-i partman/choose_partition select finish
d-i partman/confirm boolean true
d-i partman/confirm_nooverwrite boolean true

d-i passwd/root-login boolean false
d-i passwd/user-fullname string ci
d-i passwd/username string ci
d-i passwd/user-password password Hashi123!
d-i passwd/user-password-again password Hashi123!
d-i user-setup/allow-password-weak boolean true
d-i pkgsel/include string open-vm-tools openssh-server curl python3-pip cloud-init netplan.io
d-i pkgsel/install-language-support boolean false
d-i pkgsel/update-policy select none
d-i pkgsel/upgrade select full-upgrade
d-i time/zone string UTC
d-i user-setup/allow-password-weak boolean true
d-i user-setup/encrypt-home boolean false
tasksel tasksel/first multiselect standard, ssh-server
popularity-contest popularity-contest/participate boolean true
d-i preseed/late_command string \
    echo 'ci ALL=(ALL) NOPASSWD: ALL' > /target/etc/sudoers.d/ci ; \
    in-target chmod 440 /etc/sudoers.d/ci ;
```

For this to work, you will have to set your environment variables, and have ```debian-10.3.0-amd64-netinst.iso``` on your vCenter server:

```sh {linenos=table}
export vcenter_server=""
export vcenter_username=""
export vcenter_password=""
export vcenter_cluster=""
export vcenter_host=""
export vcenter_datastore=""
export vcenter_network=""
export vcenter_isopath=""
export vcenter_datacenter=""


export TF_VAR_vcenter_server=$vcenter_server
export TF_VAR_vcenter_username=$vcenter_username
export TF_VAR_vcenter_password=$vcenter_password
export TF_VAR_vcenter_cluster=$vcenter_cluster
export TF_VAR_vcenter_host=$vcenter_host
export TF_VAR_vcenter_datastore=$vvcenter_datastore
export TF_VAR_vcenter_network=$vcenter_network
export TF_VAR_vcenter_isopath=$vcenter_isopath
export TF_VAR_vcenter_datacenter=$vcenter_datacenter
```

At the end of the installation, Packer will download and run the script from the [vmware/cloud-init-vmware-guestinfo](https://github.com/vmware/cloud-init-vmware-guestinfo) repo. This is necessary to get the cloud-init files into our VM in the next step.

Also when using Debian, we have to install [netplan.io](https://netplan.io), because the default Debian networking configuration (```/etc/networking/interfaces```, ENI) is [not properly supported by cloud-init](https://cloudinit.readthedocs.io/en/latest/topics/network-config-format-eni.html). We have to delete the ENI because otherwise we end up with a DHCP address in addition to the static address we want.

You can now build the template using ```packer build debian-10.json``` and get a coffee. This will take a few minutes.

### VM Deployment

For this example, we are going to install a name server using PowerDNS and PowerDNS Recusor.

A simple Terraform definition file to achieve this looks like this:
```tf {linenos=table}
variable "vcenter_username" {}
variable "vcenter_password" {}
variable "vcenter_server" {}
variable "vcenter_cluster" {}
variable "vcenter_datastore" {}
variable "vcenter_network" {}
variable "vcenter_datacenter" {}

provider "vsphere" {
  user           = var.vcenter_username
  password       = var.vcenter_password
  vsphere_server = var.vcenter_server

  # If you have a self-signed cert
  allow_unverified_ssl = true
}

data "vsphere_datacenter" "dc" {
  name = var.vcenter_datacenter
}

data "vsphere_datastore" "datastore" {
  name          = var.vcenter_datastore
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_resource_pool" "pool" {
  name          = "${var.vcenter_cluster}/Resources"
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "network" {
  name          = var.vcenter_network
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "template" {
  name          = "ci_debian-10"
  datacenter_id = data.vsphere_datacenter.dc.id
}
resource "vsphere_virtual_machine" "ns1" {
  name             = "ns1"
  resource_pool_id = data.vsphere_resource_pool.pool.id
  datastore_id     = data.vsphere_datastore.datastore.id

  num_cpus = 1
  memory   = 512
  guest_id = "debian10_64Guest"

  network_interface {
    network_id = data.vsphere_network.network.id
  }

  disk {
    label            = "disk0"
    size             = data.vsphere_virtual_machine.template.disks.0.size
    eagerly_scrub    = data.vsphere_virtual_machine.template.disks.0.eagerly_scrub
    thin_provisioned = data.vsphere_virtual_machine.template.disks.0.thin_provisioned
  }

  clone {
    template_uuid = data.vsphere_virtual_machine.template.id
  }

  extra_config = {
    "guestinfo.metadata"          = base64encode(file("${path.module}/metadata.yaml"))
    "guestinfo.metadata.encoding" = "base64"
    "guestinfo.userdata"          = base64encode(file("${path.module}/userdata.yaml"))
    "guestinfo.userdata.encoding" = "base64"
  }
}
```

There is not much to say about this file, the provider variables are set through the environment variables, there is a file called ```env.sh.sample``` in the repo, to facilitate that process.
Except for that, it just copies the template we created beforehand. Also, one could separate the provider initialization into a different file, if creating multiple machines at the same time.

In the ```extra-config``` section, we are encoding the cloud-init files into base64 and passing them into the VM.

## Cloud-Init

Let's take a look at ```metadata.yaml```:

```yaml {linenos=table}
network:
  version: 2
  ethernets:
    ens192:
      dhcp4: false
      addresses:
        - 192.168.1.254/24
      gateway4: 192.168.1.1
      nameservers:
        search: [corp.example.com]
        addresses: [208.67.222.222, 208.67.222.220]


local-hostname: ns1.corp.example.com
instance-id: ns1
```

Yes, nothing special, just defining networking and hostname. What about ```userdata.yaml```?


```yaml {linenos=table}
#cloud-config
users:
  - name: merlin
    ssh-authorized-keys:
     - ssh-rsa AAAAB3NzaC1y...
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    groups: sudo
    shell: /bin/bash
  - name: ci
    lock_passwd: true    

packages:
  - pdns-server
  - pdns-recursor

write_files:
-   content: |
        launch=bind
        local-port=5300
        local-address=127.0.0.1
        bind-config=/etc/powerdns/bind/named.conf
    path: /etc/powerdns/pdns.conf
-   content: |
        forward-zones=corp.example.com=127.0.0.1:5300
        local-address=0.0.0.0
        local-port=53
    path: /etc/powerdns/recursor.conf
-   content: |
        options {
            directory "/etc/powerdns/bind";
        };

        zone "corp.example.com" IN {
            type master;
            file "corp.example.com";
        };
    path: /etc/powerdns/bind/named.conf
-   content: |
      ; corp.example.com
      $ORIGIN corp.example.com.
      $TTL 300
      @               300     IN      SOA     ns1.corp.example.com. root.corp.example.com. 2020041610 3H 1H 1W 1D
      @               300     IN      NS      ns1.corp.example.com.
      @               300     IN      NS      ns2.corp.example.com.
      vcenter         300     IN      A       192.168.1.10
      ; EOF
    path: /etc/powerdns/bind/corp.example.com
```

So, this is where the interesing stuff happens: Installing packages, setting up users, configuring our services, all in one file. Isn't it great? We do not even have to invoke this manually, it all happens through the magic of cloud-init!

Also, be careful when doing DNS. You _will_ shoot yourself in the foot at some point, especially when you need DNS to provision a DNS server. Never again.

## Conclusion

The HashiCorp tools are great. They enable me to just take this infrastructure, change a few environment variables and move it into the cloud. One thing I am missing from Terraform is official libvirt or Hyper-V support. I understand, Terraform is mainly made for cloud providers, but a few alternatives would be nice.

So far this whole has been working pretty good (except for some DNS mishaps), although it is just one of many ways to get started with immutable infrastructure. One of my next goals is setting ub NixOS, since it promises to deliver a similar experience with less external tooling.

One last but annoying thing is the networking setup: I just could not get cloud-init to configure the VM without a dynamic address, there is always one defined in ```/etc/network/interfaces.d/50-cloud-init.cfg```. If you know a way to fix this, I'm open for suggestions!