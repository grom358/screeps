"use strict";

const STATE_MOVING = 1;
const STATE_EXTRACTING = 2;

function parts(energy) {
    /*
    let workEnergy = energy - BODYPART_COST[MOVE];
    let workParts = Math.floor(workEnergy / BODYPART_COST[WORK]);
    let noWorkParts = Math.min(workParts, 5);
    let parts = new Array(noWorkParts).fill(WORK);
    parts.push(MOVE);
    return parts;
    */
    return [WORK, CARRY, MOVE];
}

function init(creep) {
    let minerals = creep.room.find(FIND_MINERALS);
    if (minerals.length > 0) {
        let mineral = minerals[0];
        creep.memory.mineralId = mineral.id;
    }

    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    let mineral = Game.getObjectById(creep.memory.mineralId);

    switch (creep.memory.state) {
        case STATE_MOVING: {
            if (creep.pos.isNearTo(mineral)) {
                creep.memory.state = STATE_EXTRACTING;
            } else {
                creep.moveTo(mineral);
            }
            if (creep.memory.state === STATE_EXTRACTING) {
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
                run(creep);
            }
            return;
        }
        case STATE_EXTRACTING: {
            /*
            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
            }
            */
            creep.harvest(mineral);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
