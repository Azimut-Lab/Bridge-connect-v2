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

# Set environment variables from .env
$settings = $envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings $settings

# Deploy the function
func azure functionapp publish $functionAppName --javascript