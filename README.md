

&nbsp;<br>&nbsp;
<div align="center">
  <h2>🔴 Live Demo</h2>
  <a href="https://frac.vercel.app/">
    <img src="https://raw.githubusercontent.com/MindLaborDev/MindLaborDev/master/preview/Group 5.png" />
  </a>
</div>

&nbsp;<br>&nbsp;

## 🕹️ Controls
Click on "Tutorial" at the bottom left to show the controls (or press "t").

&nbsp;<br>&nbsp;

## 🤖 Features

### Color Modes
* __Normal:__ Normal coloring.
* __Smooth:__ Makes color changes based on iterations smoother using logarithm.
* __Night:__ Colors only borders using Anti-Aliasing.


### Modifier Modes
* __Normal:__ Normal mandelbrot.
* __Spikes:__ Makes mandelbrot look spiky  [Using a modified mandelbrot identifier condition `Re(z)<2 || Im(z)<2` instead of `sqrt(z)<2`.
* __Sponge:__ Makes the mandelbrot look like a sponge. [This was created while trying to make the 3-head mode]
* __3-head:__ A mandelbrot with 3 heads [Using a modified mandelbrot formula `z^4 + c` instead of `z^2 + c`]


### Miscellaneous
* __Music:__ The bass of the ambient music depends on the scroll velocity. When scrolling, lower frequencies become louder resulting in a scrolling sound effect.
* __Julia Fractals:__ There is a small preview window at the bottom right which shows the julia set of the current mouse coordinate.
* __Export:__ Use right-click to export/download the current shown fraktal. (Also works with julia set when it is in full mode)
&nbsp;<br>&nbsp;

## 👨🏽‍💻 Development
* Run `npm install`
* Run `ng serve --open`
