# Automatically keeping Plex (or anything) up-to-date on NixOS

> Published on Apr 9, 2022

This week I'm rebuilding my homeserver on a NixOS base. After I migrated Plex over, I got annoyed by the constant warnings that the used Plex version is out of date.

## The manual way

Searching the NixOS forums, there are ways to manually specify a path to the Plex deb/rpm, meant to provide Plex Pass users with an option to use their current version:

```nix
services.plex = let plexpass = pkgs.plex.override {
  plexRaw = pkgs.plexRaw.overrideAttrs(old: rec {
    version = "<new version number>";
    src = pkgs.fetchurl {
      url = "https://downloads.plex.tv/plex-media-server-new/${version}/debian/plexmediaserver_${version}_amd64.deb";
      sha256 = "sha256-<file hash>";
    };
  });
}; 
in {
  enable = true;
  openFirewall = true;
  package = plexpass;
};
```

Manually updating this and recalculating this every time you get the Plex notification gets tedious after about a week. 

## The slightly-faster-than-default way

One alternative consists of not using the nixos-21.11 channel (or whatever the current one is), but instead nixos-unstable. Of course, on a server, you'll only want to do this for the Plex package. Another problem is that you'll either have to add the unstable channel manually via `nix sudo nix-channel --add https://nixos.org/channels/nixos-unstable nixos-unstable` or use the way described further down.

```nix
services.plex = let
    master = import <nixos-unstable> {};
in {
    enable = true;
    openFirewall = true;
    package = master.plex;
};
```

This works, but requires manual intervention prior to applying the configuration. This is not an option for me, since I (try to) use ephemeral NixOS containers.

## The GitHub-master-branch way

While looking at the `plex/raw.nix` files on GitHub, I noticed that the master branch was updated only a day ago, with the current Plex version number. Why not just use that branch?

```nix
services.plex = let
    master = import
        (builtins.fetchTarball https://github.com/nixos/nixpkgs/tarball/master)
        { config = config.nixpkgs.config; };
in {
    enable = true;
    openFirewall = true;
    package = master.plex;
};
```

A couple things to note:

- This is not the clean Nix way, as we automatically fetch the current version numbers from GitHub
- We use builtins.fetchTarball because:
    1. `pkgs.fetchFromGitHub`, `pkgs.fetchFromGit`, ... are meant for reproducible use cases and thus require a hash.
    2. `builtins.fetchGit` needs git installed and loads all revisions, which takes a long time.

A more efficient way could consist of only loading the [plex/raw.nix](https://github.com/NixOS/nixpkgs/blob/master/pkgs/servers/plex/raw.nix) file, but using the whole nixpkgs repo seems like a cleaner solution to me.
