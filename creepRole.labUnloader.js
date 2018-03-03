"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;

function parts(energy) {
    return [
        CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE,
    ];
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function run(creep) {
    if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            let labs = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_LAB && s.mineralAmount > 0
            });
            if (creep.memory.labs) {
                labs = _.filter(labs, (lab) => creep.memory.labs.indexOf(lab.id) >= 0);
            }
            let lab = labs.length ? _.max(labs, (lab) => lab.mineralAmount) : undefined;
            if (!lab && _.sum(creep.carry) > 0) {
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            if (lab && creep.withdraw(lab, lab.mineralType) === ERR_NOT_IN_RANGE) {
                creep.moveTo(lab);
            }
            return;
        }
        case STATE_DELIVER: {
            if (_.sum(creep.carry) === 0) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            let dstContainer = Game.getObjectById(creep.memory.destId);
            if (!dstContainer) {
                return;
            }
            for (let resourceName in creep.carry) {
                let amount = creep.carry[resourceName];
                if (amount > 0) {
                    if (creep.transfer(dstContainer, resourceName) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(dstContainer);
                    }
                }
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