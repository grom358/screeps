"use strict";

const STATE_MOVING = 1;
const STATE_BLOCK = 2;

function parts(energy) {
    return [
        TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE,
        TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE,
        TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE,
        MOVE, HEAL,
    ];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    if (creep.getActiveBodyparts(HEAL) > 0 && creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }

    switch (creep.memory.state) {
        case STATE_MOVING: {
            let targetPos = new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName);
            if (creep.pos.isEqualTo(targetPos)) {
                creep.memory.state = STATE_BLOCK;
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
            } else {
                creep.moveTo(targetPos);
            }
            return;
        }
        case STATE_BLOCK: {
            // We do nothing but block.
            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
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
