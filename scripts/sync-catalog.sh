# This script syncs latest cloud catalog data produced by azure-speed-jobs

SOURCE_DIR="https://azurespeedjobs.blob.core.windows.net/jobs/cloud-catalog"
TARGET_DIR="../src/AzureSpeed.WebApp/ClientApp/src/assets/data"

curl ${SOURCE_DIR}/azure/geographies.json > ${TARGET_DIR}/geographies.json
curl ${SOURCE_DIR}/azure/regions.json > ${TARGET_DIR}/regions.json