#!/bin/bash

# Deploy revision using in webpack.prod.js
export DEPLOY_REVISION=`date +"%s"`

# vars
ARCHIVE_NAME=$DEPLOY_REVISION.zip
REMOTE_RELEASES_PATH=$DEPLOY_PATH

set -o errexit # Exit on error

# Build project
yarn build

# Zip project
zip $ARCHIVE_NAME -r *

# Remote commands
# Make dir
ssh $DEPLOY_ADDRESS -p $DEPLOY_PORT "mkdir -p $REMOTE_RELEASES_PATH"
# Copy zip
scp -P $DEPLOY_PORT $ARCHIVE_NAME $DEPLOY_ADDRESS:$REMOTE_RELEASES_PATH
# Unzip and remove archive
ssh $DEPLOY_ADDRESS -p $DEPLOY_PORT "
    cd $REMOTE_RELEASES_PATH &&
    unzip $ARCHIVE_NAME &&
    rm $ARCHIVE_NAME
"

# Remove local archive
rm $ARCHIVE_NAME
