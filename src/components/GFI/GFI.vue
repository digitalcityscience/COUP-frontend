<script>
import { mapGetters } from 'vuex'
import { platformModifierKeyOnly } from 'ol/events/condition'
import { DragBox } from 'ol/interaction'

export default {
    name: 'GFI',
    components: {
    },
    data () {
        return {
            boxInteraction: new DragBox({
                condition: platformModifierKeyOnly,
                onBoxEnd: this.boxSelect
            })
        }
    },
    computed: {
        ...mapGetters('Map', [
            'map'
        ]),
        ...mapGetters('GFI', [
            'active',
            'selectedFeaturesInfo'
        ]),
        ...mapGetters('Map/Layers', [
            'layers'
        ]),
        selectedFeatures: {
            get () {
                return this.$store.state?.GFI?.selectedFeatures
            },
            set (features) {
                this.$store.commit('GFI/selectedFeatures', features)
            }
        }
    },
    watch: {
        active (state) {
            if (state) {
                this.listen()
            }
            else {
                this.unlisten()
            }
        },
        selectedFeatures () {
            console.log(this.selectedFeaturesInfo)
        }
    },
    mounted () {
        if (this.active) {
            this.listen()
        }
    },
    methods: {
        listen () {
            this.map.addEventListener('click', this.clickSelect)
            this.map.addInteraction(this.boxInteraction)
        },
        unlisten () {
            this.map.removeEventListener('click', this.clickSelect)
            this.map.removeInteraction(this.boxInteraction)
        },
        clickSelect (evt) {
            const clickedFeatures = []

            evt.map.forEachFeatureAtPixel(evt.pixel, feature => {
                clickedFeatures.push(feature)
            }, {
                layerFilter: layer => !layer.get('disabled')
            })

            this.selectedFeatures = clickedFeatures
        },
        boxSelect () {
            const extent = this.boxInteraction.getGeometry().getExtent()
            const selectedFeatures = []

            this.layers.forEach(l => {
                if (!l.get('disabled')) {
                    const source = l.getSource()

                    if (source.forEachFeatureIntersectingExtent) {
                        source.forEachFeatureIntersectingExtent(extent, feature => {
                            selectedFeatures.push(feature)
                        })
                    }
                }
            })

            this.selectedFeatures = selectedFeatures
        }
    }
}
</script>

<template>
    <div id="GFI" />
</template>

<style lang="scss" scoped>
</style>
