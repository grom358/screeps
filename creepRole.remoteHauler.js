"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;

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
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            if (creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                // Collect energy.
                creep.collectEnergy();
            }
            return;
        }
        case STATE_DELIVER: {
            if (creep.carry.energy === 0) {
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
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage);
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
