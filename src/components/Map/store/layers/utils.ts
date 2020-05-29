import { Layer } from 'ol/layer';

export function assignLayerId (state, layer?: Layer) {
    let id = 1;
    let vacant = false;

    while (!vacant || id > state.layers.length) {
        if (state.layers.find(l => l.get('id') === id)) {
            id += 1;
        }
        else {
            vacant = true;
            break;
        }
    }

    if (layer) {
        layer.set('id', id);
    }

    return id;
}