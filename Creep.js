/**
 * Collects energy in the following priority:
 * 1) dropped energy
 * 2) container
 * 3) storage - if allowed.
 */
Creep.prototype.collectEnergy = function (allowStorage = false) {
    // Collect energy.
    let {target, type} = this.getTargetUnion({
        energy: {
            selector: () => {
                let resources = this.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 50
                });
                for (let i = 0, n = resources.length; i < n; i++) {
                    let resource = resources[i];
                    resource.available = resource.amount;
                    // Find creeps assigned to this resource.
                    let assignedCreeps = this.room.find(FIND_MY_CREEPS, {
                        filter: (creep) =>
                            creep.memory.collectFrom &&
                            creep.memory.collectFrom.type === 'energy' &&
                            creep.memory.collectFrom.tid === resource.id
                    });
                    assignedCreeps.forEach((creep) => resource.available -= (creep.carryCapacity - _.sum(creep.carry)))
                }
                return this.pos.findClosestByPath(_.filter(resources, (r) => r.available > 0));
            },
            validator: (resource) => resource.amount >= 50,
        },
        container: {
            selector: () => {
                return _.max(this.room.findSourceContainers(), (container) => container.store.energy);
            },
            validator: (container) => container.store.energy >= 50,
        },
        storage: {
            selector: () => allowStorage ? this.room.storage : null,
            validator: (storage) => storage.store.energy >= 50,
        },
    }, 'collectFrom');
    if (target) {
        switch (type) {
            case 'energy': {
                if (this.pickup(target) === ERR_NOT_IN_RANGE) {
                    this.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                break;
            }
            case 'storage':
            case 'container': {
                if (this.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    this.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                break;
            }
        }
    }
    return target;
};

Creep.prototype.buildSite = function () {
    let constructionSite = this.getTarget(
        () =>
            _.max(this.room.findConstructionSitesByPriority([
                STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER,
                STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL,
                STRUCTURE_LINK, STRUCTURE_LAB, STRUCTURE_EXTRACTOR, STRUCTURE_OBSERVER, STRUCTURE_NUKER,
                STRUCTURE_ROAD,
                STRUCTURE_RAMPART, STRUCTURE_WALL
            ]), (s) => s.progress),
        undefined,
        'buildId'
    );
    if (constructionSite) {
        this.room.visual.line(this.pos, constructionSite.pos, {lineStyle: 'dashed', opacity: 0.5});
    }
    if (constructionSite && this.build(constructionSite) === ERR_NOT_IN_RANGE) {
        this.moveTo(constructionSite);
    }
    return constructionSite;
};

Creep.prototype.repairBuilding = function () {
    let wallMax = this.room.memory.wallMax || 10000;
    let structure = this.getTarget(
        () =>
            this.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => (s.hits && s.hits < 250) ||
                    ((s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && s.hits < 10000)
            }),
        (s) => s.hits < 250 || ((s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && s.hits < 10000),
        'emergencyRepairId',
    );
    if (!structure) {
        structure = this.getTarget(
            () =>
                _.min(this.room.findRepairByPriority([
                    STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER,
                    STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL,
                    STRUCTURE_LINK, STRUCTURE_LAB, STRUCTURE_EXTRACTOR, STRUCTURE_OBSERVER,  STRUCTURE_NUKER,
                    STRUCTURE_ROAD,
                    STRUCTURE_RAMPART, STRUCTURE_WALL
                ], wallMax), (s) => s.hits),
            (structure) => {
                if (structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_WALL) {
                    return structure.hits < wallMax;
                }
                return structure.hits < structure.hitsMax;
            },
            'repairId',
        );
    }
    if (structure) {
        this.room.visual.line(this.pos, structure.pos, {lineStyle: 'dashed', opacity: 0.5});
    }
    if (structure && this.repair(structure) === ERR_NOT_IN_RANGE) {
        this.moveTo(structure);
    }
    return structure;
};

Creep.prototype.recycle = function () {
    let spawn = this.getTarget(
        () => this.pos.findClosestByPath(FIND_MY_SPAWNS)
    );
    if (spawn.recycleCreep(this) === ERR_NOT_IN_RANGE) {
        this.moveTo(spawn);
    }
};

Creep.prototype.moveIntoRoom = function () {
    if (this.pos.x === 0) {
        this.move(RIGHT);
    } else if (this.pos.x === 49) {
        this.move(LEFT);
    } else if (this.pos.y === 0) {
        this.move(BOTTOM);
    } else if (this.pos.y === 49) {
        this.move(TOP);
    }
};