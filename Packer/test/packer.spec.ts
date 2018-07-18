import * as packer from '../src/packer'
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as tr from 'vsts-task-lib/toolrunner'

describe('packer', () => {
    let events: string[];
    let tool: tr.ToolRunner;
    let sandbox = sinon.sandbox.create();

    beforeEach(() => {
        events = [];
        tool = new tr.ToolRunner('echo');
        tool.addListener('stdout', _ => events.push(_));

    });

    afterEach(() => {
        sandbox.restore();
    })

    it ('should add the subscription id, client_id, client_secret and tenant_id', async () => {
        let service = 'my-service';

        let input = sandbox.stub();
        input.withArgs('azureSubscription').returns(service);

        let authorization = sandbox.stub();
        authorization.withArgs(service, 'serviceprincipalid', false).returns('asdf');
        authorization.withArgs(service, 'serviceprincipalkey', false).returns('qwer');
        authorization.withArgs(service, 'tenantid', false).returns('qefda');
        
        let data = sandbox.stub();
        data.withArgs(service, 'SubscriptionId', false).returns('subcriptionasdf');

        let tl = <packer.InputResolver & packer.AzureEndpointParameterResolver>{};
        tl.getInput = input;
        tl.getEndpointAuthorizationParameter = authorization;
        tl.getEndpointDataParameter = data;

        packer.addAzureVariables(tool, tl);
        sinon.assert.called(authorization);
        sinon.assert.called(data);

        await tool.exec();

        let output = toOutput(events);
        expect(output).to.match(/-var tenant_id=qefda/);
        expect(output).to.match(/-var client_id=asdf/);
        expect(output).to.match(/-var client_secret=qwer/);
        expect(output).to.match(/-var subscription_id=subcriptionasdf/);      
    });

    it ('should add force when enabled', async () => {
        let stub = sandbox.stub();
        stub.withArgs("force").returns(true);

        let tl = <packer.InputResolver>{};
        tl.getBoolInput = stub;
        
        packer.addForce(tool, tl);
        await tool.exec();

        expect(toOutput(events)).to.match(/-force/)
    });

    it ('should not add force when disabled', async () => {
        let stub = sandbox.stub();
        stub.withArgs("force").returns(false);

        let tl = <packer.InputResolver>{};
        tl.getBoolInput = stub;

        packer.addForce(tool, tl);
        await tool.exec();

        expect(toOutput(events)).to.not.match(/-force/)
    });

    it ('should add variables file when specified', async () => {
        let supplied = sandbox.stub();
        supplied.withArgs('variables-file').returns(true);

        let path = sandbox.stub();
        path.withArgs('variables-file', false, true).returns('asdf.json');

        let tl = <packer.PathResolver>{};
        tl.filePathSupplied = supplied;
        tl.getPathInput = path;
        
        packer.addVariablesFile(tool, tl);
        await tool.exec();

        expect(toOutput(events)).to.match(/-var-file asdf.json/)
    });

    it ('should not add variables file when not specified', async () => {
        let tl = <packer.PathResolver>{};
        tl.filePathSupplied = sandbox.stub().returns(false);
        tl.getPathInput = sandbox.stub().returns('asdf.json');
        
        packer.addVariablesFile(tool, tl);
        await tool.exec();

        expect(toOutput(events)).to.not.match(/-var-file asdf.json/)
    });

    it ('should add options', async () => {
        let stub = sandbox.stub();
        stub.withArgs('options').returns('--color=false');
        
        let tl = <packer.InputResolver>{};
        tl.getInput = stub;

        packer.addOptions(tool, tl);
        await tool.exec();

        expect(toOutput(events)).to.match(/-color=false/)
    });

    it ('should add template', async () => {
        let stub = sandbox.stub();
        stub.withArgs('templatePath', true, true).returns('my-custom-packer-template.json');

        let tl = <packer.PathResolver>{};
        tl.getPathInput = stub;

        packer.addTemplate(tool, tl);
        await tool.exec();

        sinon.assert.called(stub);
        expect(toOutput(events)).to.match(/my-custom-packer-template.json/)
    });

    it ('should add variables', async () => {
        let stub = sandbox.stub();
        stub.withArgs('variables', '\n', false).returns(['a=1', 'b=2']);

        let tl = <packer.InputResolver>{};
        tl.getDelimitedInput = stub;

        packer.addVariables(tool, tl);
        await tool.exec();

        let output = toOutput(events);
        expect(output).to.match(/-var a=1/);
        expect(output).to.match(/-var b=2/);
    });

    it ('should add the command', async () => {
        let stub = sandbox.stub();
        stub.withArgs('command').returns('build');

        let tl = <packer.InputResolver>{};
        tl.getInput = stub;

        packer.addCommand(tool, tl);
        await tool.exec();

        sinon.assert.called(stub);
        expect(toOutput(events)).to.match(/build/)
    });

    function toOutput(events: string[]) {
        expect(events.length).to.eq(1);
        return events[0].toString();
    }
});


