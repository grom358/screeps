"use strict";

function parts(energy) {
    return [
        MOVE, MOVE, MOVE, CLAIM, CLAIM, CLAIM,
    ];
}

function init(creep) {
}

function run(creep) {
    if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    if (creep.attackController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
