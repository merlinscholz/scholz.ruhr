# Organizing Photos

> Published on Oct 8, 2022

Warning: Another rambling stream of thoughts.

# The Cruft

I currently have around 500GB of (digital) family photos sorted into folders labeled by date and event/place. I also have a few boxes of analog photos that I'm in the process of sorting and digitalising, but this takes way longer than expected (and isn't in the scope of this stream of thoughts). There also exists a 2TB folder structure of DSLR photos. The only good thing is that those images all have proper EXIF data regarding when they were shot.

# $CURRENTYEAR

As I'm living in $CURRENTYEAR, I also have a smartphone, an iPhone to be precise, which I take photos with and which has replaced my "normal" camera more and more over the years. Back when I first set up my NextCloud, I also enabled image auto-uploads.

All of this leads to multiple problems, most notably for me are:

![Screenshot of NextCloud with missing thumbnail images](https://ruhrscholz.mataroa.blog/images/a6d6cf15.png)

1. Photos are not just still images anymore. Due to Live Photos and image bursts and other features, there are small videos, sets of photos, etc. Also, somehow there is a growing incompatibility with HEIF/HEIC images, HEVC videos, etc. when accessing your media from different devices: 
This made me buy the cheapest iCloud storage option when I was on holiday once, just because I did not want to disable Live Photos and my phone was getting full (and uploading them to NextCloud only split them into still image and 5 second MOV file which is far from ideal).
Another problem with the NextCloud approach is that uploaded images are converted to JPG. This leads to a loss of quality (and HDR) which, granted, could be prevented by enabling HEIC upload. But then, I can't easily see my photos online anymore because HEIC support in browsers isn't completely there yet. Add in the legal/licensing issues of libheif in major Linux distros and we can forget a good-working NextCloud setup.

2. I don't have to copy photos from my phone/camera to my PC anymore. This leads to me not sorting them into folders manually, but rather to have a constant stream of photos, without clear boundaries between events or places. To help with this, there now is GPS data in images, images grouped by people, place, or date/time, but is this better? I honestly don't know yet.

3. Sharing. Back in the day you used to burn a CD or pass around a thumb drive to share your memories with friends and family. Today there is the cloud. Just a few days ago I received vacation images via iCloud Photos and iMessage, and they were added to my own Photos app automatically. What if I want to share images to non-Apple users? Currently I create a NextCloud folder and share them, and it is working, but that still involves some amount of work.

4. Photos I don't shoot on my phone. I bring my old Canon DSLR to some conventions or events. If those photos are good, I edit them in Darktable or RawTherapee. That brings in a whole other set of problems: Keep the original, unedited photos? Upload the raws? 40-50GB for a single day of photos? Access those from my phone?

# The dream

See, my dream setup would be a constant stream of photos. Just a single wall of photos, in a single app, from which I can select places, people, events, and objects as I wish.

Wait, you may say, this sounds exactly like iCloud Photos. And indeed, it does. It works great for pictures shot on your phone or shared with you from other Apple devices. But there's a few points bothering me about this:
1. The cruft. I could upload my old photos to iCloud Photos, but do I want to? First of all, that would cost me 10€ per month (for 2TB), which actually isn't that bad. But what if I want to backup my old photos to disk? You know, an old-school folder full of .jpg images? In bulk? That seems more and more difficult this way, and leads to vendor lock-in, which in turn, leads me to my second point:
2. I have a NextCloud instance because I like to own and know where my data is. I also tell myself that this is cheaper which, given how much I spend on servers, is objectively wrong. NextCloud is getting better with automated photo organizing, face recognition etc., but it's not yet on an Apple level. Regarding albums, yes, NextCloud supports albums in the same way Apple does, but to not have multiple sources of truth (on-disk folders and albums on a meta level), I would have to dump all my old images into the single photo stream. Can I get them out of there later when I want a normal folder? Nobody knows. Also, what if Apple decides to lock me out of my account? Unlikely, but far from impossible.

# The future

I'll continue to double-wield iCloud Photos and NextCloud. I'll probably also dump all my old images in the NextCloud photo stream (while keeping backups of the folder structure with a ```.nomedia```-tag). Is this ideal? No. Absolutely no. This way I have to keep sorting the same albums in NextCloud and iCloud photos, which will get out of sync someday. And if I really bite the bullet and dump all of the photos into iCloud too, I'll again have to create a few hundred albums (unless I find out how to turn folders into albums automatically).

What to do about DSLR photos? I don't know. About HEIC photos? I don't know. Maybe Apple will offer 5TB plans soon. Maybe I could dump the iCloud Photos data automatically via their equivalent to Google Takeout.

Organization is hell.
