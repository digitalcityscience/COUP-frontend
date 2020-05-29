/** FORKED FROM https://bitbucket.org/geowerkstatt-hamburg/masterportalapi */

import proj4 from 'proj4'
import * as Proj from 'ol/proj.js'
import { register } from 'ol/proj/proj4.js'

/**
 * Returns the proj4 projection definition for a registered name.
 * @param {string} name - projection name as written in [0] position of namedProjections
 * @returns {(object|undefined)} proj4 projection object or undefined
 */
export function getProjection (name) {
    return proj4.defs(name)
}

/**
 * The configured named projections and proj4 have to be registered initially.
 * @param {string[]} [namedProjections=[
        ["EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"]
    ]] - projection name, projection definition string
 * @returns {undefined}
 */
export function registerProjections (namedProjections) {
    proj4.defs(namedProjections)
    register(proj4)
    namedProjections.forEach(projection => {
        Proj.addProjection(Proj.get(projection[0]))
        getProjection(projection[0]).masterportal = true
    })
}

/**
 * Returns all known projections.
 * @returns {object[]} array of projection objects with their name added
 */
export function getProjections () {
    const projections = Object
        .keys(proj4.defs)
        .map(name => Object.assign(proj4.defs(name), { name }))

    // return no duplicates and only the projections which are registred with masterportal=true
    return projections.filter(function (projection, index, self) {
        return index === self.indexOf(projection) && projection.masterportal === true
    })
}

/**
 * Returns the currently active projection's name of a map's view.
 * @param {ol.Map} map - map to get projection of
 * @returns {string} active projection name of map
 */
export function getMapProjection (map) {
    return map.getView().getProjection().getCode()
}

/**
 * Resolves a string to a projection object; everything else is returned as-is.
 * If a string can not be resolved, returns undefined.
 * @param {(string|object)} projection - projection name or projection
 * @returns {(object|undefined)} proj4 projection or undefined or parameter
 */
function getProj4Projection (projection) {
    return typeof projection === 'string'
        ? getProjection(projection)
        : projection
}

/**
 * Transforms a given point from a source to a target projection.
 * @param {(string|object)} sourceProjection - projection name or projection of point
 * @param {(string|object)} targetProjection - projection name or projection to project point to
 * @param {number[]} point - point to project
 * @returns {number[]|undefined} transformed point
 */
export function transform (sourceProjection, targetProjection, point) {
    const source = getProj4Projection(sourceProjection)
    const target = getProj4Projection(targetProjection)

    if (source && target && point) {
        return proj4(source, target, point)
    }

    console.error(`Cancelled coordinate transformation with invalid parameters: ${sourceProjection}; ${targetProjection}; ${point}`)
    return undefined
}

/**
 * Projects a point to the given map.
 * @param {ol.Map} map - map to project to
 * @param {(string|object)} sourceProjection - projection name or projection of point
 * @param {number[]} point - point to project
 * @returns {number[]|undefined} new point or undefined
 */
export function transformToMapProjection (map, sourceProjection, point) {
    return transform(sourceProjection, getMapProjection(map), point)
}

/**
 * Projects a point from the given map.
 * @param {ol.Map} map - map to project from, and point must be in map's projection
 * @param {(string|object)} targetProjection - projection name or projection to project to
 * @param {number[]} point - point to project
 * @returns {(number[]|undefined)} new point or undefined
 */
export function transformFromMapProjection (map, targetProjection, point) {
    return transform(getMapProjection(map), targetProjection, point)
}
