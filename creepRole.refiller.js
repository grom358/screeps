"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;

function parts(energy) {
    let comboCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    let comboParts = Math.min(Math.floor(energy / comboCost), 20);
    let parts = [];
    for (let i = 0; i < comboParts; i++) {
        parts.push(CARRY);
        parts.push(MOVE);
    }
    return parts;
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.say('⚡ deliver');
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
            }
            return;
        }
        case STATE_DELIVER: {
            if (creep.carry.energy === 0) {
                creep.say('🔄 collect');
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            let {target, type} = creep.getTargetUnion({
                spawn: {
                    selector: () => _.max(
                        creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_SPAWN ||
                                s.structureType === STRUCTURE_EXTENSION) && s.energy < s.energyCapacity
                        }),
                        (s) => s.energyCapacity - s.energy),
                    validator: (s) => s.energy < s.energyCapacity,
                },
                upgradeContainer: {
                    selector: () => creep.room.findControllerContainer(),
                    validator: (container) => _.sum(container.store) < container.storeCapacity - 50,
                },
                tower: {
                    selector: () => _.max(
                        creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity
                        }),
                        (s) => s.energyCapacity - s.energy),
                    validator: (s) => s.energy < s.energyCapacity,
                },
                container: {
                    selector: () => _.max(
                        creep.room.findDestinationContainers(),
                        (container) => container.storeCapacity - _.sum(container.store)) ,
                    validator: (container) => _.sum(container.store) < container.storeCapacity - 50,
                },
                lab: {
                    selector: () => _.min(
                        creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (s) => s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity
                        }),
                        (lab) => lab.energy
                    ),
                    validator: (lab) => lab.energy < lab.energyCapacity,
                },
            }, 'deliverTo');
            let ret = creep.transfer(target, RESOURCE_ENERGY);
            if (ret === OK) {
                // We transferred all we could, pick a new target.
                delete creep.memory.deliverTo;
            } else if (ret === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
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