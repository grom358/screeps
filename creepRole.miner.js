"use strict";

const STATE_MOVING = 1;
const STATE_MINING = 2;

function parts(energy) {
    let workEnergy = energy - BODYPART_COST[MOVE];
    let workParts = Math.floor(workEnergy / BODYPART_COST[WORK]);
    let noWorkParts = Math.min(Math.max(workParts, 2), 5);
    let parts = new Array(noWorkParts).fill(WORK);
    parts.push(MOVE);
    return parts;
}

function init(creep) {
    // Find closest unassigned source.
    let source = creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: (source) => _.sum(Game.creeps, (creep) => source.id === creep.memory.sourceId && !creep.memory.dying) === 0
    });
    if (!source) {
        // Fallback by picking the source with lowest number of miners.
        let sources = creep.room.find(FIND_SOURCES);
        if (sources.length) {
            source = _.min(sources, (s) => _.sum(Game.creeps, (c) => s.id === c.memory.sourceId && !creep.memory.dying));
        }
    }
    creep.memory.sourceId = source.id;

    // If there is adjacent container to source, then that is where we go.
    let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: {structureType: STRUCTURE_CONTAINER}
    });
    if (containers.length) {
        creep.memory.containerId = containers[0].id;
    }

    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            let container = Game.getObjectById(creep.memory.containerId);
            if (container) {
                if (creep.pos.isEqualTo(container.pos)) {
                    creep.memory.state = STATE_MINING;
                } else {
                    if (!creep.memory.travelTime && container.pos.lookFor(LOOK_CREEPS).length && creep.pos.isNearTo(container.pos)) {
                        creep.memory.travelTime = (Game.time - creep.memory.createdAt) + 10;
                    }
                    creep.moveTo(container);
                }
            } else {
                let source = Game.getObjectById(creep.memory.sourceId);
                if (creep.pos.isNearTo(source.pos)) {
                    creep.memory.state = STATE_MINING;
                } else {
                    creep.moveTo(source);
                }
            }
            if (creep.memory.state === STATE_MINING && !creep.memory.travelTime) {
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
                run(creep);
            }
            return;
        }
        case STATE_MINING: {
            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
            }
            let source = Game.getObjectById(creep.memory.sourceId);
            creep.harvest(source);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
