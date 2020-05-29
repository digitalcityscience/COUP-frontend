import {Fill, Stroke, Style, Circle, Icon} from "ol/style";
import ImageStyle from 'ol/style/Image';

export default {
    defaultColor: "#FF39DA",
    selectedColor: "#DA39FF",
    defaultWidth: 5,
    defaultRadius: 5,
    defaultFill: new Fill({
        color: "rgba(255, 128, 175, 0.7)"
    }),
    defaultStroke: new Stroke({
        color: "#FF39DA",
        width: 3
    }),
    default() {
        const fill = this.defaultFill;
        const stroke = this.defaultStroke;
        return new Style({
            fill,
            stroke,
            image: new Circle({
                radius: 5,
                fill,
                stroke
            })
        })
    },
    selected() {
        const fill = new Fill({
            color: "rgba(175, 128, 255, 0.7)"
        })
        const stroke = new Stroke({
            color: "#DA39FF",
            width: 3
        })

        return new Style({
            fill,
            stroke,
            image: new Circle({
                radius: 5,
                fill,
                stroke
            })
        })
    },
    createStyle(opts) {
        const fill = new Fill({
            color: opts?.fill?.color || this.defaultColor
        });
        const stroke = new Stroke({
            color: opts?.stroke?.color || this.defaultColor,
            width: opts?.stroke?.width || this.defaultWidth
        });
        const circle = new Circle({
            fill,
            stroke,
            radius: opts?.circle?.radius || this.defaultRadius
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
                return this.default();
            }
            // return simple colored Style if color value is specified
            if (opts?.color) {
                return this.byColor(opts.color, opts);
            }
            // return simple colored Style if color value is specified
            if (typeof opts === "string") {
                return this.byColor(opts);
            }
            // if style is provided as object, create new Style from options
            if (opts?.constructor === Object) {
                return this.createStyle(opts);
            }
        }
        catch (e) {
            // if style generation fails return default Style
            return this.default()
        }
    }
};
