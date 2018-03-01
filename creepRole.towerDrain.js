"use strict";

const STATE_MOVING = 1;
const STATE_DRAIN = 2;
const STATE_HEAL = 3;

function parts(energy) {
    return [
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL, HEAL,
    ];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    if (creep.ticksToLive < creep.memory.travelTime) {
        creep.memory.dying = true;
    }

    // Apply heal boosts.
    /*
    if (_.filter(creep.body, (part) => part.type === HEAL && part.boost === RESOURCE_LEMERGIUM_OXIDE).length < 4) {

    }
    */

    switch (creep.memory.state) {
        case STATE_MOVING: {
            let startPos = new RoomPosition(creep.memory.startPos.x, creep.memory.startPos.y, creep.memory.startPos.roomName);
            if (creep.pos.isEqualTo(startPos)) {
                creep.memory.state = STATE_DRAIN;
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
            } else {
                creep.moveTo(startPos);
            }
            return;
        }
        case STATE_DRAIN: {
            if (creep.hits < creep.hitsMax) {
                creep.memory.state = STATE_HEAL;
                run(creep);
                return;
            }
            let drainPos = new RoomPosition(creep.memory.drainPos.x, creep.memory.drainPos.y, creep.memory.drainPos.roomName);
            creep.moveTo(drainPos);
            return;
        }
        case STATE_HEAL: {
            if (creep.hits === creep.hitsMax) {
                creep.memory.state = STATE_DRAIN;
                run(creep);
                return;
            }
            let startPos = new RoomPosition(creep.memory.startPos.x, creep.memory.startPos.y, creep.memory.startPos.roomName);
            creep.moveTo(startPos);
            creep.heal(creep);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
