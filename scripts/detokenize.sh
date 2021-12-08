#!/bin/bash

set -e

envs=($(grep -oPe "process\.env\.\K[A-Z_]+" $(pwd)/config.js|sort|uniq))

for item in ${envs[*]}
do
    if [[ -z "${!item}" ]]; then
        value="null"
    else
        value=$(echo ${!item})
        value=$(echo "$value" | sed 's/\//\\\//g')
    fi

    token=($(md5sum <<<"$item"))
    echo $token"    $item      -->  "$value
    # append '/dist' to current dir, otherwise the whole repository will be searched
    find /usr/share/nginx/html -type f -exec sed -i "s/$token/$value/g" {} +
done
