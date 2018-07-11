import tool from '../src/packertool';
import { expect } from 'chai';

describe('prepare download link', () => {
    it('constructs a link from version, os and arch', () => {
        expect(tool('1.2.4', 'win32', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.4/packer_1.2.4_windows_amd64.zip')
    });

    it('works for other os', () => {
        expect(tool('1.2.4', 'linux', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.4/packer_1.2.4_linux_amd64.zip')
    });

    it('works for other version', () => {
        expect(tool('1.2.3', 'linux', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_linux_amd64.zip')
    });

    it('maps arch x64 to amd64', () => {
        expect(tool('1.2.3', 'linux', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_linux_amd64.zip')
    });

    it('maps arch x32 to 386 for some reason', () => {
        expect(tool('1.2.3', 'linux', 'x32')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_linux_386.zip')
    });
});