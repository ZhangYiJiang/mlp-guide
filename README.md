# *My Little Pony: Friendship is Magic* Episode Guide 

What? Another MLP episode guide, you say? Hear me out, hear me out. I want 
this guide to be different - better, well designed and maintained, 
information rich, yet accessible. A tall order, perhaps, but not impossible
I hope. 

Mirror: http://mlp.meebleforp.com/

## Features 

 - Multiple viewing options (both streaming and downloads) for each episode 
 - Tags for organization and filtering purposes 
 - Track episodes watched, and get warning on continuity so that you don't 
   spoil yourself by watching episodes out of order 
 - Random episode selector 

## Design goals 

### Open and easily editable 

The guide, and all code, resource and data associated with it shall be open 
source. Host the guide's source on a platform that allows for easy 
collaboration, and have its data stored in a format that's easily editable. 

### For an international audience 

The show is enjoyed worldwide, and thus the guide should be too. Link to 
multiple avenues to watch this show, and perhaps in the future other languages 
sub/dubs. Geo-IP is another option to make the guide more user friendly by only
exposing options available to users from that country. 

### Respect the show's creators 

Broadly, this means listing legal options to view the show as far as possible, 
and limiting the amount of copyrighted materials used. It's unfortunate that 
outside the US and Europe it's incredibly hard if you want to actually *pay* 
for the show (hint hint, Hasbro)

## Code Overview 

The guide is a static single page website build using [node.js][1], with [Jade][2] for 
templates. The data for each episode is stored in `src/doc`. On the front end, 
[Backbone.js][3] is used to provide structure. Most of the heavy lifting is done 
on the front-end.

The code is not very well documented or structured, and although using 
Backbone.js means that the front-end code isn't completely spaghetti, it could 
do with some cleaning up and additional comments. 

Target browser: All modern desktop browser (responsive layout on todo list), IE8+

## To Build

1. Install [node.js][4]
2. Install the packages needed - `npm install jade underscore`
3. Run the build script - `node src/build.js`

## Todo 

- Create UI for tag exclusion. The code is done (try running 
  `guide.exclude.add({ name: 'song', category: 'story', text: 'Song' })` in 
  your console), but not the UI
- Add Geo-IP so that additional viewing options for other countries could be 
  included, as well as to highlight / hide relavant options for visitors. 
  [MaxMind's free JS GeoIP API][5] seems perfect for this.
- Semi-responsive design for smaller screens / mobile 

[1]: http://nodejs.org/
[2]: http://jade-lang.com/
[3]: http://backbonejs.org/
[4]: http://nodejs.org/download/
[5]: http://dev.maxmind.com/geoip/legacy/javascript