"use strict";

const STATE_MOVING = 1;
const STATE_TEST = 2;

function parts(energy) {
    return [MOVE];
}

function init(creep) {
    creep.memory.targetPos = new RoomPosition(18, 23, creep.room.name);
    let destinationPos = new RoomPosition(23, 20, creep.room.name);
    creep.memory.path = creep.memory.targetPos.findPathTo(destinationPos);
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            let targetPos = new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName);
            if (creep.pos.isEqualTo(targetPos)) {
                creep.memory.state = STATE_TEST;
                run(creep);
                return;
            }
            creep.moveTo(targetPos);
            return;
        }
        case STATE_TEST: {
            let path = creep.memory.path;
            creep.moveByPath(path);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
