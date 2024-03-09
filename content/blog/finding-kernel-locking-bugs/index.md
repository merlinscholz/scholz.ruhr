---
title: "Finding Kernel Locking Bugs with LockDoc"
date: "2023-12-08"
draft: true
---

This post will be my attempt to package up my master's thesis in a format that can be read comfortably. I've spent the last 15 months mostly on this topic, and if you've noticed that some of my past posts mostly revolved around NetBSD, this is why. I hope this also gives me the opportunity to shine a light on some implementation details, since the thesis itself had to be mostly focused on the academic stuff.

## Locking is Hard

{{/* Grob/Fein */}}

## Locking a Kernel

Ages ago, when computer only had a single processor and that single processor only had a single core, locking was pretty easy. No need to lock when there physically can't be any concurrency, right? Well, with one exception, interrupts are things that can happen. But even that isn't such a big issue: You just wait for the higher-prioritiesed interrupt to finish.

But then the 1990's happened and people decided to cram more processors into a computer and invent something called SMP -- symmetrig multiprocessing. A need for proper synchronization arised suddenly. Almost all major (open-source) operating systems solved this the same way back then: They just added a lock for the whole kernel. This was often called the [Giant Lock](https://en.wikipedia.org/wiki/Giant_lock) or Big Kernel Lock, depending on what OS you were working on. It was simple, as soon as one process did some kernel level stuff through syscalls, the entire kernel would be locked for other processes. Process A wants to send network packets while Process B is reading something from the disk? Tough luck.

As you can imagine, this was terrible for performance. Only one process doing important kernel stuff at the time definetly is no permanent solution. That's why the developers started to add more locks, specifically they started out with locks per kernel subsystem for the most often used ones. Imaging one lock for networking, one for disk I/O, etc. This made other kernel subsystems faster too, since those didn't have to wait for the more used ones.

This adding and slowly removing of the Big Kernel Lock also allowed the developers to carefully plan on how to do the locking properly, instead of being forced to find a working solution as fast as possible. The BKL got added to the Linux kernel in 1996 and removed again in 2011. In other operating systems, like FreeBSD, you can still find some remnants of it if you [look carefully](https://github.com/freebsd/freebsd-src/commit/2dedf41fde95b9ac804ee643ff66428c9d2ac723).

## The Single Source of Truth

Where there is code, there should be comments. If you've ever worked on kernel code, you may know how that isn't always the case. But let's assume everything is commented properly. You are a dev and you want to add a driver for your new fancy webcam that isn't supported yet in your favourite OS. So you start looking on how to do proper locking of the USB stack and maybe some video subsystem, there is some stuff to interface with. That's when you notice some inconsistencies:

- The documentation says you should use lock Foo
- Existing code for other webcams uses lock Bar

How do you know what to use? What is the right way to do it? Also, are Foo or Bar even the right locks to use? Both of those could be wrong and you may have to use lock Baz.

In your quest to write a webcam driver there may not be comments at all. You may have to work off of existing code. Or there is documentation in the code, but it may have a lot of different forms. Is it a [prose text in the code](https://nxr.netbsd.org/xref/src/sys/kern/vfs_vnode.c?r=1.149#134)? Some [commented-out code that is being kept around as a reference](https://nxr.netbsd.org/xref/src/sys/kern/sys_futex.c?r=1.19#43)? Some [embedded ASCII-diagrams](https://nxr.netbsd.org/xref/src/sys/kern/vfs_cache.c?r=1.155#110)? Also, depending on the kernel, documentation may actually not be in the kernel code itself? Is it in the man-page? Some book? Some kernel dev mailing lists? I've seen documentation only existing in long-forgotten IRC chats.

Working further along, you see code that is intentionally written wrong, it doesn't use locks for "[performance purposes](https://nxr.netbsd.org/xref/src/sys/uvm/uvm_aobj.c?r=1.157#454)". Is that code wrong if it works as it should?

As you can see by know, working on kernel code can be hard, since there is no single source of locking truth to rely on. There isn't even a way to define "correct" locking. So there is a good chance that code may be incorrect, since kernel development is hard. How do we find such issues?

## Methods to Analyze Locking

There have been some attempts of finding kernel issues. You usually can put them into one of the four categories:

### Dynamic Analysis

One way of doing thigs is the dynamic approach, also called on-the-fly analysis. You first modify the code you want to analyze in such a way that it checks the current locking state after every relevant operations, be it actual locking operations, variable accesses, or depending on the implementation even memory accesses in general. Afterwards, the goal is to run as many code paths as possible to achieve maximum code coverage, and thus check the most locking states.

This method has some advantages. One if them consists of the fact, that only actually executable code-paths are being analyzed. This may sound obvious, but as you will see later, is not a given with some of the other approaches. Another pro of this approach is the lack of abstraction layer which could affect the results.

The dynamic analysis has a good chunk of disadvantages though. For one does it require an additional computational overhead at runtime. In the worst case, this can lead to some race conditions not occuring anymore, since the code is running slower. Furthermore, the analysis of time-sensitive code (i.e. software that interfaces with the outside world) is usually not possible anymore.

The last disadvantage is that at the time of analysis of a specific line of code, only past states are known. This is in contrast to analysis methods that do the heavy-lifting after the program has finished execution, where at any given point all memory accesses, past or "future", are known.

### Static Analysis

### Model Checking

## LockDoc

### How does it work?

### Locking-Rule Derivation

### Analysis

## Implementation

### Basic Modifications

### Instrumentation

### Challenges

## Results

## Want More Details?

You've read through this and still aren't bored yet? Good news, you can [read my entire, German thesis](./Untersuchung%20der%20Kernsynchronisation%20in%20NetBSD%20mittels%20LockDoc.pdf) right now!

Also if you have any questions, I'm happy to answer them! Shoot me a message on [Matrix](https://matrix.to/#/@ruhrscholz:kif.rocks), [Mastodon](https://toot.kif.rocks/@ruhrscholz), or an [email](mailto:hi@scholz.ruhr)!
