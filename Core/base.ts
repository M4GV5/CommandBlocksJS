//#base.ts
/// <reference path="./OutputParser.ts"/>

interface CsApi
{
	/**
	 * Writes ´message´ to the console at compile time.
	 * @param message Message to write.
	 */
	log(message: string): void;

	/**
	 * definitely not an easter egg.
	 */
	disco(a: number, b: number): void;

	/**
	 * Places a block.
	 * @param id Minecraft block ID.
	 * @param data Block data/damage.
	 * @param x Absolute x position.
	 * @param y Absolute y position.
	 * @param z Absolute z position.
	 */
	placeBlock(id: number, data: number, x: number, y: number, z: number): void;

	/**
	 * Places a command block.
	 * @param command Command block content.
	 * @param x Absolute x position.
	 * @param y Absolute y position.
	 * @param z Absolute z position.
	 */
	placeCommandBlock(command: string, x: number, y: number, z: number): void;

	/**
	 * Places a sign.
	 * @param text Contents of the sign.
	 * @param direction Direction of the sign.
	 * @param x Absolute x position.
	 * @param y Absolute y position.
	 * @param z Absolute z position.
	 */
	placeSign(text: string[], direction: number, x: number, y: number, z: number): void;

	/**
	 * Saves the world/schematic
	 */
	save(): void;
}

/**
 * External C# API functions.
 */
declare var api: CsApi;

//region core classes

/**
 * Class for managing functions.
 */
class OutputHandler
{
	static instance: OutputHandler;

	constructor()
	{
	}

	output: string[] = [''];
	functions: Function[] = [function () { }];
	current: number = 0;

	addFunction(func: Function, replaceRedstoneBlocks: boolean = true): number
	{
		if (this.functions.indexOf(func) == -1)
		{
			this.functions.push(func);
			var id = this.functions.indexOf(func);
			this.output[id] = '';

			var last = this.current;
			this.current = id;

			func();

			this.addCallHelperCommands(id, replaceRedstoneBlocks);

			this.current = last;
			return id;
		}
		return this.functions.indexOf(func);
	}

	addCallHelperCommands(id: number, replaceRedstoneBlocks: boolean = true): void
	{
		var length = this.output[this.current].split(';').length - 1;
		var cmd: string;
		if (replaceRedstoneBlocks)
		{
			cmd = "cfill ~-1 ~-1 ~ ~" + length + " ~-1 ~ minecraft:stone 0 replace minecraft:redstone_block;";
			this.output[id] = cmd + this.output[id];
			length++;
		}
		cmd = "cfill ~ ~-1 ~ ~" + length + " ~-1 ~ minecraft:redstone_block 0;";
		this.output[id] = cmd + this.output[id];
	}

	removeFunction(func: Function): void
	{
		var id = this.functions.indexOf(func);
		if (id == -1)
			return;
		if (id == this.current)
			throw "Cant remove current Function!";

		this.functions.splice(id, 1);
		this.output.splice(id, 1);
	}

	addToCurrent(code: string): void
	{
		this.output[this.current] += code;
	}
}

/**
 * Static OutputHandler instance.
 */
var outputHandler = new OutputHandler();
//endregion

//region core functions

/**
 * Initial direction.
 */
var direction: number = 1;

/**
 * Places a block.
 * @param id Minecraft ID of the block.
 * @param data Block data/damage.
 */
function block(id: number = 1, data: number = 0): void
{
	outputHandler.addToCurrent('b' + id + '_' + data + ';');
}

/**
 * Places a command block.
 * @param text Content of the command block.
 * @param placeRepeater Whether or not to place a repeater before calling the function.
 */
function command(text: string): void
{
	outputHandler.addToCurrent('c' + text + ';');
}

/**
 * Querys a command block.
 * @param text Content of the command block.
 * @param placeRepeater Whether or not to place a repeater before calling the function.
 */
function queryCommand(text: string): void
{
	outputHandler.addToCurrent('q' + text + ';');
}

/**
 * Places parallel code to the structure.
 * @param func Function to add. Will be run immediately.
 */
function sidewards(func: Function): void
{
	direction++;
	var code = 's';
	var oldManager = outputHandler;
	var newManager = new function ()
	{
		this.addToCurrent = function (data) { code += data.replace(/;/g, '|'); }
		this.addFunction = function (func)
		{
			direction--;
			outputHandler = oldManager;
			var id = outputHandler.addFunction(func);
			outputHandler = newManager;
			direction++;
			return id;
		}
	}
	outputHandler = newManager;
	func();
	outputHandler = oldManager;
	outputHandler.addToCurrent(code + ';');
	direction--;
}

/**
 * Adds the function to the structure and calls the redstone.
 * @param func JavaScript/TypeScript function.
 * @param placeRepeater Whether or not to place a repeater before calling the function.
 */
function call(func: Function): void
{
	var funcId = outputHandler.addFunction(func);
	outputHandler.addToCurrent('e' + funcId + ';');
}

function callOnce(callback: Function): void
{
	var funcId = outputHandler.addFunction(callback, false);
	outputHandler.addToCurrent('e' + funcId + ';');
}

function setTimeout(callback: any, time: number = 1, timeInSeconds: boolean = true): void
{
	var func: Function;
	if (typeof callback == 'function')
		func = <Function>callback;
	else
		func = function () { eval(callback.toString()); };

	if (timeInSeconds)
		time *= 20;

	var funcId = outputHandler.addFunction(func);
	time++;
	outputHandler.addToCurrent('t' + funcId + '_' + time + ';');
	command('scoreboard players set @e[name=function' + funcId + '] setTimeout ' + time);
}

/**
 * Places a sign (for notes etc.)
 * @param text1 First line of the sign.
 * @param text2 Second line of the sign.
 * @param text3 Third line of the sign.
 * @param text4 Fourth line of the sign.
 * @param direc Direction where the sign faces.
 */
function sign(text1: string = "", text2: string = "", text3: string = "", text4: string = "", direc: number = direction * 4): void
{
	outputHandler.addToCurrent('n' + text1 + text2 + text3 + text4 + '_' + direc + ';');
}
//enregion

//region wrapper functions
/**
 * Places ´length´ redstone dust.
 * @param length Length of the wire.
 */
function wire(length: number = 1): void
{
	for (var i = 0; i < length; i++)
		block(55);
}

/**
 * Places a redstone torch.
 * @param activated If false, the redstone torch will initially be turned off.
 */
function torch(activated: boolean = true): void
{
	var data = (direction == 4) ? direction + 1 : 1;
	if (activated)
		block(76, data);
	else
		block(75, data);
}

/**
 * Places repeaters to delay ´time´. Will do nothing if ´time´ is zero.
 * @param time Time in 1/10th of a second.
 */
function delay(time = 0): void
{
	while (time >= 0)
	{
		var delay = (time > 3) ? 3 : (time == 0) ? 0 : time - 1;
		var data = delay * 4 + direction;
		block(93, data);
		time -= (time > 3) ? delay + 1 : delay + 2;
	}
}

/**
 * Places a comparator.
 * @param activated If true, the comparator's state will initially be turned on.
 */
function comparator(activated: boolean = false): void
{
	if (activated)
		block(150, direction);
	else
		block(149, direction);
}

/**
 * Inverts the signal. (NOT)
 * @param blockId Block where redstone torch will be on.
 * @param placeRepeater Whether or not to place a repeater before the block.
 */
function invert(blockId: number = 1, placeRepeater: boolean = true): void
{
	if (placeRepeater)
		delay();
	block(blockId);
	torch();
}
//endregion

//region main code
function timeoutFunctionsTick()
{
	command("scoreboard players remove @e[score_setTimeout_min=2] setTimeout 1");
	command("execute @e[score_setTimeout=1] ~ ~ ~ setblock ~ ~ ~ minecraft:redstone_block");
	command("kill @e[score_setTimeout=1]");
	call(timeoutFunctionsTick);
}
command("scoreboard objectives add setTimeout dummy");
call(timeoutFunctionsTick);

/**
 * Entry point of every script. Will append automatically.
 */
function cbjsWorker(): void
{
	var id = outputHandler.current;
	outputHandler.addCallHelperCommands(id);
	outputHandler.output[id] = "b143_2;" + outputHandler.output[id]; //button

	OutputParser.start();

	api.log("Successfully executed " + outputHandler.functions.length + " functions!");
}
//endregion
