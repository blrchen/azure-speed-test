# Define the Azure environments
$azureCloud = (Get-AzEnvironment -Name AzureCloud)
$azureUSGovernment = (Get-AzEnvironment -Name AzureUSGovernment)
$azureChinaCloud = (Get-AzEnvironment -Name AzureChinaCloud)

$properties = ($azureCloud | Get-Member -MemberType Property).Name

# Define the HTML structure
$html = @"
<table class="table table-striped">
    <thead>
        <tr>
            <th scope="col"></th>
            <th scope="col">AzureCloud</th>
            <th scope="col">AzureUSGovernment</th>
            <th scope="col">AzureChinaCloud</th>
        </tr>
    </thead>
    <tbody>
$(
    foreach ($property in $properties) {
        $row = @"
        <tr>
            <td><strong>$property</strong></td>
            <td>$($azureCloud.$property)</td>
            <td>$($azureUSGovernment.$property)</td>
            <td>$($azureChinaCloud.$property)</td>
        </tr>
"@
        $row
    }
)
    </tbody>
</table>
"@

# Output the HTML
$html