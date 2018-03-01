"use strict";

const STATE_MOVING = 1;
const STATE_COLLECT = 2;
const STATE_BUILD = 3;

function parts(energy) {
    return [WORK, WORK, WORK, WORK, WORK,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        /*
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        */
        MOVE, MOVE, MOVE, MOVE, MOVE];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                creep.memory.state = STATE_BUILD;
                run(creep);
                return;
            }
            return;
        }
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_BUILD;
                // Clear the collection point as we wish to reselect collection target for next collection.
                delete creep.memory.collectFrom;
                run(creep);
                return;
            }
            if (creep.room.storage && creep.room.storage.store.energy > creep.carryCapacity) {
                if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
            } else {
                creep.collectEnergy(true);
            }
            return;
        }
        case STATE_BUILD: {
            if (creep.carry.energy === 0) {
                creep.memory.state = STATE_COLLECT;
                delete creep.memory.targetId;
                run(creep);
                return;
            }
            let rampart = creep.getTarget(
                () => _.min(
                    creep.room.find(FIND_STRUCTURES, {
                        filter: (s) => (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) &&
                            s.hits < s.hitsMax
                    }),
                    (s) => s.hits),
                (s) => s.hits < s.hitsMax
            );
            if (creep.repair(rampart) === ERR_NOT_IN_RANGE) {
                creep.moveTo(rampart);
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
