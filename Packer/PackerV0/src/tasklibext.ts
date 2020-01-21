import * as tl from 'azure-pipelines-task-lib';

// Temporary solution for passing the isOutput until it is available on the tasklib
// Copied from: https://github.com/Microsoft/vsts-task-lib/blob/3a7905b99d698a535d9f5a477efc124894b8d2ae/node/task.ts#L145
export function setVariable(name: string, value: string) {
    tl.command('task.setvariable', { 'variable': name, 'issecret': false, isOutput: true }, value);
}