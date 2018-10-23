import * as tl from 'vsts-task-lib';
import * as tlext from './tasklibext'
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { EventEmitter } from 'events';

export async function run(): Promise<any> {
    let packer = tl.tool('packer');

    addListeners(packer);
    addCommand(packer);
    addAwsVariables(packer);
    addAzureVariables(packer);
    addForce(packer);
    addVariables(packer);
    addVariablesFile(packer);
    addOptions(packer);
    addTemplate(packer);

    await packer.exec();
}

export function addCommand(packer: ToolRunner) {
    packer.arg(tl.getInput('command'));
}

export function addForce(packer: ToolRunner) {
    packer.argIf(tl.getBoolInput('force'), '-force');
}

export function addVariables(packer: ToolRunner) {
    tl.getDelimitedInput('variables', '\n', false).forEach(v => {
        packer.arg(['-var', v]);
    });
}

export function addVariablesFile(packer: ToolRunner) {
    packer.argIf(tl.filePathSupplied('variables-file'), ['-var-file', tl.getPathInput('variables-file', false, true)]);
}

export function addOptions(packer: ToolRunner) {
    packer.line(tl.getInput('options'));
}

export function addTemplate(packer: ToolRunner) {
    let template = tl.getPathInput('templatePath', true, true);
    packer.arg(template);
}

function addAwsVariables(packer: ToolRunner) {
    let serviceType = tl.getInput('serviceType', true);
    if (serviceType == 'aws') {
        let id = tl.getInput('awsSubscription');

        let access_key = tl.getEndpointAuthorizationParameter(id, 'username', false);
        packer.arg(['-var', `access_key=${access_key}`]);

        let secret_key = tl.getEndpointAuthorizationParameter(id, 'password', false);
        packer.arg(['-var', `secret_key=${secret_key}`]);
    }
}

export function addAzureVariables(packer: ToolRunner) {
    let serviceType = tl.getInput('serviceType', true);
    if (serviceType == 'azure') {
        let id = tl.getInput('azureSubscription');
        let client_id = tl.getEndpointAuthorizationParameter(id, 'serviceprincipalid', false);
        packer.arg(['-var', `client_id=${client_id}`]);

        let client_secret = tl.getEndpointAuthorizationParameter(id, 'serviceprincipalkey', false);
        packer.arg(['-var', `client_secret=${client_secret}`]);

        let subscription_id = tl.getEndpointDataParameter(id, "SubscriptionId", false);
        packer.arg(['-var', `subscription_id=${subscription_id}`]);

        let tenant_id = tl.getEndpointAuthorizationParameter(id, 'tenantid', false);
        packer.arg(['-var', `tenant_id=${tenant_id}`]);
    }
}

export function addListeners(tool: EventEmitter) {
    tool.addListener('stdout', _ => extractVariable(_.toString()));

    function extractVariable(m: string) {
        let match = m.match(/(OSDiskUri|OSDiskUriReadOnlySas|TemplateUri|TemplateUriReadOnlySas): (.*)/);
        if (match) {
            tlext.setVariable(match[1], match[2]);
        }
    }
}

run().catch(error =>
    tl.setResult(tl.TaskResult.Failed, error)
);


