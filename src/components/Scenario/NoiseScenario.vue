<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'

export default {
    name: 'AbmScenario',
    components: {},
    data () {
        return {
            testScript: "Hello I'm here",
        }
    },
    methods: {},
}

</script>

<template>
    <div class="component_body">
        <p>Display Noise Data</p>
    </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
</style>