import mapStyle from "@/assets/mapStyle.json";


const mapConfig = {
    "view": {
        "center": [10.013542, 53.528397],
        "zoom": 14.7,
        "pitch": 0,
        "bearing": 25
    },
    "mapStyle": mapStyle,
    "layers": [],
    "deckLayer": {
        "stroked": true,
        "filled": true,
        "lineWidthMinPixels": 2,
        "opacity": 0,
        "getLineColor": [255, 100, 100],
        "getFillColor": [255, 255, 255, 180],
        "style": {
            "blend-mode": "hard-light"
        }
    },
    "HeatmapLayer": {
        "filled": true
    },
    "sources": []
}

export default mapConfig;
