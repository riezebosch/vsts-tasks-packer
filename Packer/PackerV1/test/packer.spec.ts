import * as task from '../src/packer'
import * as sinon from 'sinon';
import * as lib from 'vsts-task-lib';
import * as libext from '../src/tasklibext'
import * as uuid from 'uuid';
import { ToolRunner } from 'vsts-task-lib/toolrunner';

describe('packer', () => {
    let input = sinon.stub(lib, 'getInput');
    let authorization = sinon.stub(lib, 'getEndpointAuthorizationParameter');
    let endpointData = sinon.stub(lib, 'getEndpointDataParameter');
    let boolInput = sinon.stub(lib, 'getBoolInput');
    let filePathSupplied = sinon.stub(lib, 'filePathSupplied');
    let pathInput = sinon.stub(lib, 'getPathInput');
    let delimitedInput = sinon.stub(lib, 'getDelimitedInput').returns([]);
    let setOutVariable = sinon.stub(libext, 'setVariable');

    let listeners: ({ event: string, listener: (x: string) => void })[] = [];
    let tool = {
        arg: sinon.stub(),
        argIf: sinon.stub(),
        addListener: (event, listener) => listeners.push({ event, listener }),
        line: sinon.stub(),
        exec: () => {}
    };

    sinon.stub(lib, 'tool').withArgs('packer').returns(<ToolRunner><Object>tool);

    beforeEach(() => {
        sinon.resetHistory();
    });

    after(() => {
        sinon.restore();
    })

    it ('should add authorization for aws endpoint when specified', async () => {
        let serviceType = input.withArgs('connectedServiceType', true).returns('aws');

        let id = uuid.v4();
        input.withArgs('connectedServiceAWS').returns(id);
        authorization.withArgs(id, 'username', false).returns('asdf');
        authorization.withArgs(id, 'password', false).returns('qwer');

        await task.run();
        sinon.assert.called(serviceType);
        sinon.assert.called(authorization);

        sinon.assert.calledWith(tool.arg, ['-var', 'access_key=asdf']);
        sinon.assert.calledWith(tool.arg, ['-var', 'secret_key=qwer']);
    });

    it ('should only add authorization for aws endpoint when specified', async () => {
        let serviceType = input.withArgs('connectedServiceType', true).returns('asdf');

        await task.run();
        sinon.assert.called(serviceType);
        sinon.assert.notCalled(authorization);
    });

    it('should add the subscription id, client_id, client_secret and tenant_id', async () => {
        input.withArgs('connectedServiceType', true).returns('azure');

        let id = uuid.v4();
        input.withArgs('connectedServiceAzure').returns(id);
        authorization.withArgs(id, 'serviceprincipalid', false).returns('asdf');
        authorization.withArgs(id, 'serviceprincipalkey', false).returns('qwer');
        authorization.withArgs(id, 'tenantid', false).returns('qefda');
        endpointData.withArgs(id, 'SubscriptionId', false).returns('subcriptionasdf');

        await task.run();
        sinon.assert.called(authorization);
        sinon.assert.called(endpointData);

        sinon.assert.calledWith(tool.arg, ['-var', 'tenant_id=qefda']);
        sinon.assert.calledWith(tool.arg, ['-var', 'tenant_id=qefda']);
        sinon.assert.calledWith(tool.arg, ['-var', 'client_id=asdf']);
        sinon.assert.calledWith(tool.arg, ['-var', 'client_secret=qwer']);
        sinon.assert.calledWith(tool.arg, ['-var', 'subscription_id=subcriptionasdf']);
    });

    it('should add force when enabled', async () => {
        boolInput.withArgs("force").returns(true);
        await task.run();
        sinon.assert.calledWith(tool.argIf, true, '-force');
    });

    it('should not add force when disabled', async () => {
        boolInput.withArgs("force").returns(false);
        await task.run();
        sinon.assert.calledWith(tool.argIf, false, '-force');
    });

    it('should add variables file when specified', async () => {
        filePathSupplied.withArgs('variables-file').returns(true);
        pathInput.withArgs('variables-file', false, true).returns('asdf.json');

        await task.run();
        sinon.assert.calledWith(tool.argIf, true, ['-var-file', 'asdf.json']);
    });

    it('should not add variables file when not specified', async () => {
        filePathSupplied.returns(false);
        pathInput.returns('asdf.json');

        await task.run();
        sinon.assert.neverCalledWith(tool.argIf, false, ['-var-file', 'asdf.json']);
    });

    it('should add options', async () => {
        input.withArgs('options').returns('--color=false');

        await task.run();
        sinon.assert.calledWith(tool.line, '--color=false');
    });

    it('should add template', async () => {
        let stub = pathInput.withArgs('templatePath', true, true).returns('my-custom-packer-template.json');

        await task.run();
        sinon.assert.called(stub);
        sinon.assert.calledWith(tool.arg, 'my-custom-packer-template.json')
    });

    it('should add variables', async () => {
        delimitedInput.withArgs('variables', '\n', false).returns(['a=1', 'b=2']);

        await task.run();
        sinon.assert.calledWith(tool.arg, ['-var', 'a=1']);
        sinon.assert.calledWith(tool.arg, ['-var', 'b=2']);
    });

    it('should add the command', async () => {
        let stub = input.withArgs('command').returns('build');

        await task.run();
        sinon.assert.called(stub);
        sinon.assert.calledWith(tool.arg, 'build');
    });

    it('should output the OSDiskUri', async () => {
        await checkVariable('OSDiskUri');
    });

    it('should output the OSDiskUriReadOnlySas', async () => {
        await checkVariable('OSDiskUriReadOnlySas');
    });

    it('should output the TemplateUri', async () => {
        await checkVariable('TemplateUri');
    });

    it('should output the TemplateUriReadOnlySas', async () => {
        await checkVariable('TemplateUriReadOnlySas');
    });

    it('should only outputs wellknown variables', async () => {
        let data = uuid.v4();
        tool.exec = () => listeners.filter(_ => _.event == 'stdout').forEach(_ => _.listener(`asdf: ${data}`));

        await task.run();
        sinon.assert.notCalled(setOutVariable);
    });

    it('should disable color by default', async () => {
        await task.run();
        sinon.assert.calledWith(tool.arg, '-color=false');
    });

    it('should only disable color for build command', async () => {
        input.withArgs('command').returns('inspect');

        await task.run();
        sinon.assert.neverCalledWith(tool.arg, '-color=false');
    });

    async function checkVariable(variable: string) {
        let data = uuid.v4();
        tool.exec = () => listeners.filter(_ => _.event == 'stdout').forEach(_ => _.listener(`${variable}: ${data}`));

        await task.run();
        sinon.assert.calledWithMatch(setOutVariable, variable, data);
    }
});