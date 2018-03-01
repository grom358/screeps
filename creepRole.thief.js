"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;
const STATE_RENEW = 3;

function parts(energy) {
    let comboCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    let comboParts = Math.min(Math.floor(energy / comboCost), 20);
    let parts = [];
    for (let i = 0; i < comboParts; i++) {
        parts.push(CARRY);
        parts.push(MOVE);
    }
    return parts;
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function run(creep) {
    if (creep.carryCapacity === 0) {
        if (creep.room.name !== creep.memory.homeRoom) {
            const exitDir = creep.room.findExitTo(creep.memory.homeRoom);
            const exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
        } else {
            creep.moveIntoRoom();
        }
        return;
    }

    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.say('⚡ deliver');
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            if (creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                let stealFrom;
                if (creep.room.storage &&  _.sum(creep.room.storage.store) > 0) {
                    stealFrom = creep.room.storage;
                } else if (creep.room.terminal &&  _.sum(creep.room.terminal.store) > 0) {
                    stealFrom = creep.room.terminal;
                }
                if (stealFrom) {
                    for (let resourceName in stealFrom.store) {
                        let amount = stealFrom.store[resourceName];
                        if (amount > 0) {
                            if (creep.withdraw(stealFrom, resourceName) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(stealFrom);
                            }
                        }
                    }
                } else {
                    creep.memory.state = STATE_DELIVER;
                }
            }
            return;
        }
        case STATE_DELIVER: {
            if (_.sum(creep.carry) === 0 && creep.ticksToLive < 500 && creep.room.find(FIND_MY_SPAWNS).length > 0) {
                creep.memory.state = STATE_RENEW;
                run(creep);
                return;
            }
            if (_.sum(creep.carry) === 0) {
                creep.say('🔄 collect');
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            if (creep.room.name !== creep.memory.homeRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.homeRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                // Deliver energy.
                let storage = creep.room.storage;
                for (let resourceName in creep.carry) {
                    let amount = creep.carry[resourceName];
                    if (amount > 0) {
                        if (creep.transfer(storage, resourceName) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage);
                        }
                    }
                }
            }
            return;
        }
        case STATE_RENEW: {
            if (creep.ticksToLive > 1300) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            let spawn = creep.getTarget(
                () => creep.pos.findClosestByPath(FIND_MY_SPAWNS),
                undefined,
                'spawnId'
            );
            if (spawn && spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
