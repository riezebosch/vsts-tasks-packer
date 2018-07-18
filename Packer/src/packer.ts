import * as tl from 'vsts-task-lib';
import { ToolRunner } from 'vsts-task-lib/toolrunner';

async function run(): Promise<any> {
    let packer = tl.tool('packer');

    addCommand(packer, tl);
    addAzureVariables(packer, tl);
    addForce(packer, tl);
    addVariables(packer, tl);
    addVariablesFile(packer, tl);
    addPackerOptions(packer, tl);
    addPackerTemplate(packer, tl);

    await packer.exec();
}
function addCommand(packer: ToolRunner, tl: TlWrapper) {
    packer.arg(tl.getInput('command'));
}

function addForce(packer: ToolRunner, tl: TlWrapper) {
    if (tl.getBoolInput('force')) {
        packer.arg('-force');
    }
}

function addVariables(packer: ToolRunner, tl: TlWrapper) {
    tl.getDelimitedInput('variables', '\n', false).forEach(v => {
        packer.arg(['-var', v]);
    });
}

function addVariablesFile(packer: ToolRunner, tl: TlWrapper) {
    if (tl.filePathSupplied('variables-file')) {
        packer.line(`-var-file ${tl.getPathInput('variables-file', false, true)}`);
    }
}

function addPackerOptions(packer: ToolRunner, tl: TlWrapper) {
    let options = tl.getInput('options');
    packer.line(options);
}

function addPackerTemplate(packer: ToolRunner, tl: TlWrapper) {
    let template = tl.getPathInput('templatePath', true, true);
    packer.arg(template);
}

export interface InputResolver {
    getInput(name: string, required?: boolean): string;
    getBoolInput(name: string);
    getDelimitedInput(name: string, delim: string, required?: boolean): string[];
}

export interface FileInputResolver {
    filePathSupplied(name: string): boolean;
    getPathInput(name: string, required?: boolean, check?: boolean): string;
}
export interface AzureEndpointParameterResolver {
    getEndpointAuthorizationParameter(id: string, key: string, optional: boolean): string;
    getEndpointDataParameter(id: string, key: string, optional: boolean): string;
}

export interface TlWrapper extends InputResolver, AzureEndpointParameterResolver, FileInputResolver {
}

export function addAzureVariables(packer: ToolRunner, tl: TlWrapper) {
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


run().then(_ =>
    tl.setResult(tl.TaskResult.Succeeded, "")
).catch(error =>
    tl.setResult(tl.TaskResult.Failed, error)
);