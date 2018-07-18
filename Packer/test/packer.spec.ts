import * as packer from '../src/packer'
import * as tl from 'vsts-task-lib';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as mtr from 'vsts-task-lib/mock-toolrunner';
import * as tr from 'vsts-task-lib/toolrunner'
import assert = require('assert');

describe('azure variables', () => {
    it ('should add the subscription id, client_id, client_secret and tenant_id', async () => {
        let events = [];
        let tool = new tr.ToolRunner('echo');
        tool.addListener('stdout', _ => events.push(_));

        let service = 'my-service';
        let input = sinon.stub(tl, "getInput").returns(service);
        let authorization = sinon.stub(tl, "getEndpointAuthorizationParameter");
        authorization.withArgs(service, 'serviceprincipalid', false).returns('asdf');
        authorization.withArgs(service, 'serviceprincipalkey', false).returns('qwer');
        authorization.withArgs(service, 'tenantid', false).returns('qefda');
        let data = sinon.stub(tl, "getEndpointDataParameter").returns('subcriptionasdf');

        packer.addAzureVariables(<tr.ToolRunner><any>tool, tl);
        sinon.assert.called(input);
        sinon.assert.called(authorization);
        sinon.assert.called(data);

        await tool.exec();

        expect(events.length).to.eq(1);
        let output = events[0].toString();
        expect(output).to.match(/tenant_id=qefda/);
        expect(output).to.match(/client_id=asdf/);
        expect(output).to.match(/client_secret=qwer/);
        expect(output).to.match(/subscription_id=subcriptionasdf/);      
    });
});
