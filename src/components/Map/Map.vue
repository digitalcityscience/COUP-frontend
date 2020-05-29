<script>
import { mapActions } from 'vuex'

export default {
    name: 'Map',
    components: {
    },
    data: () => ({
    }),
    mounted () {
        console.log(this.$store)
        this.generateMap()
    },
    methods: {
        ...mapActions('Map', [
            'generateMap'
        ])
    }
}
</script>

<template>
    <div id="map" />
</template>

<style lang="scss">
    #map {
        width: 100%;
        height: 100%;
    }
</style>
