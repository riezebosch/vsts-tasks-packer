import { downloadLink, getVersion } from '../src/packertool';
import { expect } from 'chai';

describe('PackerTool', () => {
    describe('prepare download link', async () => {
        it('constructs a link from version, os and arch', async () => {
            expect(await downloadLink('1.2.4', 'win32', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.4/packer_1.2.4_windows_amd64.zip')
        });

        it('works for other os', async () => {
            expect(await downloadLink('1.2.4', 'linux', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.4/packer_1.2.4_linux_amd64.zip')
        });

        it('works for other version', async () => {
            expect(await downloadLink('1.2.3', 'linux', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_linux_amd64.zip')
        });

        it('maps arch x64 to amd64', async () => {
            expect(await downloadLink('1.2.3', 'linux', 'x64')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_linux_amd64.zip')
        });

        it('maps arch x32 to 386 for some reason', async () => {
            expect(await downloadLink('1.2.3', 'linux', 'x32')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_linux_386.zip')
        });

        it ('maps ia32 to x86 for windows', async () => {
            expect(await downloadLink('1.2.3', 'windows', 'ia32')).to.eq('https://releases.hashicorp.com/packer/1.2.3/packer_1.2.3_windows_386.zip')
        });
    });

    describe('getVersion', () => {
        it('latest', async () => {
            const pattern = new RegExp('\\d.\\d.\\d')
            expect(await getVersion()).to.match(pattern);
        });
    });
});