import * as tlext from '../src/tasklibext'
import * as sinon from 'sinon';
import os = require('os');

describe('tasklib extensions', () => {
    const write = process.stdout.write;
    
    it('should add isOutput to the output of output variables', () => {
        let stub = sinon.stub();

        try {
            process.stdout.write = stub;
        
            tlext.setVariable('hi', '123');
            sinon.assert.calledWith(stub, '##vso[task.setvariable variable=hi;isOutput=true;]123' + os.EOL);
        }
        finally {
            process.stdout.write = write;
        }
    });
});