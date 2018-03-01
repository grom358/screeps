"use strict";

Room.prototype.findAvailableSpawns = function() {
    return this.find(FIND_MY_SPAWNS, {
       filter: (spawn) => !spawn.spawning && spawn.isActive()
    });
};

Room.prototype.findConstructionSitesByPriority = function(priorities) {
    for (let i = 0, n = priorities.length; i < n; i++) {
        let structureType = priorities[i];
        let constructionSites = this.find(FIND_CONSTRUCTION_SITES, {
            filter: { structureType: structureType }
        });
        if (constructionSites.length) {
            return constructionSites;
        }
    }
    return null;
};

Room.prototype.findRepairByPriority = function(priorities, wallMax, percentage = 1.0) {
    for (let i = 0, n = priorities.length; i < n; i++) {
        let structureType = priorities[i];
        let structures = this.find(FIND_STRUCTURES, {
            filter: (s) => {
                if (s.structureType !== structureType) {
                    return false;
                }
                if (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) {
                    return s.hits < wallMax;
                } else {
                    return s.hits < s.hitsMax * percentage;
                }
            }
        });
        if (structures.length) {
            return structures;
        }
    }
    return null;
};

Room.prototype.findContainers = function() {
    return this.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER
    });
};

Room.prototype.tagContainers = function() {
    let containers = this.findContainers();
    for (let i = 0, n = containers.length; i < n; i++) {
        let container = containers[i];
        if (!Memory.structures[container.id]) {
            // If container is next to mine, associate it.
            let nearbySources = container.pos.findInRange(FIND_SOURCES, 1);
            if (nearbySources.length > 0) {
                container.memory.sourceId = nearbySources[0].id;
            }
            let nearbyMinerals = container.pos.findInRange(FIND_MINERALS, 1);
            if (nearbyMinerals.length > 0) {
                container.memory.mineralId = nearbyMinerals[0].id;
            }
            if (container.pos.getRangeTo(container.room.controller) <= 3) {
                container.memory.hasController = true;
            }
        }
    }
};

Room.prototype.findSourceContainers = function() {
    return this.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.memory.sourceId && s.store.energy > 0
    });
};

Room.prototype.findDestinationContainers = function() {
    return this.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER && !s.memory.sourceId && !s.memory.mineralId && _.sum(s.store) < s.storeCapacity
    });
};

Room.prototype.findControllerContainer = function() {
    let [container] = this.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.memory.hasController && _.sum(s.store) < s.storeCapacity
    });
    return container;
};