$result=$tenantsFile = (Get-Content "result.json") | ConvertFrom-Json
    
$out+="<table>"
$out+="<thead>"
$out+="<tr>"
$out+="<th>MeterCategory</th>"
$out+="<th>MeterSubCategory</th>"
$out+="<th>MeterId</th>"
$out+="<th>MeterName</th>"
# $out+="<th>MeterRates</th>"
$out+="<th>Unit</th>"
$out+="<th>IncludedQuantity</th>"
$out+="</tr>"
$out+="</thead>"

$out+="<tbody>"
foreach ($meter in $result.Meters)
{
     $out+="<tr>"
     $out+="<td>$($meter.MeterCategory)</td>"
     $out+="<td>$($meter.MeterSubCategory)</td>"
     $out+="<td>$($meter.MeterId)</td>"
     $out+="<td>$($meter.MeterName)</td>"
    #  $out+="<td>$($meter.MeterRates)</td>"
     $out+="<td>$($meter.Unit)</td>"
     $out+="<td>$($meter.IncludedQuantity)</td>"
     $out+="</tr>"
}
$out+="</tbody>"
$out+="</table>"

$out | Out-File "result.html"

