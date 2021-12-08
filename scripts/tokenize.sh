#!/bin/bash

set -e

envs=($(grep -oPe "process\.env\.\K[A-Z_]+" $(pwd)/src/config.js|sort|uniq))

for item in ${envs[*]}
do
    value=($(md5sum <<<"$item"))
    export $item="$value"
done
