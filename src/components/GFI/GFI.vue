<script>
import { mapState } from 'vuex'
export default {
    name: 'GFI',
    components: {
    },
    data () {
        return {
        }
    },
    computed: {
        ...mapState([
          'map'
        ])
    },
    watch: {
    },
    methods: {
    }
}
</script>

<template>
    <div id="GFI" />
</template>

<style lang="scss" scoped>
</style>
