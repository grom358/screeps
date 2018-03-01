"use strict";

const STATE_IDLE = 1;
const STATE_HEAL = 2;
const STATE_EVADE = 3;

function parts(energy) {
    let comboCost = BODYPART_COST[MOVE] + BODYPART_COST[HEAL];
    let comboParts = Math.min(Math.floor(energy / comboCost), 4);
    let parts = [];
    for (let i = 0; i < comboParts; i++) {
        parts.push(MOVE);
        parts.push(HEAL);
    }
    return parts;
}

function init(creep) {
    creep.memory.state = STATE_IDLE;
}

function run(creep) {
    if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    let damagedCreep = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
        filter: (c) => c.hits < c.hitsMax
    });
    let hostileCreep = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
        filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
    });
    switch (creep.memory.state) {
        case STATE_IDLE: {
            if (hostileCreep && creep.pos.getRangeTo(hostileCreep) <= 4) {
                creep.memory.state = STATE_EVADE;
                run(creep);
                return;
            } else if (damagedCreep) {
                creep.memory.state = STATE_HEAL;
                run(creep);
                return;
            } else {
                let flag = creep.getFlag(
                    () => creep.pos.findClosestByPath(FIND_FLAGS, {
                        filter: (f) => f.name.startsWith("Defend")
                    })
                );
                if (flag) {
                    if (creep.pos.getRangeTo(flag) > 5) {
                        creep.moveTo(flag);
                    }
                } else {
                    creep.moveTo(new RoomPosition(25, 25, creep.room.name));
                }
            }
            return;
        }
        case STATE_HEAL: {
            if (!damagedCreep) {
                creep.memory.state = STATE_IDLE;
                run(creep);
                return;
            }

            if (creep.pos.getRangeTo(damagedCreep) > 1) {
                creep.rangedHeal(damagedCreep);
                creep.moveTo(damagedCreep);
            } else if (creep.heal(damagedCreep) === ERR_NOT_IN_RANGE) {
                creep.moveTo(damagedCreep);
            }
            return;
        }
        case STATE_EVADE: {
            if (!hostileCreep || creep.pos.getRangeTo(hostileCreep) > 4) {
                creep.memory.state = STATE_IDLE;
                run(creep);
                return;
            }
            let goals = _.map(
                creep.room.find(FIND_HOSTILE_CREEPS, {
                    filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
                }),
                (c) => { return { pos: c.pos, range: 4 }; }
            );
            let ret = PathFinder.search(creep.pos, goals, {
                flee:true,
                maxRooms: 1,
                roomCallback: function(roomName) {
                    let room = Game.rooms[roomName];
                    if (!room) return;
                    let costs = new PathFinder.CostMatrix;
                    room.find(FIND_HOSTILE_CREEPS, {
                        filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
                    }).forEach(function(creep) {
                        costs.set(creep.pos.x, creep.pos.y, 0xff);
                        costs.set(creep.pos.x + 1, creep.pos.y, 1000);
                        costs.set(creep.pos.x - 1, creep.pos.y, 1000);
                        costs.set(creep.pos.x + 1, creep.pos.y + 1, 1000);
                        costs.set(creep.pos.x - 1, creep.pos.y + 1, 1000);
                        costs.set(creep.pos.x + 1, creep.pos.y - 1, 1000);
                        costs.set(creep.pos.x - 1, creep.pos.y - 1, 1000);
                        costs.set(creep.pos.x, creep.pos.y - 1, 1000);
                        costs.set(creep.pos.x, creep.pos.y + 1, 1000);
                    });
                    return costs;
                },
            });
            creep.moveByPath(ret.path);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
