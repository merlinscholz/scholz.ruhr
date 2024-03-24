---
title: "Finding Kernel Locking Bugs with LockDoc"
date: "2023-12-08"
draft: true
---

This post will be my attempt to package up my master's thesis in a format that can be read comfortably. I've spent the last 15 months mostly on this topic, and if you've noticed that some of my past posts mostly revolved around NetBSD, this is why. I hope this also gives me the opportunity to shine a light on some implementation details, since the thesis itself had to be mostly focused on the academic stuff.

> Warning: This article probably ends up as a leaving and breathing text, meaning I will fix or extend stuff as I notice it/want to. Also, since this is my personal research project, don't take everything you find in here as a hard truth, there probably are some errors in here. If you find errors or want more details on some topics, shoot me an email or a DM and I'll be happy to extend this article.

## Locking is Hard

Locking is hard. There are some ways to do get right, and even more ways to do it wrongly. One example on why locking is difficult is figuring out how coarse to lock. If you're just slapping a single big lock onto your codebase (more on that later), you're probably not running into any race conditions, but are sacrificing performance. On the other hand, if you're read/write locking every single field in every single data structure, you're prone to getting confused and making errors sooner or later, and are also sacrificing performance, due to the pure locking overhead compared to your actual calculations. Also, if you're doing this, good luck on reading your code a few weeks later. All those locking-related lines usually make it impossible to figure out.

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

This method has some advantages. One if them consists of the fact that only actually executable code-paths are being analyzed. [^2] This may sound obvious, but as you will see later, is not a given with some of the other approaches. Another pro of this approach is the lack of abstraction layer which could affect the results. Analyzing the data at runtime also means you don't need to permanently store every single memory access or locking operation, greatly reducing the storage overhead.

The dynamic analysis has a good chunk of disadvantages though. For one does it require an additional computational overhead at runtime. In the worst case, this can lead to some race conditions not occuring anymore, since the code is running slower. Furthermore, the analysis of time-sensitive code (i.e. software that interfaces with the outside world) is usually not possible anymore.

The last disadvantage is that at the time of analysis of a specific line of code, only past states are known. This is in contrast to analysis methods that do the heavy-lifting after the program has finished execution, where at any given point all memory accesses, past or "future", are known.

### Post Mortem Analysis

The post mortem analysis divides the dynamic analysis into two parts. At first, the program you want to analyze is being run as before, traversing as many different code paths as possible. This time, however, you don't analyze every single memory acces or locking operation. You store them in a big database for later analysis (after the program has finished, i.e. post mortem).

This enables the re-use of the toolchain used to analyze operations, since you don't have to embed it deeply into your software anymore. You can simply use it for multiple different pieces of code.

However, using post mortem analysis, you lose a big pro of dynamic analysis. This time, you have to store every single operation (if you can afford to), or risk missing out on issues. This kind of tracing should not be an issue anymore today, as memory sizes keep increasing at a drastic speed. For exact figures, keep reading on to out tests.

Dynamic analysis has had the issue of not knowing about "future" memory accesses/lock operations while checking any given method. This also is solved by post mortem analysis, as the analysis happens after all lock/memory operations have occured.

### Static Analysis

The exact opposite of dynamic analysis is the static analysis. Using this method, the code that should be analyzed is never being run. Instead, the process looks at the source code itself.

One big advantage of this methology is that you can analyze code paths that are very rarely being executed in real-world scenarios, making them usually difficult to analyze, and eliminating the biggest disadvantage of dynamic analysis.

But to efficiently use static analysis, you have to add annotations to your code. Researches quote around 20 lines of annotations per 1.000 lines of code. [^1] What doesn't sound too bad at first, would result in about 2.400 man-hours just to annotate an operating system kernel. [^2] Keep in mind, that paper is from 2003, meaning since OS kernels only grew since then, so do the needed annotations.

[^1]: [Type-based race detection for Java](https://dl.acm.org/doi/abs/10.1145/349299.349328)
[^2]: [RacerX: effective, static detection of race conditions and deadlocks](https://dl.acm.org/doi/abs/10.1145/1165389.945468)

One more big disadvantage of static analysis consists of pointer usage in programming languages like C. Since a tool for static analysis doesn't have access to runtime information like memory contents, it is often not possible to follow pointers around the memory map. [^3] The topic of pointer analysis is an active research field, and thus, not solved yet. [^4]

[^3]: [LockDoc: Trace-Based Analysis of Locking in the Linux Kernel](https://dl.acm.org/doi/abs/10.1145/3302424.3303948)
[^4]: [Pointer Analysis](https://www.nowpublishers.com/article/Details/PGL-014)

### Model Checking

The last clearly defined option for code analysis is model checking. With this method, you convert the existing code into an equivalent model, often described as a state diagram. [^5] Using this method, you run your model through as many different code paths as possible, hoping to find errors in the original code. This method bears two main disadvantages, the first one being the conversion of your original code into a model. Either you need some software to do this for you (how do you even check whether the software is correct), or you need a lot of man-hours of porting your code over into the model. This usually requires deep domain knowledge of your software, meaning not everyone who wants to check your code can do it.

[^5]: [Model checking](https://link.springer.com/chapter/10.1007/BFb0058022)

Even if you manage to port your complete code base over into the model, it is pretty difficult to ensure the two systems are bug-for-bug identical. What about caches, do you model those? I/O? How do you handle communications to external systems?

Model checking does have its advantages though, like complete stack traces for errors, resulting in a lower rate of false positives. It is also suited to analyze dynamic memory allocations [^5] (compared to the other methods listed above).

## LockDoc

LockDoc is based on previous work done in [LockDoc: Trace-Based Analysis of Locking in the Linux Kernel](https://dl.acm.org/doi/abs/10.1145/3302424.3303948). It is based on post mortem analysis as described previously.

### How does it work?

One big and important assumption of LockDoc is: "The majority of the program code to be examined works correctly. Errors are rare."

This assertion can be proven by the fact that with a similar density of lock operations per code path, a large proportion of the lock operations take place in frequently executed code. The operating systems being analyzed are often used in massive amounts across the world, and per instance of a given kernel, the important code paths are being used very regularly. From this we can conclude, that possible race conditions or deadlocks probably have happened already, and have subsequently been fixed. You can also prove this assumption through the inverse: If an operating systems is riddled with bugs, it would most probably be unstable and would thus not being used as much.

That's where LockDoc begins: For any given data structure, it is presumed that before it is being accessed, all neccessary locks have usually already been set correctly. Since this complete data set is known using post mortem analysis, we can build hypothesis on how a data structure is intended to be locked.

### Monitoring/Tracing

### Locking-Rule Derivation

### Analysis

You should now have a set of presumably correct locking rules for every data structure relevant to you. What now? You can use those for three main purposes:

1. Use the _Locking-Rule Checker_ which compares the generated locking rules to those that are actually documented, with the aim of finding documentation bugs.
2. Use the _Rule-Violation Finder_ which focuses on comparing existing code traces with the "correct" locking to find bugs in the code. This is the main focus of this thesis.
3. Use the _Documentation Generator_ to generate new locking documentation for existing code.

## Implementation

To actually use the LockDoc approach in combination with NetBSD, a bunch of work has to be done in order to make the two play nicely with each other.

I started off with NetBSD 10.99.5 (CVS snapshot from 2023/07/07, Git Commit `88b01cb4e58810347a8cd0b5edf74bd546f8e4c0`).

### Basic Modifications

First of all I needed a basic kernel config, including only the parts neccessary to boot in the Bochs-based emulators, no more and no less. No more is especially important, since including unneeded kernel subsystems results in longer runtimes and more interferences in the analysis. This is where I lost my mind the first time, as [Bochs and NetBSD's graphic drivers are not exactly friends](https://scholz.ruhr/blog/the-quest-to-run-netbsd-on-bochs/).

There were some other changes requried to make NetBSD automatically boot into the benchmarks/test suites, since we don't have any interactive access to the system during analysis. That's where I lost my mind a second time, as [Bochs took a few shortcuts in its serial console management](https://scholz.ruhr/blog/fighting-netbsds-serial-console-management/).

#### Communication

To enable communication between the NetBSD kernel and the emulator, we implement an `extern struct log_action la_buffer`, as can be seen here:

```c

struct log_action {
	enum LOCKDOC_OP action;
	int32_t ctx;
	uint32_t lock_op;
	uint32_t ptr;
	uint32_t size;
	char type[LOCKDOC_LOG_CHAR_BUFFER_LEN]; // allocated data_type or lock type
	char lock_member[LOCKDOC_LOG_CHAR_BUFFER_LEN];
	char file[LOCKDOC_LOG_CHAR_BUFFER_LEN];
	int32_t line;
	char function[LOCKDOC_LOG_CHAR_BUFFER_LEN];
	int32_t preempt_count;
	int32_t irq_sync;
	int32_t flags;
}__attribute__((packed));
```

This struct holds [information about what message we want to send to the emulator](https://gitlab.fachschaften.org/merlinscholz/lockdoc-netbsd/-/blob/lockdoc-10.99.5-vfs/sys/sys/lockdoc_event.h?ref_type=heads#L54) (is the current message a memory (de)allocation, a locking operation, or memory locations to remember for later), and also the source where the current code is being called from.

If you want more context, you can also take a look at the [final kernel source](https://gitlab.fachschaften.org/merlinscholz/lockdoc-netbsd/-/blob/lockdoc-10.99.5-vfs/sys/sys/lockdoc.h?ref_type=heads#L23).

Furthermore, we have to adapt the NetBSD kernel so that the emulator knows information about the memory layout. What use is this buffer when the emulator doesn't know how to find it? To achieve this we go the easy way and just print the memory location over serial on kernel startup. From that point on we can use the buffer to send data, and some important data we need on startup are the memory location of the current kernel thread (LWP in NetBSD lingo), the memory location of the LWP flags (so we can see whether we are in an interrupt handler), the location of the PID, and some basic metadata info like the version of the kernel being tested.

### Locking operations

For LockDoc to actually be able to do its magic, we need information about relevant locking operations and memory accesses.

To get locking information we "simply" replace the original mutex.h and rwlock.h with our own methods, which write relevant statistics like memory location, file and line the lock is being accessed from, etc. to the buffer, tell the emulator to read and store them, and then actually do the locking operations.

We do a similar thing for interrupt handling, as those can be seen as locking operations too: After all, they temporarily disable concurrency. For this reason, we also redefine `x86_disable_intr`, `x86_enable_intr`, `trace_irqs_on` and `trace_irqs_off`.

### Memory accesses

It is not easily manageable to log every single memory access that happens during the entire runtime of our emulated machine. There are simply too much. But we don't have to do that. Since we focus on the VFS subsystem, we pick out the relevant data structures like vnodes or mounts and only log access to those. How do we achieve that?

There is a lovely `lockdoc_log_memory` function call at every code path that initializes such a data structure. That function sends information to the FAIL\* emulator, telling it to watch the memory that has been allocated, and log every access to it. At the end of the lifetime of this data structure, we call `lockdoc_log_memory` again, telling it to not watch this memory section anymore, since it has been deallocated.

While this may seem like a dauting task, there are actually very few code paths that have to be modified. If we for example look at `struct vnode_impl`, we can easyily grep the entire codebase to allocs of this data structure. There are only two code paths that do that, so we only have to add two lines to the kernel code, plus 2 more for the deallocation later.

### Challenges

The C programming language has a lot of nice features, some of which don't make it exactly easier for us to do our modifications. One of those features is the union data type, a data type which can hold one of multiple different nested data structures. In NetBSD it is often used, for example in `struct buf` as seen below. [Source](https://gitlab.fachschaften.org/merlinscholz/lockdoc-netbsd/-/blob/lockdoc-10.99.5-vfs/sys/sys/buf.h?ref_type=heads#L122)

```c
struct buf {
#ifndef LOCKDOC_VFS
    union {
#else
    struct {
#endif
#if defined(_KERNEL)
                /* LOCKDOC: This had to be moved in front of u_actq and
                 * u_rbnode becuase the vfs_bio subsys does
                 * some *interesting* pointer stuff
                 */
                 struct work u_work;
#endif
                TAILQ_ENTRY(buf) u_actq;
                rb_node_t u_rbnode;
    } b_u;
    void            (*b_iodone)(struct buf *);
    int             b_error;
    // [...]

```

Regarding LockDoc, this causes problems as the emulator does not know, what data structure is being held internally. To circumvent this, we replace every union with a simple struct. This results in a slightly higher memory usage (which is so slight that it was not measurable), and also in some faulty pointer arithmetics in the kernel. After replacing the union with a struct, you cannot access the nested data enymore by just pointing to the beginning of the outer datastructure. Those (very few) occurances had to be reordered or patched manually.

There were some more challenges regarding the LockDoc adaption to NetBSD. One of them being NetBSD's use of locking without explicit data structures made for locking. For example, there are some code paths that just use an `u_int` as flag array, using atomic operations to set some "busy" flag. And while there are macros to set/unset that flag, they aren't used consistently. So in the end we had to grep the entire kernel source for accesses to that flag array, just to instrument those manually.

The last, and probably biggest, issue was the use of locks that are not contained in their respective structs. You see, the LockDoc toolset does not log every single locking operations. It deems only those relevant, that happen _in_ the structs we want to analyze and kernel-wide static ones. This wasn't an issue in the previous Linux and FreeBSD experiments, as there simply were (almost) no locks outside of structs. NetBSD however...NetBSD constantly uses pointers in its structs to point to some lock that was declared at an entirely different location. And that is what I tried to handle for almost two months. I've tried a bunch of things, includeing:

- Automatically following pointers from the emulator (completely new research topic, similar to Garbage Collection algorithms but with even fewer runtime information)
- Manually watching those locks (can't match locks and datastructures anymore)
- Manually watching the lock operations (high instrumentation effort; emulator ignores those since they're not in the watched memory segments)
- Treating the locks as static locks (can't handle multiple instances)
- Treating the locks as global pseudo-allocations (same issue as above)
- Rewriting the lock addess during analysis (violates the database schema used for analysis; can't get lock information from addess afterwards)
- Treating the locks as pseudo-allocation per instance

The last option finally worked and this is how it works: We hand the analysis tooling a list of our problematic struct member names (i.e. pointers to locks), the type they're pointing to, and their size:

```
v_interlock,kmutex_t;8
```

For every lock, the emulator checks wheter the name matches this list of problematic locks. If that is the case, it hallucinates a struct with the same name, and only containing that lock. Please note that the following is no valid C code, and it not written anywhere. We just tell the emulator that this is how it should handle those cases.

```c
struct v_interlock {
    kmutex_t v_interlock;
};
```

The disadvantage of that method consists of not being able to tell when such a lock is bein freed again (as we start watching them upon access, not upon (de)allocation). In theory, that could lead to conflicts when that memory section is being reused for other relavant data structures. Luckily, this did not happen during our tests.

## Results

After all that theory, now to the part you've all been waiting for: Let's move on to the actual tests and results.

First of all we ran our workloads/stress tests on the modified NetBSD inside our emulator. Since this is an emulator, emulating every instruction, instead of a virtual machine, this took a while. Since that entire process is bound to single-thread performance (and because I couldn't get the emulator to build on my M2 Mac), I opted for an Intel Core i7-12700 based machine. Running NetBSD with the ATF FS test suite and logging all the relevant memory accesses/locking operations took around 5 days and 17 hours or 137h on that machine (at around 4,90GHz). Using the FS test suite contained in LTP takes around 2 days and 4 hours or 52h.

The pure size of the logs (as CSV files) is around 206GiB for ATF FS and 108GiB for LTP FS.

The actual (post mortem) analysis was done on four socket system, filled with Intel Core E5-4640. Most of the analysis is being done via SQL statements in Postgres, taking 11.5h for ATF FS and 10.8h for LTP FS. This is for a single `SELECT` statement containing 27 `JOIN`S.

Since this is a blog article and not a research paper, I'll skip some of the theoretical stuff and jump directly to the results:

### Ambigious Documentation

During automated comparision of existing locking documentation and generated locking documentation I noticed the following line:

```c
// n,l  vi_nc_lock① + vi_nc_listlock② to modify
```

There seemingly are two ways to interpret this:

1. `(①+②) to modify`, meaning you'd have to set neither to read and both to modify or
2. `① + (② to modify)`, meaning you'd have to always set ①, and additionally ② if you wanted to write to the variable.

Upon chatting with the NetBSD contributors on IRC (great people btw, and a huge shoutout to them for constantly helping me with my dumb questions), it turned out that neither explanation is correct. The correct way to read the comment is `either to read, both to modify`. Realising this was a little ambigious, they fixed it in [rev. 1.27 of `vnode_impl.h`](http://cvsweb.netbsd.org/bsdweb.cgi/src/sys/sys/vnode_impl.h?rev=1.27&content-type=text/x-cvsweb-markup), it now reads

```c
// n,l	both vi_nc_lock + vi_nc_listlock to modify, either to read
```

### Missing Lock in the FFS File System

This is the bug I'm most proud of, since it seems to be an actual bug in the actual NetBSD kernel.

While looking through the generated list of possible locking bugs I noticed the `vnode_impl->vi_vnode->v_numoutput` data structure. The LockDoc-generated hypothesis tells us that you need to lock `v_interlock` before accessing this member. This hypothesis can be confirmed by referencing the documentation. However, there are two code paths, where `v_numoutput` is being accessed without the proper precautions, once in `sys_sync`, and once in `sys_unmount`. Both internally call the [same FFS-specific function](http://cvsweb.netbsd.org/bsdweb.cgi/src/sys/ufs/ffs/ffs_vfsops.c?rev=1.381&content-type=text/x-cvsweb-markup&only_with_tag=MAIN), which checks if `v_numoutput > 0`, without locking it first:

```c
/*
 * Force stale file system control information to be flushed.
 */
if (waitfor != MNT_LAZY && (ump->um_devvp->v_numoutput > 0 ||
    !LIST_EMPTY(&ump->um_devvp->v_dirtyblkhd))) {
	vn_lock(ump->um_devvp, LK_EXCLUSIVE | LK_RETRY);
	if ((error = VOP_FSYNC(ump->um_devvp, cred,
	    (waitfor == MNT_WAIT ? FSYNC_WAIT : 0) | FSYNC_NOLOG,
	    0, 0)) != 0)
		allerror = error;
	VOP_UNLOCK(ump->um_devvp);
}
```

To check if this really is a bug I once again turned to the #NetBSD-code IRC channel where I got that bug confirmed (although its not a big issue):

```
<@Riastradh> although I guess it’s not actually a big issue, because either <@Riastradh> (a) ffs_sync is being called concurrently with other file system activity, so new writes can be concurrently triggered anyway, so it doesn’t really matter much; or
<@Riastradh> (b) ffs_sync is being called when the file system is quiesced, in which case it can’t change anyway.
```

But since it is a bug after all, I got to create [NetBSD Problem Report #57606](https://gnats.netbsd.org/cgi-bin/query-pr-single.pl?number=57606), through which it got fixed shortly after.

I love this bug because it could only be found through my new approach of folliwing lock pointers, and also just because I found a kernel bug, which even though it is low severity, is really cool.

## Closing Words

I love this topic. Throughout this thesis I learned so much about the i386 instruction set, kernel development, file system internals, got to solve some cool problems, and got a degree out of it all.

However, please not that I wrote almost none of the LockDoc code myself. All of this would not have been possible without the previous work in [LockDoc: Trace-Based Analysis of Locking in the Linux Kernel](https://dl.acm.org/doi/abs/10.1145/3302424.3303948). I merely ported this over to NetBSD.

## Want More Details?

You've read through this and still aren't bored yet? Good news, you can [read my entire, German thesis](./Untersuchung%20der%20Kernsynchronisation%20in%20NetBSD%20mittels%20LockDoc.pdf) right now!

Also if you have any questions, I'm happy to answer them! Shoot me a message on [Matrix](https://matrix.to/#/@ruhrscholz:kif.rocks), [Mastodon](https://toot.kif.rocks/@ruhrscholz), or an [email](mailto:hi@scholz.ruhr)!
