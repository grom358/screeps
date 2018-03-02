"use strict";

if (!Memory.creepGen) {
    Memory.creepGen = {};
}

function calculateCost(parts) {
    let cost = 0;
    for (let i = 0, n = parts.length; i < n; i++) {
        cost += BODYPART_COST[parts[i]];
    }
    return cost;
}

module.exports = {
    spawnCreeps: function (creepRoles, room, spawns, spawnSettings, spawnQueue = []) {
        // Fill queue based on spawn settings.
        for (let ruleName in spawnSettings) {
            let rule = spawnSettings[ruleName];
            let min = rule.min || 0;
            let max = Math.max(rule.max || 0, min);
            let allCreepsWithRule;
            if (rule.remote) {
                allCreepsWithRule = _.filter(Game.creeps, (c) => c.memory.rule === ruleName);
            } else {
                allCreepsWithRule = _.filter(Game.creeps, (c) =>
                    c.memory.spawnRoom === room.name &&
                    c.memory.rule === ruleName);
            }
            let creepsWithRule = _.filter(allCreepsWithRule, (c) => !c.memory.dying);
            let priority = rule.priority || 1000;
            let needForce = allCreepsWithRule.length < min;
            for (let i = creepsWithRule.length; i < max; i++) {
                spawnQueue.push({
                    force: i < min && needForce,
                    rule: ruleName,
                    role: rule.role,
                    memory: rule.memory,
                    energyStructures: rule.energyStructures,
                    priority: priority,
                    parts: rule.parts,
                });
            }
        }

        // Add spawns from user queue.
        for (let i = room.memory.spawnQueue.length - 1; i >= 0; i--) {
            let settings = room.memory.spawnQueue[i];
            settings.user = i;
            settings.force = settings.force || false;
            spawnQueue.push(settings);
        }

        spawnQueue.sort((a, b) => {
            if (b.force !== a.force) {
                return b.force ? -1 : 1;
            }
            let bp = b.priority || 1000;
            let ap = a.priority || 1000;
            return bp - ap;
        });

        room.memory.debugQueue = JSON.parse(JSON.stringify(spawnQueue));
        //delete room.memory.debugQueue;

        // Spawn creeps.
        for (let i = 0, n = spawns.length; i < n && spawnQueue.length > 0; i++) {
            let spawn = spawns[i];
            let settings = spawnQueue.pop();
            let energy = settings.force ? room.energyAvailable : room.energyCapacityAvailable;
            let opts = {};
            if (!settings.memory) {
                opts.memory = {};
            } else {
                opts.memory = JSON.parse(JSON.stringify(settings.memory));
            }
            opts.memory.rule = settings.rule || settings.role;
            opts.memory.role = settings.role || settings.rule;
            opts.memory.spawnRoom = room.name;
            if (!settings.energyStructures) {
                opts.energyStructures = settings.energyStructures;
            }

            if (!(opts.memory.role in creepRoles)) {
                console.log('Role not found ' + opts.memory.role);
                continue;
            }

            let parts;
            if (settings.parts) {
                parts = JSON.parse(JSON.stringify(settings.parts));
            } else {
                parts = creepRoles[opts.memory.role].parts(energy, spawn);
            }

            let generation = false;
            let name = settings.name;
            if (!name) {
                if (!Memory.creepGen[opts.memory.rule]) {
                    Memory.creepGen[opts.memory.rule] = 1;
                }
                let num = Memory.creepGen[opts.memory.rule];
                generation = true;
                name = opts.memory.rule + num;
            }

            let ret = spawn.spawnCreep(parts, name, opts);
            if (ret === OK) {
                console.log(room.name + ' (' + spawn.name + ') spawning ' + name);
                if (generation) {
                    Memory.creepGen[opts.memory.rule]++;
                }
                if (settings.user !== undefined) {
                    let index = room.memory.spawnQueue.findIndex((s) => s.user === settings.user);
                    if (index >= 0) {
                        room.memory.spawnQueue.splice(index, 1);
                    }
                }
            } else {
                if (ret === ERR_NOT_ENOUGH_ENERGY) {
                    let cost = calculateCost(parts);
                    if (cost > room.energyCapacityAvailable) {
                        console.log('Not enough energy to spawn ' + name + ' (' + cost + ')');
                    }
                } else {
                    // TODO more spawn error handling here.
                    console.log('Failed to spawn ' + name + ': ' + ret);
                }
                break;
            }
        }
    },
};