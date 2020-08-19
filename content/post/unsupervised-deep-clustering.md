---
title: "Unsupervised Deep Clustering"
date: 2020-08-18T19:18:54+01:00
draft: true
summary: "Something a little different today: Using neural networks without training data to cluster images"
---

Something a little different today: Using neural networks without training data to cluster images. How I got into this? Well, it was my bachelor's thesis.

## Motivation

Neuronal networks are often being used for image segmentation. To do this, you normally need some kind of ground truth, so the neural network knows, what to do with this image. Sadly, ground truths aren't always an option: If you want to cluster the surface of the Mars, you won't find any good datasets[^1]. There also won't be any datasets soon, because

1. It is an extremely big set of images to analyze
2. You would need domain experts to actually cluster the images

This leads to the fact that manually creating a ground truth for the surface of the mars would cost a lot of time and money.

This isn't only true for the mars, there are many different domains where it is not feasible to manually create a ground truth for a neural network to train on. Think, for example, about medical scans like CT scans. You'd need even more sophisticated domain experts to label the data.

## Related Work

## Algorithm

### Texture based clustering

### Iterative segmentation

### Stopping criteria

## Implementation

## Results

[^1]: The only ones I could find where datasets differentiating between "surface" and "crater".