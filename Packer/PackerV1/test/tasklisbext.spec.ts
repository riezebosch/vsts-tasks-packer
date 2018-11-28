import * as tlext from '../src/tasklibext'
import * as sinon from 'sinon';
import * as internal from 'vsts-task-lib/internal';
import * as stream from 'memory-streams';
import os = require('os');
import { expect } from 'chai';

describe('tasklib extensions', () => {
    let out: NodeJS.WritableStream;

    beforeEach(() => {
        out = new stream.WritableStream();
        internal._setStdStream(out);

        sinon.reset();
    });

    it('should add isOutput to the output of output variables', () => {
        tlext.setVariable('hi', '123');
        expect(out.toString()).to.contain('##vso[task.setvariable variable=hi;isOutput=true;]123' + os.EOL);
    });
});