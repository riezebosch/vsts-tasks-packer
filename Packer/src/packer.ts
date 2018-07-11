import * as tl from 'vsts-task-lib';
import { ToolRunner } from '../node_modules/vsts-task-lib/toolrunner';

async function run(): Promise<any> {
    let command = tl.getInput('command');
    let variables = JSON.parse(tl.getInput('variables'));
    let options = tl.getInput('options');

    let service = tl.getInput('ConnectedServiceName');
    let client_id = tl.getEndpointAuthorizationParameter(service, 'serviceprincipalid', false);
    let client_secret = tl.getEndpointAuthorizationParameter(service, 'serviceprincipalkey', false);
    client_secret = encodeURIComponent(client_secret);
    
    let subscription_id = tl.getEndpointDataParameter(service, "SubscriptionId", true);
    let tenant_id = tl.getEndpointAuthorizationParameter(service, 'tenantid', false);
    
    let template = tl.getPathInput('customTemplateLocation', true, true);

    let packer = tl.tool('packer');
    packer.arg(command);

    packer.arg(['-var', `client_id=${client_id}`]);
    packer.arg(['-var', `client_secret=${client_secret}`]);
    packer.arg(['-var', `subscription_id=${subscription_id}`]);
    packer.arg(['-var', `tenant_id=${tenant_id}`]);

    for (var key in variables) {
        packer.arg(['-var', `${key}=${variables[key]}`])
    }
    packer.line(options);
    packer.arg(template);

    await packer.exec();
}

run().then(_ =>
    tl.setResult(tl.TaskResult.Succeeded, "")
).catch(error =>
    tl.setResult(tl.TaskResult.Failed, error)
);