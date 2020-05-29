import { defaultLayerRequest } from "@/defaults";

export default {
    composeUrl (url: string, typename: string, opts: {bbox: number[], srsname: string, outputFormat: string, version: string}) {

        let uri = url
        uri += `?service=WFS`
        uri += `&request=GetFeature`,
        uri += `&version=${opts.version || defaultLayerRequest.wfsVersion}`
        uri += `&typename=${typename}`

        if (opts.outputFormat) {
            uri += `&outputFormat=${opts.outputFormat}`
        }
        if (opts.srsname) {
            uri += `&srsname=${opts.srsname}`
        }
        if (opts.bbox) {
            uri += `&bbox=${opts.bbox.join[',']}`
        }
        
        return uri
    }
}