import { Fill, Stroke, Style, Circle, Icon } from 'ol/style'
import { defaultVectorStyles } from '@/defaults'
import { Feature } from 'ol'


/**
 * CONFIGURE YOUR CUSTOM STYLE FUNCTIONS HERE
 * including fallbacks
 */
export default {
    grocery (feature: Feature) {
        const properties = feature.getProperties()

        return new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: this[properties.kette]?.color || defaultVectorStyles.defaultColor
                }),
                stroke: new Stroke({
                    color: this[properties.kette]?.color || defaultVectorStyles.defaultColor,
                    width: 3
                })
            })
        })
    }
}