param(
    [string]$CompanyName
)


$resourceGroup = "bridgeconnect" # Set your resource group name
$location = "canadacentral" # Set your Azure location

$storageName = ("${CompanyName}storage").ToLower()
$functionAppName = ("${CompanyName}").ToLower()

# Create resource group if not exists
az group create --name $resourceGroup --location $location

# Parse .env file into a hashtable
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$") {
        $envVars[$matches[1]] = $matches[2]
    }
}

# Create storage account (will reuse if exists)
az storage account create --name $storageName --location $location --resource-group $resourceGroup --sku Standard_LRS --allow-blob-public-access false --kind StorageV2

# Delete and recreate function app if exists
az functionapp delete --name $functionAppName --resource-group $resourceGroup --only-show-errors
az functionapp create --resource-group $resourceGroup --consumption-plan-location $location --name $functionAppName --storage-account $storageName --runtime node --functions-version 4


# Get existing app settings from Azure
$existingSettings = az functionapp config appsettings list --name $functionAppName --resource-group $resourceGroup | ConvertFrom-Json

# Only set new settings from .env
$settingsToSet = @()
foreach ($kv in $envVars.GetEnumerator()) {
    $key = $kv.Key
    $value = $kv.Value
    if (-not ($existingSettings | Where-Object { $_.name -eq $key })) {
        $settingsToSet += "$key=$value"
    }
}

if ($settingsToSet.Count -gt 0) {
    az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings $settingsToSet
}

# Deploy the function
func azure functionapp publish $functionAppName --javascript