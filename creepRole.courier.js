"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;

function parts(energy) {
    return [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
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
            let srcContainer = Game.getObjectById(creep.memory.sourceId);
            if (!srcContainer) {
                return;
            }
            for (let resourceName in srcContainer.store) {
                if (creep.memory.filter && creep.memory.filter.indexOf(resourceName) === -1) {
                    continue;
                }
                let amount = srcContainer.store[resourceName];
                if (amount > 0) {
                    if (creep.withdraw(srcContainer, resourceName) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(srcContainer);
                    }
                }
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