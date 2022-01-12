#!/bin/bash

set -e

envs=($(grep -oPe "process\.env\.\K[A-Z_]+" $(pwd)/env-production/env-variables.ts|sort|uniq))

for item in ${envs[*]}
do
    value=($(md5sum <<<"$item"))
    export $item="$value"
done
