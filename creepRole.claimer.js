"use strict";

const STATE_MOVING = 1;
const STATE_RESERVING = 2;

function parts(energy) {
    return [CLAIM, MOVE];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            if (creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                creep.memory.state = STATE_RESERVING;
                run(creep);
                return;
            }
            return;
        }
        case STATE_RESERVING: {
            if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
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
