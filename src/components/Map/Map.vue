<script lang="ts">
import { mapActions, mapGetters } from 'vuex'

export default {
    name: 'Map',
    components: {
    },
    computed: {
        ...mapGetters([
            'layers',
            'deckLayers'
        ])
    },
    watch: {
        layers () {
            console.log(this.layers)
            this.$store.dispatch('parseLayers')
        },
        deckLayers () {
            console.log(this.deckLayers)
            this.$store.dispatch('renderLayers')
        }
    },
    mounted () {
        this.renderDeck()
    },
    methods: {
        ...mapActions([
            'renderDeck',
            'renderLayers'
        ])
    }
}
</script>

<template>
    <canvas
        id="deck"
        onContextMenu="return false;"
    />
</template>

<style lang="scss">
    #deck {
        width: 100%;
        height: 100%;
    }
</style>
