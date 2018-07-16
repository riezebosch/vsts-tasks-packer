import * as taskLib from 'vsts-task-lib/task';
import * as toolLib from 'vsts-task-tool-lib/tool';
import * as os from 'os';

async function run() {
    try {
        let version = taskLib.getInput('version', true);
        await getNode(version);
    }
    catch (error) {
        taskLib.setResult(taskLib.TaskResult.Failed, error.message);
    }
}

async function getNode(version: string) {
    // check cache
    let toolPath: string = toolLib.findLocalTool('packer', version);

    if (!toolPath) {
        toolPath = await acquireNode(version);
    }

    //
    // prepend the tools path. instructs the agent to prepend for future tasks
    //
    toolLib.prependPath(toolPath);
}

async function acquireNode(version: string): Promise<string> {
    //
    // Download - a tool installer intimately knows how to get the tool (and construct urls)
    //
    version = toolLib.cleanVersion(version);
    let downloadUrl = downloadLink(version, os.platform(), os.arch())

    let downloadPath = await toolLib.downloadTool(downloadUrl);
    
    //
    // Extract
    //
    let extPath: string = await toolLib.extractZip(downloadPath);

    //
    // Install into the local tool cache
    //
    return await toolLib.cacheDir(extPath, 'packer', version);
}

run();

export default function downloadLink(version: string, os: string, arch: string): string {
    if (os == 'win32') {
        os = 'windows';
    }

    if (arch == 'x32') {
        arch = '386';
    } else if (arch == 'x64') {
        arch = 'amd64';
    }

    return `https://releases.hashicorp.com/packer/${version}/packer_${version}_${os}_${arch}.zip`;
}