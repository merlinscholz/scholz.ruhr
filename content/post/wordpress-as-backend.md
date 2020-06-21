---
title: "Need a backend for your new web app? Why not use WordPress?"
date: 2020-06-21T00:00:00+02:00
draft: false
summary: "WordPress is great as a proof-of-concept backend for your future web app. Let me tell you why."
---

## The Task

I've recently been assigned with writing a platform where users can share and support each other petitions. Think of it like a self-hosted version of [change.org](https://www.change.org/). This includes a way for users to create accounts, login (so prober authentication and authorization), a pretty frontend and a good way of storing the created content. At first, my mind flew into the depths of modern web technologies: Should I use a REST-backend and a React frontend? Be even more hip and use GraphQL? If so, what language to write the backend in? Go, Ruby, Python, PHP, C#... Anything was possible. And the frontend? Use Next.js? What about Angular? Vue.js? Svelte? I started comparing the possibilities for a few days, but after a short time, the exact requirements had been given to me.

## The Problem

And locked my plans down quite a bit. The biggest restriction was the given server architecture: The backend had to be written in PHP, I could not use ```.htaccess``` or similar tricks for better routing, and it should use a MySQL/MariaDB instance for data storage. I thought to myself, well, that's not too bad. Just use Laravel, Symfony and get the project done. But another big problem was the given time. The whole thing had to be done in the span of about two months. Better start quickly...

I spent a few days trying out Symfony and Laravel to decide, which one would better fit my needs. Mind you, I've never used them before. At that point, the plan has been to write a simple REST api and a proper Vue.js frontend (mostly because I know Vue better than the alternatives). After those few days I gave up. Given the strict time constraints, I'd never have time to implement a full REST api in an unknown framework including authentication, user registration and login, combine that with an actually usable web interface and take care of the branding and marketing, while also taking care of other projects in my life.

I've you've read the title of this article, you already know where this is going: [WordPress](https://wordpress.org/). When I read that the project needed to be written in PHP with MySQL/MariaDB support, my mind immediately jumped to this CMS, it is what I, and a lot of other people, just associate first with the given technologies. I'll admit, I've only tinkered with it almost 10 years ago, and all I really knew about it was that you absolutely have too keep it up-to-date or else bad things will happen. But given my desperation at that point, I was willing to give it a go. It was a great decision.

## The Final Solution

Using WordPress for such a project is absolutely lovely. Why?

### It Is Battle Proven

WordPress now exists for over 17 years, has gone through a lot of change, but that only made it better. [According to forbes](https://www.forbes.com/sites/montymunford/2016/12/22/how-wordpress-ate-the-internet-in-2016-and-the-world-in-2017/#1417a555199d), in 2016 it was used by almost 75 million websites, and if you want to believe other sources, it [powers over 35% of all websites](https://w3techs.com/technologies/details/cm-wordpress). You don't get that many users if you don't deliver a solid, working, customizable, easy (and fast) product.

### It Is Easy
Developing for WordPress is easy. If you still don't know where to really start, copy one of the default themes, like [twenty-nineteen](https://github.com/WordPress/twentynineteen) and edit it to your liking. You don't have to take care of retrieving the posts, or sorting them, you just have to call functions like ```the_title()``` to get and display what you need. Also, since you don't have to use a REST api with JavaScript, it is fast and loads (almost) instantly. No need to wait for text text to load after the rest of the site already finished loading. The whole page architecture, from fetching to displaying some content is all stored in a single file, and easy to follow. Load the header, loop over posts, load the footer, done!

Even if you need custom functions in your themes, it is almost trivial to create a plugin: It just has to be a single ```functions.php``` file that you can call from everywhere you like.

### No Database Code
Accessing databases with PHP, and especially matching those database models to PHP classes can get annoying very quickly. But thankfully, WordPress takes care of all of that. I just had to call special functions for user creation, registration, post creation and the like to get started.

### Authentication and Authorization
The (at least for me) most annoying part -- user authentication and authorization -- is already taken care of. You can use the built-in login and registration functions, which also supports different roles for users. Don't like the default ```wp-login.php```-screen? It is trivial to implement a custom page in your theme to act as a replacement. This holds true for all of your inputs: Assume, the user wants to start a petition. Does he have to use the "normal" WordPress backend editor? Of course not. As with the login function, just create a custom page with the appropriate form elements to take care of that.

### It Is Customizable
But isn't WordPress just for blog posts you may think? No. You can rename "posts" to whatever you like ("campaigns" in my case). You can add custom metadata fields to posts (like locations or links to other resources). And all that can be done in a single ```functions.php``` file of your custom plugin. Combine that with a quickly written theme and you have a working prototype in a few days. Even if you haven't written WordPress plugins/themes ever before.

### Great documentation
If I ever had to check how something should be done (be it for example user registration), a quick search with my favorite search engine always led to [developer.wordpress.org](https://developer.wordpress.org/), where all functions I needed were described good enough for me to understand what they do and how to call them properly. Even if that didn't help, there is a [WordPress StackExchange](https://wordpress.stackexchange.com/) where all of the problems I could think of in the course of developing this project, have been asked and answered by other community members. Combine that with the "normal" StackOverflow for your normal PHP-related questions, and there is no question left unanswered.

## Other use cases

My current project is just one of many possible use cases. One could, for example, make a Twitter clone, Instagram clone, Hacker News or basically anything that relies on user-submitted content.

Is this actually a good idea for use in production? I'll have to admit, I don't know. It's working great for my use cases so far, and should scale well enough. But especially for simple or more sophisticated project, a custom backend will have advantages, given that you have enough time and resources to maintain it.

## Summary

The project is now almost finished, and I am more than happy with my choice of using WordPress. Given the strict time frame, and... Interesting choice of technology to be used, I did not expect this project to go as far as it did. I will probably publish it soon on my GitHub. Until then, I'd like to hear about your opinion on this approach! Write me on Twitter, HN, or anywhere else!