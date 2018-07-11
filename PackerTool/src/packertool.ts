import * as taskLib from 'vsts-task-lib/task';
import * as toolLib from 'vsts-task-tool-lib/tool';
import * as restm from 'typed-rest-client/RestClient';
import * as os from 'os';
import * as path from 'path';

let osPlat: string = os.platform();
let osArch: string = os.arch();

async function run() {
    try {
        let version = taskLib.getInput('version', true);
        await getNode(version);
    }
    catch (error) {
        taskLib.setResult(taskLib.TaskResult.Failed, error.message);
    }
}

//
// Node versions interface
// see https://nodejs.org/dist/index.json
//
interface INodeVersion {
    version: string,
    files: string[]
}

//
// Basic pattern:
//      if !checkLatest
//          toolPath = check cache
//      if !toolPath
//          if version is a range
//              match = query nodejs.org
//              if !match
//                  fail
//              toolPath = check cache
//          if !toolPath
//              download, extract, and cache
//              toolPath = cacheDir
//      PATH = cacheDir + PATH
//
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
    let extPath: string;
    if (osPlat == 'win32') {
        taskLib.assertAgent('2.115.0');
        extPath = taskLib.getVariable('Agent.TempDirectory');
        if (!extPath) {
            throw new Error('Expected Agent.TempDirectory to be set');
        }

        let _7zPath = path.join(__dirname, '7za.exe');
        extPath = await toolLib.extract7z(downloadPath, extPath, _7zPath);
    }
    else {
        extPath = await toolLib.extractTar(downloadPath);
    }

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