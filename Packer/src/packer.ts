import * as tl from 'vsts-task-lib';

async function run(): Promise<any> {
    let packer = tl.tool('packer');

    addCommand();
    addAzureVariables();
    addForce();
    addVariables();
    addVariablesFile();
    addPackerOptions();
    addPackerTemplate();

    await packer.exec();

    function addCommand() {
        let command = tl.getInput('command');
        packer.arg(command);
    }

    function addForce() {
        if (tl.getBoolInput('force')) {
            packer.arg('-force');
        }
    }

    function addVariables() {
        tl.getDelimitedInput('variables', '\n', false).forEach(v => {
            packer.arg(['-var', v]);
        });
    }

    function addVariablesFile() {
        if (tl.filePathSupplied('variables-file')) {
            packer.line(`-var-file ${tl.getPathInput('variables-file', false, true)}`);
        }
    }

    function addPackerOptions() {
        let options = tl.getInput('options');
        packer.line(options);
    }

    function addPackerTemplate() {
        let template = tl.getPathInput('templatePath', true, true);
        packer.arg(template);
    }

    function addAzureVariables() {
        let service = tl.getInput('azureSubscription');
        let client_id = tl.getEndpointAuthorizationParameter(service, 'serviceprincipalid', false);
        packer.line(`-var client_id=${client_id}`);

        let client_secret = tl.getEndpointAuthorizationParameter(service, 'serviceprincipalkey', false);
        packer.line(`-var client_secret=${client_secret}`);
        
        let subscription_id = tl.getEndpointDataParameter(service, "SubscriptionId", true);
        packer.line(`-var subscription_id=${subscription_id}`);
        
        let tenant_id = tl.getEndpointAuthorizationParameter(service, 'tenantid', false);
        packer.line(`-var tenant_id=${tenant_id}`);
    }
}

run().then(_ =>
    tl.setResult(tl.TaskResult.Succeeded, "")
).catch(error =>
    tl.setResult(tl.TaskResult.Failed, error)
);