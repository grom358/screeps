"use strict";

require('memory');
require('target');
require('Room');
require('Creep');

const creepRoles = {
    miner: require('creepRole.miner'),
    upgrader: require('creepRole.upgrader'),
    transport: require('creepRole.transport'),
    builder: require('creepRole.builder'),
    kiter: require('creepRole.kiter'),
    reserver: require('creepRole.reserver'),
    remoteMiner: require('creepRole.remoteMiner'),
    remoteHauler: require('creepRole.remoteHauler'),
    claimer: require('creepRole.claimer'),
    remoteBuilder: require('creepRole.remoteBuilder'),
    remoteUpgrader: require('creepRole.remoteUpgrader'),
    refiller: require('creepRole.refiller'),
    transfer: require('creepRole.transfer'),
    linkLoader: require('creepRole.linkLoader'),
    linkUnloader: require('creepRole.linkUnloader'),
    test: require('creepRole.test'),
    healer: require('creepRole.healer'),
    bait: require('creepRole.bait'),
    melee: require('creepRole.melee'),
    blocker: require('creepRole.blocker'),
    signer: require('creepRole.signer'),
    fortifier: require('creepRole.fortifier'),
    towerDrain: require('creepRole.towerDrain'),
    controllerAttacker: require('creepRole.controllerAttacker'),
    buster: require('creepRole.buster'),
    dismantler: require('creepRole.dismantler'),
    thief: require('creepRole.thief'),
    mineralMiner: require('creepRole.mineralMiner'),
    courier: require('creepRole.courier'),
    labUnloader: require('creepRole.labUnloader'),
    rampartMelee: require('creepRole.rampartMelee'),
};

const roomControllers = {
    base: require('roomController.base'),
    empty: require('roomController.empty'),
};

function getRole(creep) {
    if (!creep.memory.role) {
        console.log('Creep ' + creep.name + ' is missing role');
        return;
    }
    if (creep.memory.role in creepRoles) {
        return creepRoles[creep.memory.role];
    } else {
        console.log('Missing role ' + creep.memory.role);
    }
}

global.sendClaimer = function(roomName, remoteRoom) {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
        role: 'claimer',
        memory: {
            remoteRoom: remoteRoom,
        },
    });
};

global.sendBuilder = function(roomName, remoteRoom, remotePath) {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
        role: 'remoteBuilder',
        memory: {
            remoteRoom: remoteRoom,
            remotePath: remotePath,
        },
    });
};

global.sendUpgrader = function(roomName, remoteRoom) {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
       role: 'remoteUpgrader',
       memory: {
         remoteRoom: remoteRoom,
       },
    });
};

global.sendKiter = function(roomName, remoteRoom) {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
        role: 'kiter',
        memory: {
            remoteRoom: remoteRoom,
        },
    });
};

global.sendSigner = function(roomName, remoteRoom, message = '') {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
        role: 'signer',
        memory: {
            remoteRoom: remoteRoom,
            message: message,
        },
    });
};

global.sendControllerAttacker = function(roomName, remoteRoom) {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
        role: 'controllerAttacker',
        memory: {
            remoteRoom: remoteRoom,
        },
    });
};

global.sendThief = function(roomName, remoteRoom) {
    let room = Game.rooms[roomName];
    room.memory.spawnQueue.push({
        role: 'thief',
        memory: {
            homeRoom: roomName,
            remoteRoom: remoteRoom,
        },
    });
};

global.transferResource = function(resource, sourceRoom, destRoom) {
    let room = Game.rooms[sourceRoom];
    let terminal = room.terminal;
    let cost = 0;
    if (resource === RESOURCE_ENERGY) {
        cost = Game.market.calcTransactionCost(terminal.store[resource], sourceRoom, destRoom);
    }
    let ret = terminal.send(resource, terminal.store[resource] - cost, destRoom);
    console.log('Sending ' + resource + ' from ' + sourceRoom + ' to ' + destRoom + ': ' + ret);
};

module.exports.loop = function () {
    // Cleanup memory.
    // This doesn't need to be done every tick, but for starting purpose clear memory each tick for debugging purposes.
    GCCreepMemory();
    GCStructureMemory();

    // Visualize spawn.
    for (let name in Game.spawns) {
        let spawn = Game.spawns[name];
        if (spawn.spawning) {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                {align: 'left', opacity: 0.8});
        }
    }

    // Control rooms.
    for (let name in Game.rooms) {
        let room = Game.rooms[name];
        let roomController = false;
        if (room.memory.controller) {
            roomController = roomControllers[room.memory.controller];
        } else if (room.controller && room.controller.my) {
            roomController = roomControllers.base;
        }
        if (!roomController) {
            roomController = roomControllers.empty;
        }
        roomController.run(room, creepRoles);
    }

    // Control creeps.
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        let role = getRole(creep);
        if (!role) {
            continue;
        }
        if (creep.spawning) {
            // Creep is still spawning.
            if (!creep.memory.init) {
                if (role.init) {
                    role.init(creep);
                }
                creep.memory.init = true;
                creep.memory.createdAt = Game.time;
            }
        } else {
            role.run(creep);
        }
    }
};