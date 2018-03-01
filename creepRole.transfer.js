"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;
const STATE_RENEW = 3;

function parts(energy) {
    return [
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    ];
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            if (creep.ticksToLive < 750) {
                creep.memory.state = STATE_RENEW;
                run(creep);
                return;
            }
            let source = Game.rooms[creep.memory.homeRoom].storage;
            if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
            return;
        }
        case STATE_DELIVER: {
            if (creep.carry.energy === 0) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            let destination = Game.rooms[creep.memory.remoteRoom].storage;
            if (creep.transfer(destination, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(destination);
            }
            return;
        }
        case STATE_RENEW: {
            if (creep.ticksToLive > 1400) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            let spawn = Game.rooms[creep.memory.homeRoom].find(FIND_MY_SPAWNS)[0];
            if (spawn.renewCreep(creep) !== OK) {
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
