"use strict";

const STATE_COLLECT = 1;
const STATE_BUILD = 2;

function parts(energy) {
    let comboCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE] * 2;
    let comboParts = Math.min(Math.floor(energy / comboCost), 12);
    let parts = [];
    for (let i = 0; i < comboParts; i++) {
        parts.push(WORK);
        parts.push(CARRY);
        parts.push(MOVE);
        parts.push(MOVE);
    }
    return parts;
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function increaseWalls(creep) {
    let wallMin = _.min(
        creep.room.find(FIND_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) &&
                s.hits < s.hitsMax
        }),
        (s) => s.hits);
    if (wallMin) {
        creep.room.memory.wallMax = wallMin.hits + 1000;
    }
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_BUILD;
                // Clear the collection point as we wish to reselect collection target for next collection.
                delete creep.memory.collectFrom;
                run(creep);
                return;
            }
            if (creep.room.terminal && creep.room.terminal.store.energy > 0) {
                if (creep.withdraw(creep.room.terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.terminal);
                }
            } else if (creep.room.storage && creep.room.storage.store.energy > creep.carryCapacity) {
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
                delete creep.memory.repairId;
                run(creep);
                return;
            }
            creep.buildSite() || creep.repairBuilding() || increaseWalls(creep);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
