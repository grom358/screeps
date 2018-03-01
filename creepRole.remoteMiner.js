"use strict";

const STATE_MOVING = 1;
const STATE_ACQUIRE = 2;
const STATE_MINING = 3;

function parts(energy) {
    return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE];
}

function init(creep) {
    creep.memory.state = STATE_ACQUIRE;
}

function run(creep) {
    if (creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    switch (creep.memory.state) {
        case STATE_ACQUIRE: {
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
            run(creep);
            return;
        }
        case STATE_MOVING: {
            let container = Game.getObjectById(creep.memory.containerId);
            if (container) {
                if (creep.pos.isEqualTo(container.pos)) {
                    creep.memory.state = STATE_MINING;
                } else {
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
            if (creep.memory.state === STATE_MINING) {
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
