#CommandBlocksJS
CommandBlocksJS allows you to translate Javascript code to minecraft CommandBlocks

##Documentation
moved to the [Wiki](https://github.com/M4GV5/CommandBlocksJS/wiki)

##Example
###Code
```javascript
say("Welcome to this map created by <yourName>"); //broadcast message



//set up scoreboard objective
var timePlayed = new Score("timePlayed", "dummy", "Time Played");

//set scoreboard objective display
timePlayed.setDisplay("sidebar");

timer(60, function() //timer function
{
	timePlayed.add(Selector.allPlayer(), 1); //add 1 to all players online
});



//set event whenever a player kills another player
EventHandler.setEventListener('onkill', function(player)
{
	tellraw(player.getSelector(), "You cruel boy".format(Formatting.red));
});
```
###Output
[![Cmd](http://i.imgur.com/7PoLwI0.png)]()


##License
CommandBlocksJS is published under the 4 clause BSD license what means you can use source and binary for everything but your project needs to include the following clause: "This product includes software developed by Jakob Löw (M4GNV5)."
