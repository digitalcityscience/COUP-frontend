import {all} from 'ol/loadingstrategy';

const defaultView = {
    zoom: 12,
    center: [9.9937, 53.5511]
}
const defaultBBox = [510000.0, 5850000.0, 625000.4, 6000000.0]
const defaultMap = {
    id: 'map'
}
const defaultProjections = [
    ["EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"]
]
const defaultLayerRequest = {
    wfsVersion: '1.1.0',
    strategy: all
}

const defaultLayerOptions = {
    opacity: 1.0,
    visible: true,
    zIndex: 0,
    minResolution: undefined,
    maxResolution: undefined
}

export {
    defaultView,
    defaultMap,
    defaultProjections,
    defaultBBox,
    defaultLayerRequest,
    defaultLayerOptions
}
