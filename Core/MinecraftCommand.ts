/// <reference path="./API.ts"/>

class MinecraftCommand
{
	cmd: string;

	constructor(cmd: string)
	{
		this.cmd = cmd;
	}

	run(): void
	{
		command(this.cmd);
	}

	validate(callback?: Function, otherwise?: Function, useSetblock: boolean = false): void
	{
		usedLibs["integer"] = true;
		usedLibs["setTimeout"] = true;

		var name = Util.Naming.next("validate");
		var sel = Entities.Selector.parse("@e[name={0}]".format(name));

		command('summon ArmorStand ~ ~1 ~ {CustomName:"{0}",NoGravity:true,Invincible:true,PersistenceRequired:true}'.format(name));
		Runtime.Integer.score.set(sel, 0);
		command('stats block ~1 ~ ~ set SuccessCount {0} stdInteger'.format(sel.toString()));
		command(this.cmd);

		if (typeof callback != 'undefined')
		{
			var id = outputHandler.addFunction(callback);

			var _cmd: string;
			if (useSetblock)
				_cmd = "execute @e[name={0},score_stdInteger_min=1] ~4 ~-1 ~ setblock ~%X ~%Y ~%Z minecraft:redstone_block 0 replace".format(name);
			else
				var _cmd = 'execute @e[name={0},score_stdInteger_min=1] ~4 ~-1 ~ summon ArmorStand ~%X ~%Y ~%Z {CustomName:"call",NoGravity:true,Invincible:true,PersistenceRequired:true}'.format(name);

			outputHandler.addToCurrent(new Output.FunctionCall(id, _cmd));
		}
		if (typeof otherwise != 'undefined')
		{
			var id = outputHandler.addFunction(otherwise);
			var distance = typeof callback != 'undefined' ? 5 : 4;

			var _cmd: string;
			if (useSetblock)
				_cmd = "execute @e[name={0},score_stdInteger=0] ~{1} ~-1 ~ setblock ~%X ~%Y ~%Z minecraft:redstone_block 0 replace".format(name, distance);
			else
				var _cmd = 'execute @e[name={0},score_stdInteger=0] ~{1} ~-1 ~ summon ArmorStand ~%X ~%Y ~%Z {CustomName:"call",NoGravity:true,Invincible:true,PersistenceRequired:true}'.format(name, distance);

			outputHandler.addToCurrent(new Output.FunctionCall(id, _cmd));
		}

		command('kill @e[name={0}]'.format(name));
	}
}
