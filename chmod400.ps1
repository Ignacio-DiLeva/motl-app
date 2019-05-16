$path = '.\key-pair-test.pem'
$acl = Get-Acl $path
$acl.SetAccessRuleProtection($true,$false)
$acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) }
$ace = New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList $acl.Owner, 'Read', 'Allow'
$acl.AddAccessRule($ace)
Set-Acl -Path $path -AclObject $acl