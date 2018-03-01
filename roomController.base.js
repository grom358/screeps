"use strict";

if (!Memory.creepGen) {
    Memory.creepGen = {};
}

function init(room) {
    room.memory.spawnQueue = [];
    // A base needs at least 1 miner, transport and upgrader to function.
    room.memory.spawnSettings = {
        miner: {
            role: 'miner',
            min: 1,
            max: room.find(FIND_SOURCES).length,
            priority: 1,
        },
        transport: {
            role: 'transport',
            min: 1,
            priority: 2,
        },
        refiller: {
            role: 'refiller',
            max: 0,
            priority: 2,
        },
        upgrader: {
            role: 'upgrader',
            min: 1,
            priority: 3,
        },
        builder: {
            role: 'builder',
            max: 1,
            priority: 4,
        },
        fortifier: {
            role: 'fortifier',
            max: 0,
            priority: 5,
        },
        mineral: {
            role: 'mineralMiner',
            max: 0,
            priority: 6,
        },
        courier: {
            role: 'courier',
            max: 0,
            priority: 7,
            memory: {
                sourceId: '',
                destId: '',
            }
        },
        defender: {
            role: 'kiter',
            max: 0,
            priority: -1,
        },
    };
    room.memory.remoteRooms = [];
}

const spawnManager = require('spawnManager');

module.exports = {
    run: function (room, creepRoles) {
        if (!room.memory.init) {
            init(room);
            room.memory.init = true;
        }

        if (room.memory.freeze) {
            return;
        }

        if (!room.memory.remoteRooms) {
            room.memory.remoteRooms = [];
        }

        // Associate containers with source.
        room.tagContainers();

        let availableSpawns = room.findAvailableSpawns();

        // Spawn creeps.
        if (availableSpawns.length > 0) {
            let spawnSettings = JSON.parse(JSON.stringify(room.memory.spawnSettings));

            let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
            spawnSettings.defender.max = hostileCreeps.length || spawnSettings.defender.max;

            let [mineral] = room.find(FIND_MINERALS);
            if (mineral.mineralAmount === 0) {
                room.memory.spawnSettings.mineral.max = 0;
                room.memory.spawnSettings.courier.max = 0;
            }

            // Setup remote mines.
            for (let i = 0, n = room.memory.remoteRooms.length; i < n; i++) {
                let remoteRoomName = room.memory.remoteRooms[i];
                if (remoteRoomName in Game.rooms) {
                    let remoteRoom = Game.rooms[remoteRoomName];
                    let hostileCreeps = remoteRoom.find(FIND_HOSTILE_CREEPS).length;
                    spawnSettings['defend' + remoteRoomName + '_'] = {
                        role: 'kiter',
                        memory: {remoteRoom: remoteRoomName},
                        remote: true,
                        max: hostileCreeps,
                        priority: 100,
                    };
                    if (hostileCreeps === 0) {
                        let reserverParts = [CLAIM, MOVE];
                        if (!remoteRoom.controller.reservation || remoteRoom.controller.reservation.ticksToEnd < 2500) {
                            reserverParts = [CLAIM, CLAIM, MOVE, MOVE];
                        }
                        spawnSettings['reserve' + remoteRoomName + '_'] = {
                            role: 'reserver',
                            memory: {remoteRoom: remoteRoomName},
                            remote: true,
                            //max: (!remoteRoom.controller.reservation || remoteRoom.controller.reservation.ticksToEnd < 2500) ? 2 : 1,
                            max: 1,
                            parts: reserverParts,
                            priority: 101,
                        };
                        spawnSettings['mine' + remoteRoomName + '_'] = {
                            role: 'remoteMiner',
                            memory: {remoteRoom: remoteRoomName},
                            remote: true,
                            max: remoteRoom.find(FIND_SOURCES).length,
                            priority: 102,
                        };
                        spawnSettings['haul' + remoteRoomName + '_'] = {
                            role: 'remoteHauler',
                            memory: {homeRoom: room.name, remoteRoom: remoteRoomName},
                            remote: true,
                            max: 1,
                            priority: 103,
                        };
                    }
                } else {
                    // Send scout.
                    spawnSettings['defend' + remoteRoomName + '_'] = {
                        role: 'kiter',
                        memory: {remoteRoom: remoteRoomName},
                        remote: true,
                        max: 1,
                        priority: 100,
                    };
                }
            }

            spawnManager.spawnCreeps(room, availableSpawns, spawnSettings, creepRoles);
        }

        // Control towers.
        // TODO pluggable interface for towers.
        let towers = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER
        });
        if (towers.length) {
            let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
            if (hostileCreeps.length) {
                let target = hostileCreeps[0]; // TODO acquire target.
                towers.forEach((tower) => tower.attack(target));
            } else {
                let damagedCreep = _.min(room.find(FIND_MY_CREEPS, {
                    filter: (c) => c.hits < c.hitsMax
                }), (c) => c.hits);
                if (damagedCreep && damagedCreep.id) {
                    towers.forEach((tower) => tower.heal(damagedCreep));
                } else {
                    let wallMax = room.memory.towerWallMax || 1000;
                    let structure = _.min(room.findRepairByPriority([
                        STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER,
                        STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_ROAD,
                        STRUCTURE_RAMPART, STRUCTURE_WALL
                    ], wallMax, 0.75), (s) => s.hits);
                    if (structure && structure.id) {
                        towers.forEach((tower) => tower.repair(structure));
                    }
                }
            }
        }

        // Control labs.
        if (room.memory.labs) {
            room.memory.labs.forEach(({lab1, lab2, destLab}) =>
                Game.getObjectById(destLab).runReaction(Game.getObjectById(lab1), Game.getObjectById(lab2))
            );
        }
    },
};