---
date: "2023-05-01"
title: "Fighting NetBSD's serial console management"
---

Listen to me rant about a bug I faced over the last weeks.

## Context

I'm (still) working on a project where I have to emulate NetBSD (9.3) in Bochs. You may remember my [earlier issues](https://scholz.ruhr/blog/the-quest-to-run-netbsd-on-bochs/).

Part of this task is to have the emulator run without a GUI (so I can run experiments in the background via tmux/screen/nohup/...). I also have to have at least three serial ports (remember those?). The first ones, com0 and com1, are for internal purposes of this experiment, while the goal of the third one, com2, was to have NetBSD print all the stuff it used to print to Bochs' emulated VGA to com2 instead, once again so I can run everything without a GUI and still keep track of the experiments.

Sounds easy, right?

I've struggled with NetBSD, Bochs, and serial communication once before, so I thought this should be doable.

> Note: I'll zero-index every com-port in this article, even though NetBSD and Bochs love to mix it up with com0 and com1 as the first one. This added a whole new layer of issues.

## Prologue: Printing console messages

The first problem was printing some debug information and control messages from a Bash script in NetBSD out to com0.

My first (obvious) attempt? `echo "test" > /dev/tty00`. Hangs indefinetly. That's where I sat the first day. Luckily, I had code examples from Linux and FreeBSD, since at this point I was mostly just porting code over. So I read those and read the NetBSD manuals, until I noticed [this paragraph](https://man.netbsd.org/NetBSD-9.3/termios.4#DESCRIPTION):

> When a terminal file is opened, it normally causes the process to wait until a connection is established. For most hardware, the presence of a connection is indicated by the assertion of the hardware CARRIER DETECT (CD) line.  If the termios structure associated with the terminal file has the CLOCAL flag set in the cflag, or if the O_NONBLOCK flag is set in the open(2) call, then the open will succeed even without a connection being present.

A nice, easy explanation on why it may hang, and suggestions on how to fix it. Perfect. But, *of course*, Bochs doesn't support any form of Carrier Detect, and the corresponding part is just stubbed out in its source. So I checked how to set the `CLOCAL` flag instead to override that issue. Usually, you do this via [stty(1)](https://man.netbsd.org/NetBSD-9.3/stty.1). I copied a working `stty` line from the FreeBSD version, just to be greeted with the same hanging shell script as earlier.

Let's modify the script again, set `CLOCAL` and print it out afterwards: It didn't even change. Some quick googling revealed a thread in the FreeBSD mailing list on how to do it there: [https://www.mail-archive.com/freebsd-stable@freebsd.org/msg136202.html](https://www.mail-archive.com/freebsd-stable@freebsd.org/msg136202.html).

The trick in this mail isn't even documented anywhere in FreeBSD.

And it uses a command that isn't even implemented in NetBSD 🙂.

At this point I had enough and did [what everybody would do](https://github.com/ruhrscholz/lockdoc-netbsd/commit/0e44bf4b6cc27acd40d8a7b5d3342a233d22ed25) in `sys/kern/tty.c`:
```c
#ifndef EXPERIMENT
#define	CONNECTED(tp)	(ISSET(tp->t_state, TS_CARR_ON) ||	\
			 ISSET(tp->t_cflag, CLOCAL | MDMBUF))
#else
/* Circumvent Bochs' interesting com* implementation */
#define	CONNECTED(tp)	true
#endif
```

That worked. Current tally: Two days wasted.

The next issue was disabling VGA and printing everything to the first free com port, which is com2.

## Handing off control

There are multiple ways to tell NetBSD where to print everything it has to say. You can either specify a `consdev` in the [bootloader config](https://man.netbsd.org/NetBSD-9.3/boot.cfg.5), like so:

```
menu=Boot normally:rndseed /var/db/entropy-file;consdev com2;boot netbsd
```

Or override that one in the kernel config via `CONSDEVNAME`, `CONSDEVADDR`, `CONS_OVERRIDE`, [and some more](https://man.netbsd.org/NetBSD-9.3/i386/console.4).

The first option is the new, preferred, streamlined one, so I tried it, exactly like it says above. It worked, I could see my kernel messages on my (virtual) com2, up until the point where the com management was handed off from the bootloader/BIOS to the kernel. In NetBSD, this is around the time the switch from kernel code to the init system (`/etc/rc`) happens. At this point I was greeted by my *favorite* error from the previous article:

```
cnopen: no console device
```

A text I absolutely dreaded at this point. From my previous attempt I already learned that, while the bootloader just prints to whatever it can access, NetBSD likes to check first and initialize all devices properly, so let's see what it has to say in the kernel debug messages:

```
[   1.0303504] com0 at acpi0 (COM1, PNP0501-1): io 0x3f8-0x3ff irq 4
[   1.0303504] com0: ns16550a, working fifo
[   1.0303504] com1 at acpi0 (COM2, PNP0501-2): io 0x2f8-0x2ff irq 3
[   1.0303504] com1: ns16550a, working fifo
[   1.0303504] apm0 at acpi0: Power Management spec V1.2
```

You see the first issue? No com2, as expected from the error message. While the bootloader just *assumes* the com ports are at their usual 0x3f8, 0x2f8, 0x3e8 and 0x2e8 and just sends all it wants there, NetBSD decides to go for a more careful approach and rely (in the default configuration) on ACPI to check whether the ports are there. There was no port 2.

Next step: Let's check the [Bochs ACPI source code](https://bochs.sourceforge.io/cgi-bin/lxr/source/bios/acpi-dsdt.dsl) and have our suspicions confirmed: There is no com2 in the ACPI DSDT.

By the way, there are at least 20 different ways to set up com ports in that config, so I just commented out everything but ACPI. I needed a minimal test setup after all.

## Ignoring ACPI

The (I assumed) logical next step was to just comment out the [ACPI com detection](https://github.com/NetBSD/src/blob/654dd71243cd7229d0174117e9a2ddf5fd5ca7a6/sys/arch/i386/conf/GENERIC#L324) and re-enable [the hard-coded ports](https://github.com/NetBSD/src/blob/654dd71243cd7229d0174117e9a2ddf5fd5ca7a6/sys/arch/i386/conf/GENERIC#L576-L579) in the kernel config:

```
com0	at isa? port 0x3f8 irq 4	# Standard PC serial ports
com1	at isa? port 0x2f8 irq 3
com2	at isa? port 0x3e8 irq 5
#com3	at isa? port 0x2e8 irq 9
```

Compile, push the kernel to NetBSD via `scp`, shut down NetBSD in Qemu, boot the image in Bochs, rinse and repeat.

This time, while handing the com control over from the bootloader/BIOS to the init system, it just printed a single, lonely `p`, and hangs forever.

## Misdirected letters

Some additional context: The single, lonely `p` is something that is printed as part of the "experiment". It usually is printed via embedded assembly to port 0x0e9, which is a debug port in Bochs. Since you don't get that many stray `p`s in your console messages, I assumed that's where it came from, and thought it just somehow was being misdirected by me interfering with the usual init procedure. I turned off the "experiment" in the custom NetBSD init code and had it boot normally. This time I was greeted by an `M` at the exact same point. Confusion.

I was getting desparate (this was day 3 or 4 of me fighting this bug), and decided to just mess around with the kernel config, bootloader config, etc. VGA still worked normally, just com didn't. I set the bootloader to redirect everything to com0 (instead of com2) to get a better picture of what exactly fails. Same point in the startup (around 30 minutes in), the handoff between BIOS and init, and what does it print?

```
Mon May  1 23:44:24 CEST 2023
```

That's the source of the mysterious `M`. Of course, I enabled the experiment again, still printing everything to com0, and got 

```
pre-init script...
```

The source of the mysterious `p`. It didn't come from the debug messages, it somehow just stopped printing after the first character after the handoff! But why did it only work on VGA, com0, but not on com2?

## Resolution

Remember the com init code from earlier?

```
com0	at isa? port 0x3f8 irq 4	# Standard PC serial ports
com1	at isa? port 0x2f8 irq 3
com2	at isa? port 0x3e8 irq 5
#com3	at isa? port 0x2e8 irq 9
```

The snipped that is exactly like this in the GENERIC NetBSD kernel config? 0x3f8, 0x2f8, 0x3e8, 0x2e8. I knew them by heart now, but I was getting more desparate. I [checked Wikipedia](https://en.wikipedia.org/wiki/COM_(hardware_interface)) just to be sure. The addresses were correct, as I expected from, once again, the *upstream* config. But the IRQs weren't! They should be IRQ 4, 3, 4 and 3, respectively. But the config says 4, 3, 5, 9.

Replace those, switch back to com2, recompile, push, wait. And it works. I still can't believe it as I'm writing this. 

The conclusion? No clue, maybe triple-check everything even though it should be correct? Learn IRQs by heart, even in 2023? Don't use decade-old technology? Interpret it how you want.
