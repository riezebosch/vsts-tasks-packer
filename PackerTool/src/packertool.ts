import * as taskLib from 'azure-pipelines-task-lib/task';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as os from 'os';
import fetch from 'cross-fetch';

async function run() {
    try {
        let version = taskLib.getInput('version', false) || await getVersion();
        await getNode(version);
    }
    catch (error) {
        taskLib.setResult(taskLib.TaskResult.Failed, error.message);
    }
}

async function getNode(version: string) {
    let toolPath: string = toolLib.findLocalTool('packer', version);
    if (!toolPath) {
        toolPath = await acquireNode(version);
    }

    toolLib.prependPath(toolPath);
}

async function acquireNode(version: string): Promise<string> {
    version = toolLib.cleanVersion(version);
    let downloadUrl = downloadLink(version, os.platform(), os.arch())

    let downloadPath = await toolLib.downloadTool(await downloadUrl);
    let extPath: string = await toolLib.extractZip(downloadPath);

    return await toolLib.cacheDir(extPath, 'packer', version);
}

run();

export async function downloadLink(version: string, os: string, arch: string): Promise<string> {
    os = getOs(os);
    arch = getArch(arch);

    return `https://releases.hashicorp.com/packer/${version}/packer_${version}_${os}_${arch}.zip`;
}

function getArch(arch: string) {
    if (arch == 'x32' || arch == 'ia32') {
        return '386';
    }

    if (arch == 'x64') {
        return 'amd64';
    }

    return arch;
}

function getOs(os: string) {
    if (os == 'win32') {
        return 'windows';
    }

    return os;
}

export const getVersion = () =>
    fetch('https://checkpoint-api.hashicorp.com/v1/check/packer')
        .then(r => r.json() as any)
        .then(r => r.current_version);
