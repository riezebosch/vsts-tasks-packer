# Packer

Install and execute [packer](https://packer.io) as part of your build & release pipelines.
![preview](screenshots/preview.png)

## Release Notes

> **18-01-2019**
> * Output variable for `DeploymentName` (so you can cleanup resources when Packer fails to do so).
> * Default version for packer tool updated: `1.3.3`
>
> **03-12-2018**
> * Packer@V1 out of preview
> * Disable color for `packer build` by default with `-color=false` switch
> * Default version for packer tool updated: `1.3.2`
> 
> **23-10-2018**
> * Support for AWS in V1-peview.
> * Default version for packer tool updated: `1.3.1`
>
> **21-08-2018**
> * Added additional output variables for `OSDiskUriReadOnlySas`, `TemplateUri` and `TemplateUriReadOnlySas` (when building VHD's)
> * Write variables as output so they're also available in [YAML builds](https://github.com/Microsoft/vsts-agent/blob/master/docs/preview/yamlgettingstarted-outputvariables.md).
> 
> **24-07-2018**
> * Write the capture url of the VHD to the `OSDiskUri` output variable so it is accessible for downstream tasks.

## Packer Tool

Downloads & installs specified version of packer and adds it to the tool cache.

## Packer

Execute packer commands. By selecting your Azure or AWS service connection, the authorization and values are resolved from that and provided as variables to your packer template.

Azure [required variables](https://www.packer.io/docs/builders/azure.html#required-):

data                    | variable name
------------------------|--------------
service principal id    | client_id
serivice principal key  | client_secret
subscription id         | subscription_id
tenant id               | tenant_id

AWS [required variables](https://www.packer.io/docs/builders/amazon.html#static-credentials):

data                    | variable name
------------------------|--------------
Access Key ID           | access_key
Secret Access Key       | secret_key

Note: The variable name is (currently) static and the template must therefor use this provided name. Luckily this matches the required input for the respective builders.

## Example YAML

```yaml
resources:
- repo: self
steps:
- task: riezebosch.Packer.PackerTool.PackerTool@0
  displayName: 'Use Packer 1.3.3'
  inputs:
    version: 1.3.3

- task: Packer@1
  displayName: 'Packer build'
  inputs:
    connectedServiceType: azure #azure|aws|none
    connectedServiceAzure: 'My Subscription'
    #connectedServiceAWS: 'aws demo'
    templatePath: linux.json
    #force: true|false Force a build to continue if artifacts exist, deletes existing artifacts
    variables: |+
        resource_group=$(resource-group)
        managed_image_name=small-linux
        storage_account=$(storage-account)
    #variables-file: JSON file containing user variables.
    #options: Additional options, see Packer Commands (CLI)  for more information.
```

See [Packer Commands (CLI)](https://www.packer.io/docs/commands/index.html) for more information.

## Output Variables

* OSDiskUri
* OSDiskUriReadOnlySas
* TemplateUri
* TemplateUriReadOnlySas
* DeploymentName