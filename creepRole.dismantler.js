"use strict";

function parts(energy) {
    return [
        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    ];
}

function init(creep) {
}

function run(creep) {
    if (creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    let target = Game.getObjectById(creep.memory.targetId);
    if (creep.dismantle(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
