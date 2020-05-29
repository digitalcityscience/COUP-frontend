import {Fill, Stroke, Style, Circle, Icon} from "ol/style";
import { defaultVectorStyles } from '@/defaults';
import styleFunctions from '@/config/styles.ts';

// THIS IS STUPID :D
// function evalStyle (properties: any, styleDef: any) {
//     if (typeof styleDef !== "string") {
//         return styleDef
//     }
//     if (!styleDef?.includes("[")) {
//         return styleDef
//     }

//     const styleGroup = styleDef.substring(0, styleDef.indexOf('['))
//     const property = styleDef.substring(styleDef.indexOf('[') + 1, styleDef.indexOf(']'))
//     const attributes = styleDef.substring(styleDef.indexOf(']') + 1).split('.')
//     let style = stylesConfig?.[styleGroup]?.[properties[property]];

//     for (let i = 1; i < attributes.length; i++) {
//         style = style?.[attributes[i]];
//     }

//     console.log(properties, styleDef, style);

//     return style;
// }

export default {
    default: new Style({
        fill: defaultVectorStyles.defaultFill,
        stroke: defaultVectorStyles.defaultStroke,
        image: new Circle({
            radius: 5,
            fill: defaultVectorStyles.defaultFill,
            stroke: defaultVectorStyles.defaultStroke
        })
    }),
    selected: new Style({
        fill: defaultVectorStyles.selectedFill,
        stroke: defaultVectorStyles.selectedStroke,
        image: new Circle({
            radius: 5,
            fill: defaultVectorStyles.selectedFill,
            stroke: defaultVectorStyles.selectedStroke
        })
    }),
    createStyle(opts) {
        const fill = new Fill({
            color: opts?.fill?.color || defaultVectorStyles.defaultColor
        });
        const stroke = new Stroke({
            color: opts?.stroke?.color || defaultVectorStyles.defaultColor,
            width: opts?.stroke?.width || defaultVectorStyles.defaultWidth
        });
        const circle = new Circle({
            fill,
            stroke,
            radius: opts?.circle?.radius || defaultVectorStyles.defaultRadius
        })
        const icon = opts?.icon ? new Icon(opts.icon) : undefined;

        return new Style({
            fill,
            stroke,
            image: icon || circle
        });
    },
    byColor(color, opts?) {
        if (!color) {
            return this.default;
        }

        const fill = new Fill({
            color: opts?.fill?.color || color
        });
        const stroke = new Stroke({
            color: opts?.stroke?.color || color,
            width: opts?.stroke?.width || this.defaultWidth
        });

        return new Style({
            fill,
            stroke,
            image: new Circle({
                radius: opts.circle.radius || this.defaultRadius,
                fill,
                stroke
            })
        });
    },
    highlight(style) {
        if (!style) {
            return this.selected;
        }

        style.setStroke(
            new Stroke({
                color: this.selectedColor,
                width: 6
            })
        );

        return style;
    },
    styleFromConfig(opts?: any | string) {
        try {
            // return defaultStyle if options are not provided
            if (!opts) {
                return this.default;
            }
            // return simple colored Style if color value is specified
            if (typeof opts === "string") {
                return this.byColor(opts);
            }
            // return simple colored Style if color value is specified
            if (opts?.color) {
                return this.byColor(opts.color, opts);
            }
            // returns a style Function from custom styles.js
            if (opts?.function) {
                console.log(styleFunctions[opts.function]);
                return styleFunctions[opts.function]?.bind(opts) || this.default;
            }
            // if style is provided as object, create new Style from options
            if (opts?.constructor === Object) {
                return this.createStyle(opts);
            }
        }
        catch (e) {
            // if style generation fails return default Style
            return this.default
        }
    }
};
