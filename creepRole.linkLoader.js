"use strict";

const STATE_MOVING = 1;
const STATE_COLLECT = 2;
const STATE_DELIVER = 3;

function parts(energy) {
    return [CARRY, MOVE];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function send(creep) {
    let link = Game.getObjectById(creep.memory.sourceLinkId);
    if (link.energy === link.energyCapacity) {
        let destLink = Game.getObjectById(creep.memory.destLinkId);
        let ret = link.transferEnergy(destLink);
        //console.log(destLink.id + ': ' + ret);
    }
}

function run(creep) {
    if (creep.ticksToLive < creep.memory.travelTime) {
        creep.memory.dying = true;
    }

    switch (creep.memory.state) {
        case STATE_MOVING: {
            let targetPos = new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName);
            if (creep.pos.isEqualTo(targetPos)) {
                creep.memory.state = STATE_COLLECT;
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
                run(creep);
                return;
            }
            creep.moveTo(targetPos);
            return;
        }
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }

            let droppedEnergy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
            if (droppedEnergy.length > 0) {
                let pickupEnergy = _.max(droppedEnergy, (e) => e.amount);
                creep.pickup(pickupEnergy);
            } else {
                let containers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER
                });
                if (containers.length > 0) {
                    let container = _.max(containers, (c) => c.store.energy);
                    creep.withdraw(container, RESOURCE_ENERGY);
                }
            }
            send(creep);
            return;
        }
        case STATE_DELIVER: {
            let link = Game.getObjectById(creep.memory.sourceLinkId);
            if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(link);
            }
            send(creep);
            creep.memory.state = STATE_COLLECT;
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
