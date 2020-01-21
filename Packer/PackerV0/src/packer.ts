import * as tl from 'azure-pipelines-task-lib';
import * as tlext from './tasklibext'
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import { EventEmitter } from 'events';

async function run(): Promise<any> {
    let packer = tl.tool('packer');

    addListeners(packer, tlext);
    addCommand(packer, tl);
    addAzureVariables(packer, tl);
    addForce(packer, tl);
    addVariables(packer, tl);
    addVariablesFile(packer, tl);
    addOptions(packer, tl);
    addTemplate(packer, tl);

    await packer.exec();
}

export function addCommand(packer: ToolRunner, tl: InputResolver) {
    packer.arg(tl.getInput('command'));
}

export function addForce(packer: ToolRunner, tl: InputResolver) {
    packer.argIf(tl.getBoolInput('force'), '-force');
}

export function addVariables(packer: ToolRunner, tl: InputResolver) {
    tl.getDelimitedInput('variables', '\n', false).forEach(v => {
        packer.arg(['-var', v]);
    });
}

export function addVariablesFile(packer: ToolRunner, tl: PathResolver) {
    packer.argIf(tl.filePathSupplied('variables-file'), ['-var-file', tl.getPathInput('variables-file', false, true)]);
}

export function addOptions(packer: ToolRunner, tl: InputResolver) {
    packer.line(tl.getInput('options'));
}

export function addTemplate(packer: ToolRunner, tl: PathResolver) {
    let template = tl.getPathInput('templatePath', true, true);
    packer.arg(template);
}

export interface InputResolver {
    getInput(name: string, required?: boolean): string;
    getBoolInput(name: string);
    getDelimitedInput(name: string, delim: string, required?: boolean): string[];
}

export interface PathResolver {
    filePathSupplied(name: string): boolean;
    getPathInput(name: string, required?: boolean, check?: boolean): string;
}
export interface AzureEndpointParameterResolver {
    getEndpointAuthorizationParameter(id: string, key: string, optional: boolean): string;
    getEndpointDataParameter(id: string, key: string, optional: boolean): string;
}

export interface Output {
    /**
     * Sets a variable which will be available to subsequent tasks as well.
     *
     * @param     name    name of the variable to set
     * @param     val     value to set
     * @param     secret  whether variable is secret.  Multi-line secrets are not allowed.  Optional, defaults to false
     * @returns   void
     */
    setVariable(name: string, val: string, secret?: boolean): void;
}

export function addAzureVariables(packer: ToolRunner, tl: AzureEndpointParameterResolver & InputResolver) {
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

export function addListeners(tool: EventEmitter, tl: Output) {
    tool.addListener('stdout', _ => extractVariable(_.toString()));

    function extractVariable(m: string) {
        let match = m.match(/(OSDiskUri|OSDiskUriReadOnlySas|TemplateUri|TemplateUriReadOnlySas): (.*)/);
        if (match) {
            tl.setVariable(match[1], match[2]);
        }
    }
}


run().then(_ =>
    tl.setResult(tl.TaskResult.Succeeded, "")
).catch(error =>
    tl.setResult(tl.TaskResult.Failed, error)
);


