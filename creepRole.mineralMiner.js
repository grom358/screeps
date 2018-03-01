"use strict";

const STATE_MOVING = 1;
const STATE_MINING = 2;

function parts(energy) {
    let parts = [];
    let cost = 0;
    let comboCost = BODYPART_COST[WORK] * 5 + BODYPART_COST[MOVE];
    for (let i = 0; i < 5 && cost + comboCost < energy; i++) {
        for (let j = 0; j < 5; j++) {
            parts.push(WORK);
        }
        parts.push(MOVE);
        cost += comboCost;
    }
    return parts;
}

function init(creep) {
    let [mineral] = creep.room.find(FIND_MINERALS);
    creep.memory.mineralId = mineral.id;

    let [container] = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER
    });
    creep.memory.containerId = container.id;

    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            let container = Game.getObjectById(creep.memory.containerId);
            if (creep.pos.isEqualTo(container.pos)) {
                creep.memory.state = STATE_MINING;
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
                run(creep);
                return;
            }
            creep.moveTo(container);
            return;
        }
        case STATE_MINING: {
            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
            }
            let mineral = Game.getObjectById(creep.memory.mineralId);
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
