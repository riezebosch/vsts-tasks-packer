import * as tl from 'vsts-task-lib';
import * as tlext from './tasklibext'
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { EventEmitter } from 'events';

export async function run(): Promise<any> {
    let packer = tl.tool('packer');

    addListeners(packer);
    addCommand(packer);
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

export function addAzureVariables(packer: ToolRunner) {
    let service = tl.getInput('azureSubscription');
    let client_id = tl.getEndpointAuthorizationParameter(service, 'serviceprincipalid', false);
    packer.arg(['-var', `client_id=${client_id}`]);

    let client_secret = tl.getEndpointAuthorizationParameter(service, 'serviceprincipalkey', false);
    packer.arg(['-var', `client_secret=${client_secret}`]);

    let subscription_id = tl.getEndpointDataParameter(service, "SubscriptionId", false);
    packer.arg(['-var', `subscription_id=${subscription_id}`]);

    let tenant_id = tl.getEndpointAuthorizationParameter(service, 'tenantid', false);
    packer.arg(['-var', `tenant_id=${tenant_id}`]);
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


